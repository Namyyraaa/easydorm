<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id','dorm_id','block_id','room_id','title','description','status',
        'reviewed_at','in_progress_at','completed_at',
        'reviewed_by','in_progress_by','completed_by',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'in_progress_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_SUBMITTED,
            self::STATUS_REVIEWED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_COMPLETED,
        ];
    }

    public function student(): BelongsTo { return $this->belongsTo(User::class,'student_id'); }
    public function dorm(): BelongsTo { return $this->belongsTo(Dorm::class); }
    public function block(): BelongsTo { return $this->belongsTo(Block::class); }
    public function room(): BelongsTo { return $this->belongsTo(Room::class); }
    public function media(): HasMany { return $this->hasMany(MaintenanceRequestMedia::class); }
    public function reviewedBy(): BelongsTo { return $this->belongsTo(User::class,'reviewed_by'); }
    public function inProgressBy(): BelongsTo { return $this->belongsTo(User::class,'in_progress_by'); }
    public function completedBy(): BelongsTo { return $this->belongsTo(User::class,'completed_by'); }

    public function transitionStatus(string $to, ?int $actorUserId = null): void
    {
        if (!in_array($to, self::allowedStatuses(), true)) {
            throw new \InvalidArgumentException('Invalid status');
        }
        $current = $this->status;
        $order = array_flip(self::allowedStatuses());
        if ($order[$to] < $order[$current]) {
            // disallow backwards
            return; // silently ignore or throw depending on policy
        }
        $this->status = $to;
        $now = now();
        if ($to === self::STATUS_REVIEWED && !$this->reviewed_at) {
            $this->reviewed_at = $now;
            if ($actorUserId) $this->reviewed_by = $actorUserId;
        }
        if ($to === self::STATUS_IN_PROGRESS && !$this->in_progress_at) {
            $this->in_progress_at = $now;
            if ($actorUserId) $this->in_progress_by = $actorUserId;
        }
        if ($to === self::STATUS_COMPLETED && !$this->completed_at) {
            $this->completed_at = $now;
            if ($actorUserId) $this->completed_by = $actorUserId;
        }
        $this->save();
    }

    /**
     * Force set status (allows backwards) and clear future timestamps accordingly.
     */
    public function forceSetStatus(string $to): void
    {
        if (!in_array($to, self::allowedStatuses(), true)) {
            throw new \InvalidArgumentException('Invalid status');
        }
        $this->status = $to;
        // Clear timestamps that should not be set beyond the current status
        if ($to === self::STATUS_SUBMITTED) {
            $this->reviewed_at = null;
            $this->in_progress_at = null;
            $this->completed_at = null;
            // clear actor ids
            $this->reviewed_by = null;
            $this->in_progress_by = null;
            $this->completed_by = null;
        } elseif ($to === self::STATUS_REVIEWED) {
            if (!$this->reviewed_at) { $this->reviewed_at = now(); }
            $this->in_progress_at = null;
            $this->completed_at = null;
            // clear downstream actor ids
            $this->in_progress_by = null;
            $this->completed_by = null;
        } elseif ($to === self::STATUS_IN_PROGRESS) {
            if (!$this->reviewed_at) { $this->reviewed_at = now(); }
            if (!$this->in_progress_at) { $this->in_progress_at = now(); }
            $this->completed_at = null;
            // clear completed actor id
            $this->completed_by = null;
        } elseif ($to === self::STATUS_COMPLETED) {
            if (!$this->reviewed_at) { $this->reviewed_at = now(); }
            if (!$this->in_progress_at) { $this->in_progress_at = now(); }
            if (!$this->completed_at) { $this->completed_at = now(); }
        }
        $this->save();
    }

    public function previousStatus(): ?string
    {
        $order = self::allowedStatuses();
        $index = array_search($this->status, $order, true);
        if ($index === false || $index === 0) return null;
        return $order[$index - 1];
    }
}
