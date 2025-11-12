<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\Room;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryStockController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return Inertia::render('Staff/InventoryStock', [
                'error' => 'You are not assigned to any dorm.',
                'dorm' => null,
                'items' => [],
                'central' => [],
                'rooms' => [],
            ]);
        }
        $dormId = $staff->dorm_id;

        // Catalog items (active only) scoped to dorm
        $items = InventoryItem::active()->where('dorm_id', $dormId)->orderBy('name')->get(['id','name','sku','quantity','type']);

        // Central store from items.quantity
        $central = $items->map(function ($it) {
            return [
                'id' => $it->id,
                'item' => [ 'name' => $it->name, 'sku' => $it->sku ],
                'quantity' => $it->quantity,
            ];
        });

        // Room-level stock: join rooms for block + room number
        $roomStocks = InventoryStock::where('dorm_id', $dormId)
            ->with(['item:id,name,sku','room:id,room_number,block_id','room.block:id,name'])
            ->get(['id','item_id','room_id','quantity']);

        // Optionally supply a matrix of room + items even if zero (can be filled client side)
        $rooms = Room::where('dorm_id', $dormId)
            ->with('block:id,name')
            ->orderBy('block_id')
            ->orderBy('room_number')
            ->get(['id','block_id','room_number']);

        return Inertia::render('Staff/Inventories/Stock', [
            'dorm' => $staff->dorm->only(['id','name','code']),
            'items' => $items,
            'central' => $central,
            'roomStocks' => $roomStocks,
            'rooms' => $rooms,
        ]);
    }
}
