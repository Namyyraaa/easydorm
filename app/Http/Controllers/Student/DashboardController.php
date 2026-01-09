<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventRegistration;
use App\Models\Fine;
use App\Models\MaintenanceRequest;
use App\Models\ResidentAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $now = now();
        $yearStart = $now->copy()->startOfYear();
        $yearEnd = $now->copy()->endOfYear();

        // Active residency assignment (if any)
        $assignment = ResidentAssignment::query()
            ->with(['dorm', 'block', 'room', 'assignedByUser'])
            ->where('student_id', $user->id)
            ->active()
            ->orderByDesc('assigned_at')
            ->first();

        $isResident = (bool) $assignment;

        // Event progress (current year by event starts_at)
        $registeredEventIds = EventRegistration::query()
            ->where('user_id', $user->id)
            ->whereHas('event', function ($q) use ($yearStart, $yearEnd) {
                $q->whereBetween('starts_at', [$yearStart, $yearEnd]);
            })
            ->pluck('event_id');

        $registeredCount = $registeredEventIds->count();

        $attendedCount = EventAttendance::query()
            ->where('user_id', $user->id)
            ->whereIn('event_id', $registeredEventIds)
            ->whereHas('event', function ($q) use ($yearStart, $yearEnd) {
                $q->whereBetween('starts_at', [$yearStart, $yearEnd]);
            })
            ->count();

        // Upcoming registered event (nearest future)
        $upcomingRegisteredEvent = Event::query()
            ->whereIn('id', $registeredEventIds)
            ->where('starts_at', '>=', $now)
            ->orderBy('starts_at')
            ->first(['id','name','starts_at','ends_at']);

        // Stats limited to this student
        $maintenanceStats = MaintenanceRequest::query()
            ->selectRaw('status, COUNT(*) as count')
            ->where('student_id', $user->id)
            ->groupBy('status')
            ->get()
            ->map(function ($row) { return ['status' => $row->status, 'count' => (int) $row->count]; });

        $complaintStats = Complaint::query()
            ->selectRaw('status, COUNT(*) as count')
            ->where('student_id', $user->id)
            ->groupBy('status')
            ->get()
            ->map(function ($row) { return ['status' => $row->status, 'count' => (int) $row->count]; });

        // Fines by status (student only)
        $fineRows = Fine::query()
            ->where('student_id', $user->id)
            ->get(['status','amount_rm','issued_at','paid_at','waived_at']);

        $fineByStatus = [
            'paid' => ['label' => 'Paid', 'count' => 0, 'amount' => 0.0],
            'waived' => ['label' => 'Waived', 'count' => 0, 'amount' => 0.0],
            'unpaid' => ['label' => 'Unpaid', 'count' => 0, 'amount' => 0.0],
            'pending' => ['label' => 'Pending', 'count' => 0, 'amount' => 0.0],
        ];
        $fineCreated = ['label' => 'Created', 'count' => 0, 'amount' => 0.0];
        foreach ($fineRows as $f) {
            $fineCreated['count'] += 1;
            $fineCreated['amount'] += (float) $f->amount_rm;
            $key = $f->status;
            if (isset($fineByStatus[$key])) {
                $fineByStatus[$key]['count'] += 1;
                $fineByStatus[$key]['amount'] += (float) $f->amount_rm;
            }
        }
        $fineStats = array_values($fineByStatus);
        $fineStats[] = $fineCreated; // include total created for center text if needed

        return Inertia::render('Student/Dashboard', [
            'user' => $user,
            'resident' => $isResident,
            'residency' => $assignment ? [
                'dorm' => [
                    'name' => $assignment->dorm->name ?? null,
                    'code' => $assignment->dorm->code ?? null,
                ],
                'block' => $assignment->block ? ['name' => $assignment->block->name] : null,
                'room' => $assignment->room ? ['number' => $assignment->room->room_number] : null,
                'check_in_date' => optional($assignment->check_in_date)->toDateString(),
                'check_out_date' => optional($assignment->check_out_date)->toDateString(),
                'assigned_by' => $assignment->assignedByUser?->name,
                'is_active' => (bool) $assignment->is_active,
            ] : null,
            'eventProgress' => [
                'year' => $yearStart->year,
                'registered' => $registeredCount,
                'attended' => $attendedCount,
            ],
            'upcomingRegisteredEvent' => $upcomingRegisteredEvent,
            'maintenanceStats' => $maintenanceStats,
            'complaintStats' => $complaintStats,
            'fineStats' => $fineStats,
            'routes' => [
                'eventsIndex' => route('student.events.index'),
                'eventsShow' => url('/student/events'), // use /student/events/{id}
                'maintenanceIndex' => route('student.maintenance.index'),
                'complaintsIndex' => route('student.complaints.index'),
                'finesIndex' => route('student.fines.index'),
            ],
        ]);
    }
}
