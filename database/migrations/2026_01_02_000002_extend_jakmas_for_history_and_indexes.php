<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jakmas', function (Blueprint $table) {
            try { $table->index('user_id', 'jakmas_user_id_index'); } catch (\Throwable $e) {}

            if (!Schema::hasColumn('jakmas', 'assigned_at')) {
                $table->timestamp('assigned_at')->nullable()->after('dorm_id');
            }
            if (!Schema::hasColumn('jakmas', 'assigned_by')) {
                $table->foreignId('assigned_by')->nullable()->after('assigned_at')->constrained('users');
            }
            if (!Schema::hasColumn('jakmas', 'revoked_at')) {
                $table->timestamp('revoked_at')->nullable()->after('assigned_by');
            }
            if (!Schema::hasColumn('jakmas', 'revoked_by')) {
                $table->foreignId('revoked_by')->nullable()->after('revoked_at')->constrained('users');
            }
        });

        try {
            Schema::table('jakmas', function (Blueprint $table) {
                $table->dropUnique('jakmas_unique_user');
            });
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        Schema::table('jakmas', function (Blueprint $table) {
            if (Schema::hasColumn('jakmas', 'revoked_by')) {
                $table->dropConstrainedForeignId('revoked_by');
            }
            if (Schema::hasColumn('jakmas', 'revoked_at')) {
                $table->dropColumn('revoked_at');
            }
            if (Schema::hasColumn('jakmas', 'assigned_by')) {
                $table->dropConstrainedForeignId('assigned_by');
            }
            if (Schema::hasColumn('jakmas', 'assigned_at')) {
                $table->dropColumn('assigned_at');
            }

            try { $table->dropIndex('jakmas_user_id_index'); } catch (\Throwable $e) {}

            try { $table->unique(['user_id'], 'jakmas_unique_user'); } catch (\Throwable $e) {}
        });
    }
};
