<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('fine_evidences')) {
            Schema::create('fine_evidences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('fine_id')->constrained('fines')->onDelete('cascade');
                $table->string('type')->nullable(); // image|file
                $table->string('path');
                $table->string('original_filename')->nullable();
                $table->string('mime_type', 191)->nullable();
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->unsignedInteger('width')->nullable();
                $table->unsignedInteger('height')->nullable();
                $table->timestamps();
            });
        }

        // Migrate existing non-payment media to evidences if legacy table exists
        if (Schema::hasTable('fine_media') && Schema::hasTable('fine_evidences')) {
            $rows = DB::table('fine_media')->whereIn('type', ['image','file'])->get();
            foreach ($rows as $r) {
                DB::table('fine_evidences')->insert([
                    'fine_id' => $r->fine_id,
                    'type' => $r->type,
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

            // Refresh evidence_count on fines
            DB::statement('UPDATE fines f
                LEFT JOIN (
                    SELECT fine_id, COUNT(*) AS cnt FROM fine_evidences GROUP BY fine_id
                ) fe ON fe.fine_id = f.id
                SET f.evidence_count = COALESCE(fe.cnt, 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fine_evidences');
    }
};
