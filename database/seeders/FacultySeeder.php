<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Faculty;

class FacultySeeder extends Seeder
{
    public function run(): void
    {
        $faculties = [
            ['name' => 'Fakulti Kejuruteraan', 'code' => 'FKJ'],
            ['name' => 'Fakulti Psikologi dan Pendidikan', 'code' => 'FPP'],
            ['name' => 'Fakulti Sains dan Sumber Alam', 'code' => 'FSSA'],
            ['name' => 'Fakulti Komputeran dan Informatik', 'code' => 'FKI'],
            ['name' => 'Fakulti Komputeran dan Informatik Kampus Antarabangsa Labuan', 'code' => 'FKI-KAL'],
            ['name' => 'Akademi Seni dan Teknologi Kreatif', 'code' => 'ASTiF'],
            ['name' => 'Fakulti Sains Makanan dan Pemakanan', 'code' => 'FSMP'],
            ['name' => 'Fakulti Perniagaan, Ekonomi dan Perakaunan', 'code' => 'FPEP'],
            ['name' => 'Fakulti Pertanian Lestari', 'code' => 'FPL'],
            ['name' => 'Fakulti Perubatan dan Sains Kesihatan', 'code' => 'FPSK'],
            ['name' => 'Fakulti Kewangan Antarabangsa Labuan', 'code' => 'FKAL'],
            ['name' => 'Fakulti Psikologi dan Kerja Sosial', 'code' => 'FPKS'],
        ];

        foreach ($faculties as $f) {
            Faculty::updateOrCreate(['code' => $f['code']], [
                'name' => $f['name'],
                'is_active' => true,
            ]);
        }
    }
}
