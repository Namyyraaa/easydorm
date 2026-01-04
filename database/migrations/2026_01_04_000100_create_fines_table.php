<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('fines')) {
            return;
        }
        Schema::create('fines', function (Blueprint $table) {
            $table->id();
            $table->string('fine_code')->unique();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->foreignId('block_id')->constrained('dorm_blocks')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('issued_by_staff_id')->constrained('staff')->cascadeOnDelete();
            $table->string('category');
            $table->decimal('amount_rm', 10, 2);
            $table->text('reason')->nullable();
            $table->date('offence_date');
            $table->date('due_date');
            $table->string('status')->default('unpaid'); // unpaid, paid, waived
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('waived_at')->nullable();
            $table->unsignedInteger('evidence_count')->default(0);
            $table->timestamps();

            $table->index(['student_id']);
            $table->index(['dorm_id', 'block_id', 'room_id']);
            $table->index(['category']);
            $table->index(['status']);
            $table->index(['due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fines');
    }
};
