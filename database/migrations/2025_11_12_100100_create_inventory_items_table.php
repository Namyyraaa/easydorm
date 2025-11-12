<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('inventory_categories')->nullOnDelete();
            $table->foreignId('dorm_id')->constrained('dorms')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('sku', 100)->nullable()->unique(); // item-level code
            $table->enum('type', ['consumable','durable'])->default('durable');
            // Central store remaining quantity for this item within the dorm
            $table->unsignedBigInteger('quantity')->default(0);
            $table->boolean('is_active')->default(true);

            // Audit fields
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['dorm_id','category_id','is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
