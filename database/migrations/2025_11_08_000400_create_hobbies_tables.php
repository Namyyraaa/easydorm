<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hobbies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_hobby', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('hobby_id')->constrained('hobbies')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'hobby_id']);
            $table->index('hobby_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_hobby');
        Schema::dropIfExists('hobbies');
    }
};
