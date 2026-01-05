<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('fine_payment_proofs')) {
            Schema::create('fine_payment_proofs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('fine_id')->constrained('fines')->onDelete('cascade');
                $table->string('path');
                $table->string('original_filename')->nullable();
                $table->string('mime_type', 191)->nullable();
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->unsignedInteger('width')->nullable();
                $table->unsignedInteger('height')->nullable();
                $table->timestamps();
            });
        }

        // Migrate existing payment media to payment_proofs if legacy table exists
        if (Schema::hasTable('fine_media') && Schema::hasTable('fine_payment_proofs')) {
            $rows = DB::table('fine_media')->where('type', 'payment')->get();
            foreach ($rows as $r) {
                DB::table('fine_payment_proofs')->insert([
                    'fine_id' => $r->fine_id,
                    'path' => $r->path,
                    'original_filename' => $r->original_filename,
                    'mime_type' => $r->mime_type,
                    'size_bytes' => $r->size_bytes,
                    'width' => $r->width,
                    'height' => $r->height,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fine_payment_proofs');
    }
};
