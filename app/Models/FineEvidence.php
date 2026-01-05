<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FineEvidence extends Model
{
    use HasFactory;

    // Explicit table name because "evidence" is uncountable and Laravel's
    // inflector will otherwise resolve to singular "fine_evidence".
    protected $table = 'fine_evidences';

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
