<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Complaint extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_DROPPED = 'dropped';

    protected $fillable = [
        'student_id',
        'is_anonymous',
        'managed_by_staff_id',
        'dorm_id',
        'block_id',
        'room_id',
        'title',
        'description',
        'status',
        'claimed_at',
        'reviewed_at',
        'in_progress_at',
        'resolved_at',
        'dropped_at',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'claimed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'in_progress_at' => 'datetime',
            'resolved_at' => 'datetime',
            'dropped_at' => 'datetime',
        ];
    }

    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_SUBMITTED,
            self::STATUS_REVIEWED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_RESOLVED,
            self::STATUS_DROPPED,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'managed_by_staff_id');
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

    public function comments(): HasMany
    {
        return $this->hasMany(ComplaintComment::class)->orderBy('created_at');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ComplaintMedia::class);
    }

    public function claimByStaff(Staff $staff): void
    {
        if ($this->managed_by_staff_id) {
            return; // already claimed
        }
        $this->managed_by_staff_id = $staff->id;
        $this->claimed_at = now();
        if ($this->status === self::STATUS_SUBMITTED) {
            $this->status = self::STATUS_REVIEWED;
            $this->reviewed_at = now();
        }
        $this->save();
    }

    public function transitionStatus(string $target): bool
    {
        $current = $this->status;
        $nextMap = [
            self::STATUS_SUBMITTED => self::STATUS_REVIEWED,
            self::STATUS_REVIEWED => self::STATUS_IN_PROGRESS,
            self::STATUS_IN_PROGRESS => self::STATUS_RESOLVED,
            self::STATUS_RESOLVED => null,
            self::STATUS_DROPPED => null,
        ];
        $allowedNext = $nextMap[$current] ?? null;
        if ($allowedNext !== $target) {
            return false;
        }
        $this->status = $target;
        if ($target === self::STATUS_REVIEWED) $this->reviewed_at = now();
        if ($target === self::STATUS_IN_PROGRESS) $this->in_progress_at = now();
        if ($target === self::STATUS_RESOLVED) $this->resolved_at = now();
        $this->save();
        return true;
    }

    /**
     * Get the previous status we are allowed to revert to. Only allow:
     *   resolved -> in_progress
     *   in_progress -> reviewed
     * We never revert reviewed back to submitted, and never revert dropped.
     */
    public function previousRevertableStatus(): ?string
    {
        return match ($this->status) {
            self::STATUS_RESOLVED => self::STATUS_IN_PROGRESS,
            self::STATUS_IN_PROGRESS => self::STATUS_REVIEWED,
            default => null,
        };
    }

    /**
     * Revert one step backwards following the allowed chain. Clears the timestamp for the status
     * we are leaving (resolved_at or in_progress_at) so the timeline reflects current state.
     */
    public function revertOneStep(): bool
    {
        $prev = $this->previousRevertableStatus();
        if (!$prev) {
            return false;
        }
        if ($this->status === self::STATUS_RESOLVED) {
            // Drop resolved_at since we're no longer resolved
            $this->resolved_at = null;
            $this->status = self::STATUS_IN_PROGRESS;
        } elseif ($this->status === self::STATUS_IN_PROGRESS) {
            // Drop in_progress_at since we're reverting to reviewed
            $this->in_progress_at = null;
            $this->status = self::STATUS_REVIEWED;
        } else {
            return false; // safety
        }
        $this->save();
        return true;
    }
}
