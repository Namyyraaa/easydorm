<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitor_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->foreignId('block_id')->constrained('dorm_blocks')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('visitor_name', 150);
            $table->string('company', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->timestamp('arrival_time')->nullable();
            $table->timestamp('out_time')->nullable();
            $table->string('entry_reason', 500)->nullable();
            $table->foreignId('recorded_by_staff_id')->constrained('staff')->cascadeOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['dorm_id', 'block_id']);
            $table->index(['dorm_id', 'out_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitor_logs');
    }
};
