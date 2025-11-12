<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->enum('type', ['receive','assign','transfer','demolish_central','demolish_room','unassign']);
            $table->unsignedInteger('quantity'); // positive

            // Room-level movement within a dorm (nullable depending on type)
            $table->foreignId('from_block_id')->nullable()->constrained('dorm_blocks')->nullOnDelete();
            $table->foreignId('from_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('to_block_id')->nullable()->constrained('dorm_blocks')->nullOnDelete();
            $table->foreignId('to_room_id')->nullable()->constrained('rooms')->nullOnDelete();

            $table->string('reference', 150)->nullable();
            $table->text('note')->nullable();

            $table->foreignId('performed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['item_id','dorm_id','type','performed_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
