<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

class InventoryService
{
    /**
     * Receive new quantity into the dorm's central store (increments item.quantity).
     */
    public function receive(int $itemId, int $dormId, int $quantity, ?string $reference = null, ?string $note = null): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $quantity, $reference, $note) {
            $item = InventoryItem::where('id', $itemId)->where('dorm_id', $dormId)->lockForUpdate()->firstOrFail();
            $item->quantity = ($item->quantity ?? 0) + $quantity;
            $item->save();

            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'receive',
                'quantity' => $quantity,
                'reference' => $reference,
                'note' => $note,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    /**
     * Issue quantity from central dorm store to a specific room.
     */
    public function assignToRoom(int $itemId, int $dormId, int $roomId, int $quantity, ?string $reference = null, ?string $note = null): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $roomId, $quantity, $reference, $note) {
            // subtract from central store (item.quantity)
            $item = InventoryItem::where('id', $itemId)->where('dorm_id', $dormId)->lockForUpdate()->firstOrFail();
            if (($item->quantity ?? 0) < $quantity) {
                throw new InvalidArgumentException('Insufficient central quantity.');
            }
            $item->quantity -= $quantity;
            $item->save();

            // add to room allocation
            $this->bumpRoomAllocation($itemId, $dormId, $roomId, $quantity);

            $roomBlock = DB::table('rooms')->select('block_id')->where('id', $roomId)->first();

            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'assign',
                'quantity' => $quantity,
                'to_block_id' => $roomBlock?->block_id,
                'to_room_id' => $roomId,
                'reference' => $reference,
                'note' => $note,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    /**
     * Transfer quantity between two rooms inside same dorm.
     */
    public function transferRoomToRoom(int $itemId, int $dormId, int $fromRoomId, int $toRoomId, int $quantity, ?string $reference = null): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $fromRoomId, $toRoomId, $quantity, $reference) {
            $this->bumpRoomAllocation($itemId, $dormId, $fromRoomId, -$quantity);
            $this->bumpRoomAllocation($itemId, $dormId, $toRoomId, $quantity);
            $fromBlock = DB::table('rooms')->select('block_id')->where('id', $fromRoomId)->first();
            $toBlock = DB::table('rooms')->select('block_id')->where('id', $toRoomId)->first();
            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'transfer',
                'quantity' => $quantity,
                'from_block_id' => $fromBlock?->block_id,
                'from_room_id' => $fromRoomId,
                'to_block_id' => $toBlock?->block_id,
                'to_room_id' => $toRoomId,
                'reference' => $reference,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    /**
     * Adjust stock up or down at a location (block/room or central store).
     */
    public function demolishCentral(int $itemId, int $dormId, int $quantity, string $reason): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $quantity, $reason) {
            $item = InventoryItem::where('id', $itemId)->where('dorm_id', $dormId)->lockForUpdate()->firstOrFail();
            if (($item->quantity ?? 0) < $quantity) {
                throw new InvalidArgumentException('Insufficient central quantity.');
            }
            $item->quantity -= $quantity;
            $item->save();
            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'demolish_central',
                'quantity' => $quantity,
                'note' => $reason,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    public function demolishRoom(int $itemId, int $dormId, int $roomId, int $quantity, string $reason): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $roomId, $quantity, $reason) {
            $this->bumpRoomAllocation($itemId, $dormId, $roomId, -$quantity);
            $roomBlock = DB::table('rooms')->select('block_id')->where('id', $roomId)->first();
            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'demolish_room',
                'quantity' => $quantity,
                'from_block_id' => $roomBlock?->block_id,
                'from_room_id' => $roomId,
                'note' => $reason,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    public function unassignFromRoom(int $itemId, int $dormId, int $roomId, int $quantity, ?string $reference = null): InventoryTransaction
    {
        $this->assertPositive($quantity);
        return DB::transaction(function () use ($itemId, $dormId, $roomId, $quantity, $reference) {
            // remove from room allocation
            $this->bumpRoomAllocation($itemId, $dormId, $roomId, -$quantity);
            // add back to central
            $item = InventoryItem::where('id', $itemId)->where('dorm_id', $dormId)->lockForUpdate()->firstOrFail();
            $item->quantity = ($item->quantity ?? 0) + $quantity;
            $item->save();
            $roomBlock = DB::table('rooms')->select('block_id')->where('id', $roomId)->first();
            return InventoryTransaction::create([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'type' => 'unassign',
                'quantity' => $quantity,
                'from_block_id' => $roomBlock?->block_id,
                'from_room_id' => $roomId,
                'reference' => $reference,
                'performed_by' => Auth::id(),
            ]);
        });
    }

    /**
     * Internal helper to change stock for a location; uses row lock to prevent race conditions.
     */
    protected function bumpRoomAllocation(int $itemId, int $dormId, int $roomId, int $delta): void
    {
        $row = InventoryStock::where([
            'item_id' => $itemId,
            'dorm_id' => $dormId,
            'room_id' => $roomId,
        ])->lockForUpdate()->first();

        if (!$row) {
            // infer block_id via room relation to satisfy NOT NULL
            $room = DB::table('rooms')->select('block_id')->where('id', $roomId)->first();
            if (!$room) {
                throw new InvalidArgumentException('Room not found');
            }
            $row = new InventoryStock([
                'item_id' => $itemId,
                'dorm_id' => $dormId,
                'block_id' => $room->block_id,
                'room_id' => $roomId,
                'quantity' => 0,
            ]);
        }

        $newQty = $row->quantity + $delta;
        if ($newQty < 0) {
            throw new InvalidArgumentException('Insufficient room allocation for this operation.');
        }
        $row->quantity = $newQty;
        $row->save();
    }

    protected function assertPositive(int $qty): void
    {
        if ($qty <= 0) {
            throw new InvalidArgumentException('Quantity must be positive');
        }
    }
}
