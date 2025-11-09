<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dorm_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->string('name', 50); // e.g., Block A
            $table->enum('gender', ['male','female']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['dorm_id', 'name']);
            $table->index(['dorm_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dorm_blocks');
    }
};
