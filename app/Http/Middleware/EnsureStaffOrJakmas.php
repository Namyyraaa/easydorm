<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffOrJakmas
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(403, 'Authentication required');
        }
        if (!$user->isStaff() && !$user->isJakmas()) {
            abort(403, 'Staff or JAKMAS access required.');
        }
        return $next($request);
    }
}
