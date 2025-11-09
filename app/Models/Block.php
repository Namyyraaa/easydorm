<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Block extends Model
{
    use HasFactory;

    protected $table = 'dorm_blocks';

    protected $fillable = [
        'dorm_id',
        'name',
        'gender',
        'is_active',
    ];

    public function dorm(): BelongsTo
    {
        return $this->belongsTo(Dorm::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'block_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
