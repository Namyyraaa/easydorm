<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('resident_assignments', 'block_id')) {
                $table->foreignId('block_id')->nullable()->after('dorm_id')->constrained('dorm_blocks')->nullOnDelete();
                $table->index('block_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('resident_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('resident_assignments', 'block_id')) {
                $table->dropConstrainedForeignId('block_id');
            }
        });
    }
};
