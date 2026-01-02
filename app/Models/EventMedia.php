<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class EventMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'path',
        'original_name',
    ];

    protected $appends = ['url'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function getUrlAttribute(): string
    {
        // Always use relative URL to avoid cross-origin issues during dev
        return '/storage/'.$this->path;
    }
}
