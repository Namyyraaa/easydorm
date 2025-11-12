<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isSuperAdmin = $user ? (bool) ($user->is_super_admin ?? false) : false;
        $isStaff = $user ? $user->isStaff() : false;
        $isStudent = $user ? (!$isSuperAdmin && !$isStaff) : false;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'isSuperAdmin' => $isSuperAdmin,
                'isStaff' => $isStaff,
                'isStudent' => $isStudent,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
