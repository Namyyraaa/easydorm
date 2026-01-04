<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Fine extends Model
{
    use HasFactory;

    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PAID = 'paid';
    public const STATUS_WAIVED = 'waived';

    public const CATEGORIES = [
        'Late Check-out',
        'Property Damage',
        'Noise Violation',
        'Lost Key',
        'Rule Violation',
    ];

    protected $fillable = [
        'fine_code',
        'dorm_id',
        'block_id',
        'room_id',
        'student_id',
        'issued_by_staff_id',
        'category',
        'amount_rm',
        'reason',
        'offence_date',
        'due_date',
        'status',
        'issued_at',
        'paid_at',
        'waived_at',
        'evidence_count',
    ];

    protected function casts(): array
    {
        return [
            'amount_rm' => 'decimal:2',
            'offence_date' => 'date',
            'due_date' => 'date',
            'issued_at' => 'datetime',
            'paid_at' => 'datetime',
            'waived_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Fine $fine) {
            if (empty($fine->fine_code)) {
                $fine->fine_code = self::generateCode();
            }
            if (empty($fine->status)) {
                $fine->status = self::STATUS_UNPAID;
            }
            if (empty($fine->issued_at)) {
                $fine->issued_at = now();
            }
        });
    }

    public static function generateCode(): string
    {
        return 'FINE-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
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

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'issued_by_staff_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(FineMedia::class);
    }

    public function appeals(): HasMany
    {
        return $this->hasMany(FineAppeal::class, 'fine_id');
    }

    public function scopeInDorm($query, int $dormId)
    {
        return $query->where('dorm_id', $dormId);
    }
}
