<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class FineMedia extends Model
{
    use HasFactory;

    protected $table = 'fine_media';

    protected $fillable = [
        'fine_id',
        'type',
        'path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'width',
        'height',
    ];

    protected $appends = ['url'];

    public function fine(): BelongsTo
    {
        return $this->belongsTo(Fine::class);
    }

    public function getUrlAttribute(): string
    {
        return '/storage/'.$this->path;
    }
}
