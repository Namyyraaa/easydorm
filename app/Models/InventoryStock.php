<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id', 'dorm_id', 'block_id', 'room_id', 'quantity'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function dorm()
    {
        return $this->belongsTo(Dorm::class, 'dorm_id');
    }

    public function block()
    {
        return $this->belongsTo(Block::class, 'block_id');
    }

    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }
}
