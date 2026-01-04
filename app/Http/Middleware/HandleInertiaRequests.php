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
        $isJakmas = $user ? $user->isJakmas() : false;

        $notifications = ['unread' => 0, 'latest' => []];
        if ($user) {
            try {
                $unread = \App\Models\UserNotification::where('user_id', $user->id)->whereNull('read_at')->count();
                $latest = \App\Models\UserNotification::where('user_id', $user->id)->latest()->limit(5)->get(['id','type','data','created_at','read_at']);
                $notifications = [
                    'unread' => $unread,
                    'latest' => $latest,
                ];
            } catch (\Throwable $e) {
                // In case table doesn't exist yet during initial migration
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'isSuperAdmin' => $isSuperAdmin,
                'isStaff' => $isStaff,
                'isStudent' => $isStudent,
                'isJakmas' => $isJakmas,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $notifications,
        ];
    }
}
