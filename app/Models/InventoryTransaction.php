<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id', 'dorm_id', 'type', 'quantity',
        'from_block_id', 'from_room_id', 'to_block_id', 'to_room_id',
        'reference', 'note', 'performed_by'
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function dorm()
    {
        return $this->belongsTo(Dorm::class, 'dorm_id');
    }

    public function fromBlock()
    {
        return $this->belongsTo(Block::class, 'from_block_id');
    }

    public function toBlock()
    {
        return $this->belongsTo(Block::class, 'to_block_id');
    }
}
