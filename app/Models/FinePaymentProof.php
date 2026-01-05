<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinePaymentProof extends Model
{
    use HasFactory;

    protected $table = 'fine_payment_proofs';

    protected $fillable = [
        'fine_id',
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
