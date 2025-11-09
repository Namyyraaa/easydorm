<?php

namespace Database\Seeders;

use App\Models\Dorm;
use Illuminate\Database\Seeder;

class DormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaults = [
            ['code' => 'kktm', 'name' => 'Kolej Kediaman Tun Mustapha'],
            ['code' => 'kktf', 'name' => 'Kolej Kediaman Tun Fuad'],
            ['code' => 'kktpar', 'name' => 'Kolej Kediaman Pengiran Ahmad Raffae'],
            ['code' => 'kkakf', 'name' => 'Kolej Kediaman Antarabangsa Kingfisher'],
        ];

        foreach ($defaults as $d) {
            Dorm::updateOrCreate(['code' => $d['code']], [
                'name' => $d['name'],
            ]);
        }
    }
}
