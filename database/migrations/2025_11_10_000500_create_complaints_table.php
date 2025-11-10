<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_anonymous')->default(false);
            $table->foreignId('managed_by_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('dorm_id')->nullable()->constrained('dorms')->nullOnDelete();
            $table->foreignId('block_id')->nullable()->constrained('dorm_blocks')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('title',150);
            $table->text('description');
            $table->enum('status', ['submitted','reviewed','in_progress','resolved','dropped'])->default('submitted');
            $table->index('status');
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('in_progress_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('dropped_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['managed_by_staff_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
