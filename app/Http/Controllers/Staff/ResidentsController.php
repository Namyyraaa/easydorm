<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Dorm;
use App\Models\Room;
use App\Models\ResidentAssignment;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Exceptions\HttpResponseException;
use Inertia\Inertia;
use Inertia\Response;

class ResidentsController extends Controller
{
    public function index(Request $request): Response
    {
        // Determine staff's active dorm
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        $staffDormId = $staff->dorm_id ?? null;

        // Assumption: students = users who are not super admin and not active staff, and not currently active residents
        $unassignedStudents = User::query()
            ->where(function ($q) {
                $q->whereNull('is_super_admin')->orWhere('is_super_admin', false);
            })
            ->leftJoin('staff as st', function ($join) {
                $join->on('users.id', '=', 'st.user_id')
                    ->whereNull('st.revoked_at')
                    ->where('st.is_active', true);
            })
            ->leftJoin('resident_assignments as ra', function ($join) {
                $join->on('users.id', '=', 'ra.student_id')
                    ->whereNull('ra.revoked_at')
                    ->where('ra.is_active', true);
            })
            ->leftJoin('user_profiles as up', 'users.id', '=', 'up.user_id')
            ->whereNull('st.id')
            ->whereNull('ra.id')
            ->orderBy('users.name')
            ->get(['users.id','users.name','users.email','up.gender']);

        $currentResidents = ResidentAssignment::active()
            ->when($staffDormId, fn ($q) => $q->where('dorm_id', $staffDormId))
            ->with([
                'student:id,name,email',
                'dorm:id,code,name',
                'room:id,block_id,room_number',
                'room.block:id,name'
            ])
            ->orderByDesc('assigned_at')
            ->get(['id','student_id','dorm_id','block_id','room_id','check_in_date','check_out_date']);

        // Rooms in staff's dorm with availability
        $rooms = collect();
        if ($staffDormId) {
            $rooms = Room::active()
                ->where('dorm_id', $staffDormId)
                ->with('block:id,name,gender')
                ->orderBy('block_id')
                ->orderBy('room_number')
                ->get(['id','dorm_id','block_id','room_number','capacity'])
                ->map(function ($room) {
                    $activeCount = ResidentAssignment::active()->where('room_id', $room->id)->count();
                    return [
                        'id' => $room->id,
                        'block' => $room->block?->name,
                        'gender' => $room->block?->gender,
                        'room_number' => $room->room_number,
                        'capacity' => $room->capacity,
                        'available' => max(0, $room->capacity - $activeCount),
                    ];
                });
        }

        return Inertia::render('Staff/Residents', [
            'students' => $unassignedStudents,
            'residents' => $currentResidents,
            'myDorm' => $staff?->dorm?->only(['id','name','code']),
            'rooms' => $rooms,
        ]);
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'room_id' => ['required', 'exists:rooms,id'],
            'check_in_date' => ['required', 'date'],
            'check_out_date' => ['nullable', 'date', 'after_or_equal:check_in_date'],
        ]);

        // Get dorm from staff assignment
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return back()->with('error', 'You are not assigned to any dorm.');
        }
        $dormId = (int)$staff->dorm_id;

        // Prevent assigning if student is already an active resident
        $active = ResidentAssignment::active()->where('student_id', $validated['student_id'])->first();
        if ($active) {
            return back()->with('error', 'This student is already assigned to a room. Please check them out first.');
        }

        // Pre-validate room & gender outside transaction for user-friendly errors
        $room = Room::active()->where('id', $validated['room_id'])->where('dorm_id', $dormId)->first();
        if (!$room) return back()->with('error', 'Selected room not found in your dorm.');
        $studentGender = DB::table('user_profiles')->where('user_id', $validated['student_id'])->value('gender');
        if (!$studentGender) return back()->with('error', 'Student gender not set. Update their profile first.');
        if (!in_array($room->block?->gender, ['unisex', null]) && $room->block?->gender !== $studentGender) {
            return back()->with('error', 'Room gender does not match the student gender.');
        }

        DB::transaction(function () use ($validated, $request, $room) {
            // Capacity check with lock inside transaction
            $activeCount = ResidentAssignment::active()->where('room_id', $room->id)->lockForUpdate()->count();
            if ($activeCount >= $room->capacity) {
                throw new HttpResponseException(back()->with('error', 'No available space in the selected room.'));
            }
            ResidentAssignment::create([
                'student_id' => (int)$validated['student_id'],
                'dorm_id' => (int)$room->dorm_id,
                'room_id' => $room->id,
                'block_id' => $room->block_id,
                'check_in_date' => $validated['check_in_date'],
                'check_out_date' => $validated['check_out_date'] ?? null,
                'assigned_at' => now(),
                'assigned_by' => (int)$request->user()->id,
                'is_active' => true,
            ]);
        });

        return back()->with('success', 'Student assigned to room');
    }

    public function assignBulk(Request $request)
    {
        $validated = $request->validate([
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:users,id'],
            'room_id' => ['required', 'exists:rooms,id'],
            'check_in_date' => ['required', 'date'],
            'check_out_date' => ['nullable', 'date', 'after_or_equal:check_in_date'],
        ]);

        // Get dorm from staff assignment
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return back()->with('error', 'You are not assigned to any dorm.');
        }
        $dormId = (int)$staff->dorm_id;

        $alreadyActive = ResidentAssignment::active()->whereIn('student_id', $validated['student_ids'])->pluck('student_id');
        if ($alreadyActive->isNotEmpty()) {
            return back()->with('error', 'Some selected students are already assigned to rooms. Please check them out first.');
        }

        // Pre-validate room & gender consistency outside transaction
        $room = Room::active()->where('id', $validated['room_id'])->where('dorm_id', $dormId)->first();
        if (!$room) return back()->with('error', 'Selected room not found in your dorm.');
        $firstStudentId = $validated['student_ids'][0] ?? null;
        $bulkGender = $firstStudentId ? DB::table('user_profiles')->where('user_id', $firstStudentId)->value('gender') : null;
        if (!$bulkGender) return back()->with('error', 'First selected student gender not set. Update their profile.');
        $otherGenderCount = DB::table('user_profiles')->whereIn('user_id', $validated['student_ids'])->where('gender', '!=', $bulkGender)->count();
        if ($otherGenderCount > 0) return back()->with('error', 'All selected students must share the same gender.');
        if (!in_array($room->block?->gender, ['unisex', null]) && $room->block?->gender !== $bulkGender) {
            return back()->with('error', 'Room gender does not match selected students gender.');
        }

        DB::transaction(function () use ($validated, $request, $room) {
            $activeCount = ResidentAssignment::active()->where('room_id', $room->id)->lockForUpdate()->count();
            $available = max(0, $room->capacity - $activeCount);
            if ($available <= 0) {
                throw new HttpResponseException(back()->with('error', 'No available space in the selected room.'));
            }
            if (count($validated['student_ids']) > $available) {
                throw new HttpResponseException(back()->with('error', "Only {$available} spaces left in the selected room."));
            }
            foreach ($validated['student_ids'] as $sid) {
                ResidentAssignment::create([
                    'student_id' => (int)$sid,
                    'dorm_id' => (int)$room->dorm_id,
                    'room_id' => $room->id,
                    'block_id' => $room->block_id,
                    'check_in_date' => $validated['check_in_date'],
                    'check_out_date' => $validated['check_out_date'] ?? null,
                    'assigned_at' => now(),
                    'assigned_by' => (int)$request->user()->id,
                    'is_active' => true,
                ]);
            }
        });

        return back()->with('success', 'Students assigned to room');
    }

    public function revoke(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $active = ResidentAssignment::active()->where('student_id', $validated['student_id'])->first();
            if ($active) {
                $active->update([
                    'revoked_at' => now(),
                    'revoked_by' => (int)$request->user()->id,
                    'is_active' => false,
                ]);
            }
        });

        return back()->with('success', 'Resident checked out');
    }

    public function suggestions(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required','integer','exists:users,id'],
        ]);

        $studentId = (int)$data['student_id'];

        // Target profile and hobbies
        $profile = DB::table('user_profiles')->where('user_id', $studentId)->first(['gender','faculty_id','interaction_style','daily_schedule']);
        if (!$profile) {
            return response()->json(['items' => []]);
        }

        $targetHobbyIds = DB::table('user_hobby')->where('user_id', $studentId)->pluck('hobby_id')->all();

        // Build candidate pool: unassigned, non-staff, excluding the target
        $candidates = DB::table('users as u')
            ->leftJoin('staff as st', function ($join) {
                $join->on('u.id', '=', 'st.user_id')
                    ->whereNull('st.revoked_at')
                    ->where('st.is_active', true);
            })
            ->leftJoin('resident_assignments as ra', function ($join) {
                $join->on('u.id', '=', 'ra.student_id')
                    ->whereNull('ra.revoked_at')
                    ->where('ra.is_active', true);
            })
            ->leftJoin('user_profiles as up', 'u.id', '=', 'up.user_id')
            ->where(function ($q) {
                $q->whereNull('u.is_super_admin')->orWhere('u.is_super_admin', false);
            })
            ->whereNull('st.id')
            ->whereNull('ra.id')
            ->where('u.id', '!=', $studentId)
            ->orderBy('u.name')
            ->get(['u.id','u.name','u.email','up.gender','up.faculty_id','up.interaction_style','up.daily_schedule']);

        if ($candidates->isEmpty()) {
            return response()->json(['items' => []]);
        }

        // Load hobbies for all candidates in bulk
        $candidateIds = $candidates->pluck('id')->all();
        $hobbyRows = DB::table('user_hobby')->whereIn('user_id', $candidateIds)->get(['user_id','hobby_id']);
        $hobbyMap = [];
        foreach ($hobbyRows as $row) {
            $hobbyMap[$row->user_id] = $hobbyMap[$row->user_id] ?? [];
            $hobbyMap[$row->user_id][] = (int)$row->hobby_id;
        }

        $targetHobbySet = array_flip(array_map('intval', $targetHobbyIds));

        $items = [];
        foreach ($candidates as $c) {
            $matches = [];
            if (!empty($profile->gender) && $c->gender && $c->gender === $profile->gender) {
                $matches[] = 'gender';
            }
            if (!empty($profile->faculty_id) && $c->faculty_id && (int)$c->faculty_id === (int)$profile->faculty_id) {
                $matches[] = 'faculty';
            }
            if (!empty($profile->interaction_style) && $c->interaction_style && $c->interaction_style === $profile->interaction_style) {
                $matches[] = 'interaction_style';
            }
            if (!empty($profile->daily_schedule) && $c->daily_schedule && $c->daily_schedule === $profile->daily_schedule) {
                $matches[] = 'daily_schedule';
            }
            $candHobbies = $hobbyMap[$c->id] ?? [];
            $hobbyMatch = false;
            foreach ($candHobbies as $hid) {
                if (isset($targetHobbySet[(int)$hid])) { $hobbyMatch = true; break; }
            }
            if ($hobbyMatch) {
                $matches[] = 'hobby';
            }

            if (!empty($matches)) {
                $items[] = [
                    'id' => (int)$c->id,
                    'name' => $c->name,
                    'email' => $c->email,
                    'matches' => $matches,
                    'score' => count($matches),
                ];
            }
        }

        // Sort by score desc then name asc, take top 20
        usort($items, function ($a, $b) {
            if ($a['score'] === $b['score']) return strcmp($a['name'], $b['name']);
            return $a['score'] < $b['score'] ? 1 : -1;
        });
        $items = array_slice($items, 0, 20);

        return response()->json(['items' => $items]);
    }
}
