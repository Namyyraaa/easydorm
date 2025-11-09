<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('resident_assignments', 'room_id')) {
                $table->foreignId('room_id')->nullable()->after('dorm_id')->constrained('rooms')->nullOnDelete();
            }
            $table->index(['room_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('resident_assignments', function (Blueprint $table) {
            $table->dropIndex(['room_id', 'is_active']);
            $table->dropConstrainedForeignId('room_id');
        });
    }
};
