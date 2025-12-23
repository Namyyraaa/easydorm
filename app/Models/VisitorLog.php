<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VisitorLog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'dorm_id',
        'block_id',
        'room_id',
        'visitor_name',
        'company',
        'phone',
        'arrival_time',
        'out_time',
        'entry_reason',
        'recorded_by_staff_id',
    ];

    protected function casts(): array
    {
        return [
            'arrival_time' => 'datetime',
            'out_time' => 'datetime',
        ];
    }

    public function dorm(): BelongsTo
    {
        return $this->belongsTo(Dorm::class);
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(Block::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'recorded_by_staff_id');
    }
}
