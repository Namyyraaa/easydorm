<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('fine_appeal_media')) return;
        Schema::create('fine_appeal_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fine_appeal_id')->constrained('fines_appeals')->cascadeOnDelete();
            $table->string('type'); // image, file
            $table->string('path');
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();

            $table->index(['fine_appeal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fine_appeal_media');
    }
};
