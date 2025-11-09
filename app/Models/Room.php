<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'dorm_id',
        'block_id',
        'room_number',
        'capacity',
        'is_active',
    ];

    public function dorm(): BelongsTo
    {
        return $this->belongsTo(Dorm::class);
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class, 'block_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ResidentAssignment::class, 'room_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
