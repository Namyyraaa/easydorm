<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Jakmas extends Model
{
    use HasFactory;

    protected $table = 'jakmas';

    protected $fillable = [
        'user_id',
        'dorm_id',
        'assigned_at',
        'assigned_by',
        'revoked_at',
        'revoked_by',
        'is_active',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dorm(): BelongsTo
    {
        return $this->belongsTo(Dorm::class);
    }

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'revoked_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at')->where('is_active', true);
    }
}
