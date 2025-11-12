<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->foreignId('block_id')->constrained('dorm_blocks')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(0); // allocation quantity in the room
            $table->timestamps();

            $table->unique(['item_id','dorm_id','room_id']); // block_id implied via room
            $table->index(['dorm_id','room_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_stocks');
    }
};
