<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Jakmas;
use App\Models\ResidentAssignment;
use App\Models\Dorm;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JakmasController extends Controller
{
    public function index(Request $request)
    {
        $staffDormId = optional($request->user()->staff)->dorm_id;
        $staffDorm = $staffDormId ? Dorm::select('id','name')->find($staffDormId) : null;

        // Scope listing to staff's dorm only
        $jakmasQuery = Jakmas::query()
            ->with(['user:id,name,email', 'dorm:id,name', 'revokedBy:id,name'])
            ->orderByDesc('assigned_at');

        if ($staffDormId) {
            $jakmasQuery->where('dorm_id', $staffDormId);
        } else {
            // If staff has no dorm assigned, return empty list
            $jakmasQuery->whereRaw('1 = 0');
        }

        $jakmas = $jakmasQuery->paginate(10);

        // Candidate students: active residents in staff dorm and not active JAKMAS
        $candidateUserIds = ResidentAssignment::query()
            ->active()
            ->where('dorm_id', $staffDormId)
            ->pluck('student_id');

        $activeJakmasUserIds = Jakmas::query()->active()->pluck('user_id');

        $candidates = \App\Models\User::query()
            ->whereIn('id', $candidateUserIds)
            ->whereNotIn('id', $activeJakmasUserIds)
            ->select('id','name','email')
            ->orderBy('name')
            ->get();

        return Inertia::render('Staff/Jakmas/Index', [
            'jakmas' => $jakmas,
            'staffDorm' => $staffDorm,
            'candidates' => $candidates,
        ]);
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required','exists:users,id'],
        ]);

        $staffDormId = optional($request->user()->staff)->dorm_id;
        if (!$staffDormId) {
            return back()->withErrors(['student_id' => 'You are not assigned to a dorm.']);
        }

        // Ensure student is active resident of staff dorm
        $isResident = ResidentAssignment::query()
            ->active()
            ->where('dorm_id', $staffDormId)
            ->where('student_id', $validated['student_id'])
            ->exists();
        if (!$isResident) {
            return back()->withErrors(['student_id' => 'Selected student is not an active resident of your dorm.']);
        }

        // Ensure not already active JAKMAS
        $alreadyActive = Jakmas::query()
            ->active()
            ->where('user_id', $validated['student_id'])
            ->exists();
        if ($alreadyActive) {
            return back()->withErrors(['student_id' => 'Selected student is already an active JAKMAS.']);
        }

        Jakmas::create([
            'user_id' => $validated['student_id'],
            'dorm_id' => $staffDormId,
            'assigned_at' => now(),
            'assigned_by' => $request->user()->id,
            'is_active' => true,
        ]);

        return back()->with('success', 'JAKMAS role assigned.');
    }

    public function revoke(Request $request, Jakmas $jakmas)
    {
        // Only allow revoke by staff of the same dorm
        $staffDormId = optional($request->user()->staff)->dorm_id;
        if (!$staffDormId || $jakmas->dorm_id !== $staffDormId) {
            return back()->withErrors(['revoke' => 'You can only revoke JAKMAS for your dorm.']);
        }

        if (!$jakmas->is_active || $jakmas->revoked_at) {
            return back()->withErrors(['revoke' => 'This JAKMAS is already inactive.']);
        }

        $jakmas->update([
            'revoked_at' => now(),
            'revoked_by' => $request->user()->id,
            'is_active' => false,
        ]);

        return back()->with('success', 'JAKMAS role revoked.');
    }

    public function candidates(Request $request)
    {
        $staffDormId = optional($request->user()->staff)->dorm_id;
        $query = (string) $request->query('q', '');

        $candidateUserIds = ResidentAssignment::query()
            ->active()
            ->where('dorm_id', $staffDormId)
            ->pluck('student_id');

        $activeJakmasUserIds = Jakmas::query()->active()->pluck('user_id');

        $candidates = \App\Models\User::query()
            ->whereIn('id', $candidateUserIds)
            ->whereNotIn('id', $activeJakmasUserIds)
            ->when(strlen($query) > 0, function($q) use ($query) {
                $q->where(function($qq) use ($query) {
                    $qq->where('name', 'like', "%$query%")
                       ->orWhere('email', 'like', "%$query%");
                });
            })
            ->select('id','name','email')
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json($candidates);
    }
}
