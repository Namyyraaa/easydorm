<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Room;
use App\Models\Staff;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryTransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return Inertia::render('Staff/Inventories/Transactions', [
                'error' => 'You are not assigned to any dorm.',
                'transactions' => [],
                'items' => [],
                'blocks' => [],
                'rooms' => [],
            ]);
        }
        $dormId = $staff->dorm_id;

        $items = InventoryItem::active()->where('dorm_id', $dormId)->orderBy('name')->get(['id','name','sku','quantity']);
        $blocks = \App\Models\Block::active()->where('dorm_id', $dormId)->orderBy('name')->get(['id','name']);
        $rooms = Room::where('dorm_id', $dormId)->orderBy('block_id')->orderBy('room_number')->get(['id','room_number','block_id']);

        // Recent transactions for this dorm
        $transactions = InventoryTransaction::with(['item:id,name,sku','performer:id,name'])
            ->where('dorm_id', $dormId)
            ->orderByDesc('id')
            ->limit(200)
            ->get([
                'id','item_id','dorm_id','type','quantity','from_block_id','from_room_id','to_block_id','to_room_id','reference','note','performed_by','created_at'
            ]);

        return Inertia::render('Staff/Inventories/Transactions', [
            'transactions' => $transactions,
            'items' => $items,
            'blocks' => $blocks,
            'rooms' => $rooms,
            'dorm' => $staff->dorm->only(['id','name','code']),
        ]);
    }

    public function receive(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'quantity' => ['required','integer','min:1'],
            'reference' => ['nullable','string','max:150'],
            'note' => ['nullable','string'],
        ]);
        $service->receive($data['item_id'], $staff->dorm_id, (int)$data['quantity'], $data['reference'] ?? null, $data['note'] ?? null);
        return back()->with('success', 'Stock received');
    }

    public function assign(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'block_id' => ['required','exists:dorm_blocks,id'],
            'room_id' => ['required','exists:rooms,id'],
            'quantity' => ['required','integer','min:1'],
            'reference' => ['nullable','string','max:150'],
            'note' => ['nullable','string'],
        ]);
        $room = Room::where('id', $data['room_id'])->where('dorm_id', $staff->dorm_id)->first();
        if (!$room) return back()->with('error', 'Room not in your dorm.');
        if ($room->block_id !== (int)$data['block_id']) return back()->with('error', 'Selected room does not belong to selected block.');
        $service->assignToRoom($data['item_id'], $staff->dorm_id, $room->id, (int)$data['quantity'], $data['reference'] ?? null, $data['note'] ?? null);
        return back()->with('success', 'Item assigned to room');
    }

    public function transfer(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'from_block_id' => ['required','exists:dorm_blocks,id'],
            'from_room_id' => ['required','exists:rooms,id'],
            'to_block_id' => ['required','exists:dorm_blocks,id'],
            'to_room_id' => ['required','exists:rooms,id','different:from_room_id'],
            'quantity' => ['required','integer','min:1'],
            'reference' => ['nullable','string','max:150'],
        ]);
        $fromRoom = Room::where('id', $data['from_room_id'])->where('dorm_id', $staff->dorm_id)->first();
        $toRoom = Room::where('id', $data['to_room_id'])->where('dorm_id', $staff->dorm_id)->first();
        if (!$fromRoom || !$toRoom) return back()->with('error', 'Rooms must be in your dorm.');
        if ($fromRoom->block_id !== (int)$data['from_block_id'] || $toRoom->block_id !== (int)$data['to_block_id']) return back()->with('error', 'Rooms do not belong to selected blocks.');
        $service->transferRoomToRoom($data['item_id'], $staff->dorm_id, $fromRoom->id, $toRoom->id, (int)$data['quantity'], $data['reference'] ?? null);
        return back()->with('success', 'Transfer completed');
    }

    public function demolishCentral(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'quantity' => ['required','integer','min:1'],
            'reason' => ['required','string','max:255'],
        ]);
        $service->demolishCentral($data['item_id'], $staff->dorm_id, (int)$data['quantity'], $data['reason']);
        return back()->with('success', 'Central stock reduced');
    }

    public function demolishRoom(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'block_id' => ['required','exists:dorm_blocks,id'],
            'room_id' => ['required','exists:rooms,id'],
            'quantity' => ['required','integer','min:1'],
            'reason' => ['required','string','max:255'],
        ]);
        $room = Room::where('id', $data['room_id'])->where('dorm_id', $staff->dorm_id)->first();
        if (!$room) return back()->with('error', 'Room not in your dorm.');
        if ($room->block_id !== (int)$data['block_id']) return back()->with('error', 'Selected room does not belong to selected block.');
        $service->demolishRoom($data['item_id'], $staff->dorm_id, $room->id, (int)$data['quantity'], $data['reason']);
        return back()->with('success', 'Room allocation reduced');
    }

    public function unassign(Request $request, InventoryService $service)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');
        $data = $request->validate([
            'item_id' => ['required','exists:inventory_items,id'],
            'block_id' => ['required','exists:dorm_blocks,id'],
            'room_id' => ['required','exists:rooms,id'],
            'quantity' => ['required','integer','min:1'],
            'reference' => ['nullable','string','max:150'],
        ]);
        $room = Room::where('id', $data['room_id'])->where('dorm_id', $staff->dorm_id)->first();
        if (!$room) return back()->with('error', 'Room not in your dorm.');
        if ($room->block_id !== (int)$data['block_id']) return back()->with('error', 'Selected room does not belong to selected block.');
        $service->unassignFromRoom($data['item_id'], $staff->dorm_id, $room->id, (int)$data['quantity'], $data['reference'] ?? null);
        return back()->with('success', 'Items returned to central');
    }
}
