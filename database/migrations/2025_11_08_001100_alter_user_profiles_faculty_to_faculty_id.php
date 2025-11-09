<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('user_profiles', 'faculty')) {
                $table->dropColumn('faculty');
            }
            if (!Schema::hasColumn('user_profiles', 'faculty_id')) {
                $table->foreignId('faculty_id')->nullable()->after('intake_session')->constrained('faculties')->nullOnDelete();
                $table->index('faculty_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('user_profiles', 'faculty_id')) {
                $table->dropConstrainedForeignId('faculty_id');
            }
            if (!Schema::hasColumn('user_profiles', 'faculty')) {
                $table->string('faculty', 100)->nullable()->after('intake_session');
            }
        });
    }
};
