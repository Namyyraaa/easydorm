<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dorm;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DormController extends Controller
{
    public function index(): Response
    {
        // Users who are not currently active staff anywhere
        $assignableUsers = User::query()
            ->leftJoin('staff as s', function ($join) {
                $join->on('users.id', '=', 's.user_id')
                    ->whereNull('s.revoked_at')
                    ->where('s.is_active', true);
            })
            ->whereNull('s.id')
            ->orderBy('users.name')
            ->get(['users.id','users.name','users.email']);

        return Inertia::render('Admin/Dorms', [
            'dorms' => Dorm::withCount(['staff as staff_count' => function ($q) { $q->active(); }])->orderBy('code')->get(),
            'users' => $assignableUsers,
            'staffList' => Staff::active()->with(['user:id,name,email', 'dorm:id,code,name'])->get(['id','user_id','dorm_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:dorms,code'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        Dorm::create($validated);

        return back()->with('success', 'Dorm created');
    }

    public function assignStaff(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'dorm_id' => ['required', 'exists:dorms,id'],
        ]);

        // Prevent assigning if user is currently an active staff
        $active = Staff::active()->where('user_id', $validated['user_id'])->first();
        if ($active) {
            if ($active->dorm_id == $validated['dorm_id']) {
                return back()->with('error', 'This user is already an active staff of this dorm.');
            }
            return back()->with('error', 'This user is currently an active staff of another dorm. Revoke their staff access first.');
        }

        DB::transaction(function () use ($validated, $request) {
            $this->createAssignment((int)$validated['user_id'], (int)$validated['dorm_id'], (int)$request->user()->id);
        });

        return back()->with('success', 'Staff assigned to dorm');
    }

    public function assignStaffBulk(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'dorm_id' => ['required', 'exists:dorms,id'],
        ]);

        // Check all users first; if any are already active staff, abort and notify
        $alreadyActive = Staff::active()->whereIn('user_id', $validated['user_ids'])->get(['user_id']);
        if ($alreadyActive->isNotEmpty()) {
            return back()->with('error', 'Some selected users are currently active staff. Revoke them first before bulk assigning.');
        }

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['user_ids'] as $uid) {
                $this->createAssignment((int)$uid, (int)$validated['dorm_id'], (int)$request->user()->id);
            }
        });

        return back()->with('success', 'Staff assigned to dorm');
    }

    public function revokeStaff(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $active = Staff::active()->where('user_id', $validated['user_id'])->first();
            if ($active) {
                $active->update([
                    'revoked_at' => now(),
                    'revoked_by' => $request->user()->id,
                    'is_active' => false,
                ]);
            }
        });

        return back()->with('success', 'Staff access revoked');
    }

    private function createAssignment(int $userId, int $dormId, int $actorId): void
    {
        Staff::create([
            'user_id' => $userId,
            'dorm_id' => $dormId,
            'assigned_at' => now(),
            'assigned_by' => $actorId,
            'revoked_at' => null,
            'revoked_by' => null,
            'is_active' => true,
        ]);
    }
}
