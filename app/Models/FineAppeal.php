<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FineAppeal extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    protected $table = 'fines_appeals';

    protected $fillable = [
        'fine_id','student_id','reason','status','submitted_at','decided_at','decided_by_staff_id','decision_reason','attachments_count'
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FineAppeal $fa) {
            if (empty($fa->submitted_at)) $fa->submitted_at = now();
            if (empty($fa->status)) $fa->status = self::STATUS_PENDING;
        });

        static::updated(function (FineAppeal $fa) {
            if ($fa->isDirty('status')) {
                // Notify student about decision
                UserNotification::create([
                    'user_id' => (int)$fa->student_id,
                    'type' => 'fine_appeal_decided',
                    'data' => [
                        'fine_id' => (int)$fa->fine_id,
                        'fine_code' => $fa->fine?->fine_code,
                        'status' => $fa->status,
                    ],
                ]);
            }
        });
    }

    public function fine(): BelongsTo
    {
        return $this->belongsTo(Fine::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(FineAppealMedia::class);
    }
}
