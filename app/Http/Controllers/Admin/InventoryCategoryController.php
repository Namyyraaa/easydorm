<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = InventoryCategory::orderBy('name')->get();
        return Inertia::render('Admin/Inventories/Catalog', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100','unique:inventory_categories,name'],
        ]);
        InventoryCategory::create($data + ['is_active' => true]);
        return back()->with('success', 'Category created');
    }

    public function update(Request $request, InventoryCategory $inventoryCategory)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100','unique:inventory_categories,name,' . $inventoryCategory->id],
        ]);
        $inventoryCategory->update($data);
        return back()->with('success', 'Category updated');
    }

    public function toggle(InventoryCategory $inventoryCategory)
    {
        $inventoryCategory->update(['is_active' => !$inventoryCategory->is_active]);
        return back()->with('success', 'Category status updated');
    }
}
