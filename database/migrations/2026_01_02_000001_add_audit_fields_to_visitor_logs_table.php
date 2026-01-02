<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('visitor_logs')) {
            return; // table must exist; skip if not found
        }
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('visitor_logs', 'updated_by_staff_id')) {
                $table->unsignedBigInteger('updated_by_staff_id')->nullable()->after('recorded_by_staff_id');
                $table->foreign('updated_by_staff_id')->references('id')->on('staff')->nullOnDelete();
            }
            if (!Schema::hasColumn('visitor_logs', 'deleted_by_staff_id')) {
                $table->unsignedBigInteger('deleted_by_staff_id')->nullable()->after('updated_by_staff_id');
                $table->foreign('deleted_by_staff_id')->references('id')->on('staff')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('visitor_logs')) {
            return;
        }
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (Schema::hasColumn('visitor_logs', 'updated_by_staff_id')) {
                $table->dropForeign(['updated_by_staff_id']);
                $table->dropColumn('updated_by_staff_id');
            }
            if (Schema::hasColumn('visitor_logs', 'deleted_by_staff_id')) {
                $table->dropForeign(['deleted_by_staff_id']);
                $table->dropColumn('deleted_by_staff_id');
            }
        });
    }
};
