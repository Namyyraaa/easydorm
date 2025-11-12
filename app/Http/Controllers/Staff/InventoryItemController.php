<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\Staff;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryItemController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = \App\Models\Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return Inertia::render('Staff/Inventories/Items', [
                'items' => [],
                'categories' => [],
                'error' => 'You are not assigned to any dorm.',
            ]);
        }
        // Dorm-scoped items only
        $items = InventoryItem::with('category:id,name')
            ->where('dorm_id', $staff->dorm_id)
            ->orderBy('name')
            ->get(['id','category_id','dorm_id','name','sku','type','quantity','is_active']);
        $categories = InventoryCategory::active()->orderBy('name')->get(['id','name']);
        return Inertia::render('Staff/Inventories/Items', [
            'items' => $items,
            'categories' => $categories,
            'dorm' => $staff->dorm->only(['id','name','code']),
        ]);
    }

    public function store(Request $request)
    {
        // Ensure staff is authenticated and active
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');

        $data = $request->validate([
            'name' => ['required','string','max:150'],
            'sku' => ['nullable','string','max:100','unique:inventory_items,sku'],
            'category_id' => ['nullable','exists:inventory_categories,id'],
            'type' => ['required','in:consumable,durable'],
            'initial_quantity' => ['required','integer','min:0'],
            'is_active' => ['boolean'],
        ]);
        $item = InventoryItem::create([
            'category_id' => $data['category_id'] ?? null,
            'dorm_id' => $staff->dorm_id,
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'type' => $data['type'],
            'quantity' => 0, // will be bumped by initial receive transaction if >0
            'is_active' => $data['is_active'] ?? true,
        ]);
        if ($data['initial_quantity'] > 0) {
            app(\App\Services\InventoryService::class)->receive($item->id, $staff->dorm_id, (int)$data['initial_quantity'], 'INITIAL', 'Initial quantity on creation');
        }
        return back()->with('success', 'Item created');
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');

        if ($inventoryItem->dorm_id !== $staff->dorm_id) {
            return back()->with('error', 'Item not in your dorm.');
        }
        $data = $request->validate([
            'name' => ['required','string','max:150'],
            'sku' => ['nullable','string','max:100','unique:inventory_items,sku,' . $inventoryItem->id],
            'category_id' => ['nullable','exists:inventory_categories,id'],
            'type' => ['required','in:consumable,durable'],
            'is_active' => ['boolean'],
        ]);
        $inventoryItem->update([
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'type' => $data['type'],
            'is_active' => $data['is_active'] ?? $inventoryItem->is_active,
        ]);
        return back()->with('success', 'Item updated');
    }

    public function destroy(Request $request, InventoryItem $inventoryItem)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'You are not assigned to any dorm.');

        if ($inventoryItem->dorm_id !== $staff->dorm_id) {
            return back()->with('error', 'Item not in your dorm.');
        }
        try {
            $inventoryItem->delete(); // soft delete sets deleted_by via model event & guard prevents allocations/quantity
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
        return back()->with('success', 'Item deleted');
    }
}
