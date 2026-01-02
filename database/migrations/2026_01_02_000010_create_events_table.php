<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('visibility', ['open','closed'])->default('open');
            $table->enum('type', ['announcement','event'])->default('event');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->dateTime('registration_opens_at')->nullable();
            $table->dateTime('registration_closes_at')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->foreignId('dorm_id')->nullable()->constrained('dorms')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('attendance_password_hash')->nullable();
            $table->timestamps();

            $table->index(['visibility']);
            $table->index(['starts_at', 'ends_at']);
            $table->index(['dorm_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
