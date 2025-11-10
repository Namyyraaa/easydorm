<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudent
{
    /**
     * Block access if the authenticated user has an active staff record.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(403, 'Authentication required');
        }
        // If user is staff (active staff record), they should not access student-only pages
        if ($user->isStaff()) {
            abort(403, 'Student access required');
        }
        return $next($request);
    }
}
