<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FineAppealMedia extends Model
{
    use HasFactory;

    protected $table = 'fine_appeal_media';

    protected $fillable = [
        'fine_appeal_id','type','path','original_filename','mime_type','size_bytes','width','height'
    ];

    public function appeal(): BelongsTo
    {
        return $this->belongsTo(FineAppeal::class, 'fine_appeal_id');
    }
}
