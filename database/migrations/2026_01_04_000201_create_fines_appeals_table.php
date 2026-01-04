<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('fines_appeals')) return;
        Schema::create('fines_appeals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fine_id')->constrained('fines')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->foreignId('decided_by_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('decision_reason')->nullable();
            $table->unsignedInteger('attachments_count')->default(0);
            $table->timestamps();

            $table->index(['fine_id']);
            $table->index(['student_id']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fines_appeals');
    }
};
