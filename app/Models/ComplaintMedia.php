<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintMedia extends Model
{
    use HasFactory;

    protected $table = 'complaint_media';

    protected $fillable = [
        'complaint_id',
        'type',
        'path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'width',
        'height',
    ];

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }
}
