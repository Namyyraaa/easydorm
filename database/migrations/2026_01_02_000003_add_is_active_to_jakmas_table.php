<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jakmas', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('revoked_by');
            $table->index(['user_id', 'is_active'], 'jakmas_user_id_is_active_index');
        });

        DB::table('jakmas')->update([
            'is_active' => DB::raw('CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END'),
        ]);
    }

    public function down(): void
    {
        Schema::table('jakmas', function (Blueprint $table) {
            $table->dropIndex('jakmas_user_id_is_active_index');
            $table->dropColumn('is_active');
        });
    }
};
