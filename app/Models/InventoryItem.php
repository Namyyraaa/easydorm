<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'dorm_id',
        'name',
        'sku',
        'type',
        'quantity',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'quantity' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (InventoryItem $item) {
            if (Auth::check()) {
                $item->created_by = Auth::id();
            }
        });
        static::updating(function (InventoryItem $item) {
            if (Auth::check()) {
                $item->updated_by = Auth::id();
            }
        });
        static::deleting(function (InventoryItem $item) {
            // soft delete only
            if (!$item->isForceDeleting() && Auth::check()) {
                $item->deleted_by = Auth::id();
                // persist deleted_by before soft delete
                $item->save();
            }
            // Prevent soft delete if any allocations exist or central quantity remains
            if (!$item->isForceDeleting()) {
                if ($item->quantity > 0) {
                    throw new \RuntimeException('Cannot delete item while central quantity remains.');
                }
                if ($item->stocks()->exists()) {
                    throw new \RuntimeException('Cannot delete item with room allocations.');
                }
            }
        });
        static::restoring(function (InventoryItem $item) {
            if (Auth::check()) {
                $item->deleted_by = null;
                $item->updated_by = Auth::id();
            }
        });
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function dorm()
    {
        return $this->belongsTo(Dorm::class, 'dorm_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class, 'item_id');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'item_id');
    }

    public function scopeForDorm($query, int $dormId)
    {
        return $query->where('dorm_id', $dormId);
    }
}
