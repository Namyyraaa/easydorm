<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Ensure a non-unique index exists on user_id so FK remains valid when dropping unique
            try { $table->index('user_id', 'staff_user_id_index'); } catch (\Throwable $e) {}

            // Add history columns if missing
            if (!Schema::hasColumn('staff', 'assigned_at')) {
                $table->timestamp('assigned_at')->nullable()->after('dorm_id');
            }
            if (!Schema::hasColumn('staff', 'assigned_by')) {
                $table->foreignId('assigned_by')->nullable()->after('assigned_at')->constrained('users');
            }
            if (!Schema::hasColumn('staff', 'revoked_at')) {
                $table->timestamp('revoked_at')->nullable()->after('assigned_by');
            }
            if (!Schema::hasColumn('staff', 'revoked_by')) {
                $table->foreignId('revoked_by')->nullable()->after('revoked_at')->constrained('users');
            }
        });

        // Drop the unique constraint on user_id to allow multiple historical rows
        try {
            Schema::table('staff', function (Blueprint $table) {
                $table->dropUnique('staff_unique_user');
            });
        } catch (\Throwable $e) {
            // ignore if already dropped
        }
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Remove added columns if present
            if (Schema::hasColumn('staff', 'revoked_by')) {
                $table->dropConstrainedForeignId('revoked_by');
            }
            if (Schema::hasColumn('staff', 'revoked_at')) {
                $table->dropColumn('revoked_at');
            }
            if (Schema::hasColumn('staff', 'assigned_by')) {
                $table->dropConstrainedForeignId('assigned_by');
            }
            if (Schema::hasColumn('staff', 'assigned_at')) {
                $table->dropColumn('assigned_at');
            }

            // Best-effort drop the non-unique index we may have added
            try { $table->dropIndex('staff_user_id_index'); } catch (\Throwable $e) {}

            // Restore the unique constraint on user_id (matches original migration)
            try { $table->unique(['user_id'], 'staff_unique_user'); } catch (\Throwable $e) {}
        });
    }
};
