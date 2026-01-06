<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\ResidentAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        // $staffAssignment = ResidentAssignment::active()->where('student_id', $request->user()->id)->first();
        
        // Actually staff users have staff record; we need dorm via staff model, but fallback if logic differs
        $staff = \App\Models\Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            abort(403, 'Not assigned to a dorm');
        }
        $dormId = $staff->dorm_id;
        $items = MaintenanceRequest::where('dorm_id', $dormId)
            ->with(['student:id,name,email','room:id,room_number','block:id,name'])
            ->orderByDesc('created_at')
            ->get(['id','student_id','dorm_id','block_id','room_id','title','status','created_at']);
        return Inertia::render('Staff/Maintenance/Index', [
            'requests' => $items,
        ]);
    }

    public function show(Request $request, MaintenanceRequest $maintenanceRequest): Response
    {
        $staff = \App\Models\Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $maintenanceRequest->dorm_id) {
            abort(403, 'Not authorized');
        }
        // Auto transition to reviewed if currently submitted
        if ($maintenanceRequest->status === MaintenanceRequest::STATUS_SUBMITTED) {
            $maintenanceRequest->transitionStatus(MaintenanceRequest::STATUS_REVIEWED, $request->user()->id);
        }
        $maintenanceRequest->load([
            'student:id,name,email',
            'media',
            'room:id,room_number',
            'block:id,name',
            'reviewedBy:id,name,email',
            'inProgressBy:id,name,email',
            'completedBy:id,name,email',
        ]);
        return Inertia::render('Staff/Maintenance/Show', [
            'requestItem' => $maintenanceRequest,
        ]);
    }

    public function updateStatus(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        $staff = \App\Models\Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $maintenanceRequest->dorm_id) {
            abort(403, 'Not authorized');
        }
        $data = $request->validate([
            'status' => ['required','in:'.implode(',', MaintenanceRequest::allowedStatuses())]
        ]);
        // Enforce sequential forward transitions only
        $current = $maintenanceRequest->status;
        $nextMap = [
            MaintenanceRequest::STATUS_SUBMITTED => MaintenanceRequest::STATUS_REVIEWED,
            MaintenanceRequest::STATUS_REVIEWED => MaintenanceRequest::STATUS_IN_PROGRESS,
            MaintenanceRequest::STATUS_IN_PROGRESS => MaintenanceRequest::STATUS_COMPLETED,
            MaintenanceRequest::STATUS_COMPLETED => null,
        ];
        $allowedNext = $nextMap[$current] ?? null;
        if ($allowedNext && $data['status'] === $allowedNext) {
            // Ownership rule: Only the staff who set In Progress can Complete
            if ($current === MaintenanceRequest::STATUS_IN_PROGRESS && $allowedNext === MaintenanceRequest::STATUS_COMPLETED) {
                if (!empty($maintenanceRequest->in_progress_by) && $maintenanceRequest->in_progress_by !== $request->user()->id) {
                    return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Only the staff who marked this In Progress can complete it.');
                }
            }
            $maintenanceRequest->transitionStatus($data['status'], $request->user()->id);
            return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('success', 'Status updated');
        }
        return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Invalid transition');
    }

    public function revertStatus(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        $staff = \App\Models\Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $maintenanceRequest->dorm_id) {
            abort(403, 'Not authorized');
        }
        // Disallow reverting Reviewed back to Submitted
        if ($maintenanceRequest->status === MaintenanceRequest::STATUS_REVIEWED) {
            return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Reviewed status cannot be reverted.');
        }

        // Ownership rules for reverting from In Progress or Completed
        if ($maintenanceRequest->status === MaintenanceRequest::STATUS_IN_PROGRESS) {
            if (!empty($maintenanceRequest->in_progress_by) && $maintenanceRequest->in_progress_by !== $request->user()->id) {
                return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Only the staff who marked this In Progress can revert it.');
            }
        }
        if ($maintenanceRequest->status === MaintenanceRequest::STATUS_COMPLETED) {
            if (!empty($maintenanceRequest->completed_by) && $maintenanceRequest->completed_by !== $request->user()->id) {
                return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Only the staff who completed this can revert it.');
            }
        }

        // Compute previous status and set it, clearing later timestamps
        $prev = $maintenanceRequest->previousStatus();
        if (!$prev) {
            return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('error', 'Cannot revert further');
        }
        $maintenanceRequest->forceSetStatus($prev);
        return redirect()->route('staff.maintenance.show', $maintenanceRequest)->with('success', 'Status reverted');
    }
}
