<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->foreignId('block_id')->constrained('dorm_blocks')->cascadeOnDelete();
            $table->string('room_number', 50);
            $table->unsignedTinyInteger('capacity')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['block_id', 'room_number']);
            $table->index(['dorm_id', 'block_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
