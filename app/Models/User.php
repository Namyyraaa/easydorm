<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    /**
     * One-to-one relationship: if present, user is a staff assigned to a dorm.
     */
    public function staff(): HasOne
    {
        // Only treat as staff if there is an active (not revoked) staff record
        return $this->hasOne(\App\Models\Staff::class)
            ->whereNull('revoked_at')
            ->where('is_active', true);
    }

    /**
     * Convenience accessor to check if user is staff.
     */
    public function isStaff(): bool
    {
        return $this->staff()->exists();
    }

    /**
     * One-to-one relationship: if present, user is a JAKMAS assigned to a dorm.
     */
    public function jakmas(): HasOne
    {
        return $this->hasOne(\App\Models\Jakmas::class)
            ->whereNull('revoked_at')
            ->where('is_active', true);
    }

    /**
     * Convenience accessor to check if user is JAKMAS.
     */
    public function isJakmas(): bool
    {
        return $this->jakmas()->exists();
    }

    /**
     * Convenience accessor to check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return (bool) ($this->is_super_admin ?? false);
    }

    public function profile()
    {
        return $this->hasOne(\App\Models\UserProfile::class);
    }

    public function hobbies()
    {
        return $this->belongsToMany(\App\Models\Hobby::class, 'user_hobby')->withTimestamps();
    }

    protected static function booted(): void
    {
        static::created(function (User $user) {
            // Ensure a profile row exists (blank defaults) so downstream logic never fails on missing profile
            if (!$user->profile()->exists()) {
                $user->profile()->create([]);
            }
        });
    }
}
