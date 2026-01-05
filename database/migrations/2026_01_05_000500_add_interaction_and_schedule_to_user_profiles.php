<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('user_profiles', 'interaction_style')) {
                $table->enum('interaction_style', ['quiet_and_independent','friendly_and_interactive','flexible'])->nullable()->after('faculty_id');
                $table->index('interaction_style');
            }
            if (!Schema::hasColumn('user_profiles', 'daily_schedule')) {
                $table->enum('daily_schedule', ['consistent','variable'])->nullable()->after('interaction_style');
                $table->index('daily_schedule');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('user_profiles', 'daily_schedule')) {
                $table->dropIndex(['daily_schedule']);
                $table->dropColumn('daily_schedule');
            }
            if (Schema::hasColumn('user_profiles', 'interaction_style')) {
                $table->dropIndex(['interaction_style']);
                $table->dropColumn('interaction_style');
            }
        });
    }
};
