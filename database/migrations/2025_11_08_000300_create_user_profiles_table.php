<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->enum('gender', ['male','female'])->nullable();
            $table->string('intake_session', 5)->nullable(); // Format: 24/25
            $table->string('faculty', 100)->nullable(); // Simple text for now
            $table->timestamps();

            $table->index('gender');
            $table->index('intake_session');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
