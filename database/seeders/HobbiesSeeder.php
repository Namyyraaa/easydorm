<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class HobbiesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $hobbies = [
            'reading','writing','music','singing','guitar','piano','drums','dancing',
            'gaming','coding','photography','videography','travel','hiking','cycling',
            'running','swimming','yoga','gym','basketball','football','badminton','tennis',
            'table tennis','volleyball','chess','board games','movies','cooking','baking',
            'art','drawing','painting','knitting','sewing','gardening','fishing','camping',
            'volunteering'
        ];

        $rows = [];
        foreach ($hobbies as $name) {
            $rows[] = [
                'name' => strtolower($name),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('hobbies')->upsert($rows, ['name']);
    }
}
