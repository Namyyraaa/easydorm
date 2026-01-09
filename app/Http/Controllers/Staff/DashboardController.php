<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Event;
use App\Models\Fine;
use App\Models\MaintenanceRequest;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $staff = $user->staff()->with('dorm')->firstOrFail();
        $dorm = $staff->dorm;

        $now = now();
        $yearStart = $now->copy()->startOfYear();
        $yearEnd = $now->copy()->endOfYear();

        // Fines statistics for the current year
        $finesCreatedQuery = Fine::query()
            ->where('dorm_id', $dorm->id)
            ->whereBetween('issued_at', [$yearStart, $yearEnd]);
        $createdCount = (clone $finesCreatedQuery)->count();
        $createdAmount = (clone $finesCreatedQuery)->sum('amount_rm');

        $finesPaidQuery = Fine::query()
            ->where('dorm_id', $dorm->id)
            ->where('status', Fine::STATUS_PAID)
            ->whereBetween('paid_at', [$yearStart, $yearEnd]);
        $paidCount = (clone $finesPaidQuery)->count();
        $paidAmount = (clone $finesPaidQuery)->sum('amount_rm');

        $finesWaivedQuery = Fine::query()
            ->where('dorm_id', $dorm->id)
            ->where('status', Fine::STATUS_WAIVED)
            ->whereBetween('waived_at', [$yearStart, $yearEnd]);
        $waivedCount = (clone $finesWaivedQuery)->count();
        $waivedAmount = (clone $finesWaivedQuery)->sum('amount_rm');

        $finesNotPaidQuery = Fine::query()
            ->where('dorm_id', $dorm->id)
            ->whereBetween('issued_at', [$yearStart, $yearEnd])
            ->whereIn('status', [Fine::STATUS_UNPAID, Fine::STATUS_PENDING]);
        $notPaidCount = (clone $finesNotPaidQuery)->count();
        $notPaidAmount = (clone $finesNotPaidQuery)->sum('amount_rm');

        $fineStats = [
            ['label' => 'Created', 'count' => $createdCount, 'amount' => (float) $createdAmount],
            ['label' => 'Paid', 'count' => $paidCount, 'amount' => (float) $paidAmount],
            ['label' => 'Waived', 'count' => $waivedCount, 'amount' => (float) $waivedAmount],
            ['label' => 'Not Paid', 'count' => $notPaidCount, 'amount' => (float) $notPaidAmount],
        ];

        // Upcoming event created by the logged-in staff
        $upcomingEvent = Event::query()
            ->where('created_by', $user->id)
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->withCount('registrations')
            ->first([
                'id',
                'name',
                'visibility',
                'capacity',
                'starts_at',
                'ends_at',
                'registration_opens_at',
                'registration_closes_at',
            ]);

        // Maintenance stats by status (current dorm)
        $maintenanceStatuses = MaintenanceRequest::allowedStatuses();
        $maintenanceCounts = MaintenanceRequest::query()
            ->where('dorm_id', $dorm->id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();
        $maintenanceStats = [];
        foreach ($maintenanceStatuses as $s) {
            $maintenanceStats[] = [
                'status' => $s,
                'count' => (int) ($maintenanceCounts[$s] ?? 0),
            ];
        }

        // Complaint stats by status (current dorm)
        $complaintStatuses = Complaint::allowedStatuses();
        $complaintCounts = Complaint::query()
            ->where('dorm_id', $dorm->id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();
        $complaintStats = [];
        foreach ($complaintStatuses as $s) {
            $complaintStats[] = [
                'status' => $s,
                'count' => (int) ($complaintCounts[$s] ?? 0),
            ];
        }

        // Current visitors not yet checked out (limit to recent)
        $currentVisitors = VisitorLog::query()
            ->where('dorm_id', $dorm->id)
            ->whereNull('out_time')
            ->orderByDesc('arrival_time')
            ->limit(20)
            ->get(['id', 'visitor_name', 'company', 'phone', 'arrival_time', 'block_id', 'room_id']);

        return Inertia::render('Staff/Dashboard', [
            'user' => [
                'name' => $user->name,
            ],
            'staffDorm' => [
                'id' => $dorm->id,
                'name' => $dorm->name,
                'code' => $dorm->code,
            ],
            'fineStats' => $fineStats,
            'upcomingEvent' => $upcomingEvent,
            'maintenanceStats' => $maintenanceStats,
            'complaintStats' => $complaintStats,
            'currentVisitors' => $currentVisitors,
            // Useful paths for client-side navigation
            'routes' => [
                'maintenanceIndex' => route('staff.maintenance.index'),
                'complaintsIndex' => route('staff.complaints.index'),
                'finesIndex' => route('staff.fines.index'),
            ],
        ]);
    }
}
