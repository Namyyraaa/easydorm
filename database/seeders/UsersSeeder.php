<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $names = [
            'Nur Ameera Balqis',
            'Mohd Hafiz Jumahiddin',
            'Ahmad Faiz Zakwan',
            'Nur Edrynna Azwa',
            'Alif Firdaus',
            'Mohd Shahril Nizam',
            'Nur Hazria Jumahiddin',
            'Beldron Feadrek',
            'Allen Paul Justinus Situ',
            'Ilhan Sabli',
            'Nur Izzatti Najwa',
            'Edjuedo Jued',
            'Nor Nilam Sari',
            'Willivia Whitney William',
            'Julian Vanadan Ryman',
            'Oshwelled Josule',
            'Aziz Alias',
            'Khuzairee Ekmal',
            'Pek Chin Yau',
            'Zaeem Zharfan',
            'Nor Asyiqin Rapandi',
            'Farhan Sappri',
            'Iyzman Daniel',
            'Mohd Amir Hamzah',
            'Harith Haiffie',
            'Qistina Izzati',
        ];

        $rows = [];
        foreach ($names as $fullName) {
            $parts = preg_split('/\s+/', trim($fullName));
            if (count($parts) > 2) {
                $local = $parts[1];
            } else {
                $local = $parts[0];
            }
            // sanitize and lowercase
            $local = strtolower(preg_replace('/[^a-z]/i', '', $local));
            if ($local === '') {
                $local = 'user' . substr(md5($fullName), 0, 6);
            }

            $email = $local . '@gmail.com';

            $rows[] = [
                'name' => $fullName,
                'email' => $email,
                'email_verified_at' => $now,
                'password' => Hash::make('securepass123'),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // upsert to avoid duplicate email errors when re-running
        DB::table('users')->upsert($rows, ['email']);
    }
}
