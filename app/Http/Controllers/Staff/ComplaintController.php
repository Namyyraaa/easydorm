<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintComment;
use App\Models\Staff;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplaintController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            abort(403, 'Not assigned to a dorm');
        }
        $items = Complaint::where('dorm_id', $staff->dorm_id)
            ->latest()
            ->with(['manager.user:id,name'])
            ->get(['id','is_anonymous','managed_by_staff_id','title','status','created_at']);
        // Do not expose student identity in staff UI (anonymous-only view)
        return Inertia::render('Staff/Complaints/Index', [
            'items' => $items,
        ]);
    }

    public function show(Request $request, Complaint $complaint): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $complaint->dorm_id) {
            abort(403, 'Not authorized');
        }
        $isManaging = $complaint->managed_by_staff_id === $staff->id;
        $complaint->load(['manager.user:id,name']);
        if ($isManaging) {
            $complaint->load(['comments.user:id,name','media']);

            // If complaint is anonymous, mask the student's name on any comment authored by the student
            if ($complaint->is_anonymous) {
                $masked = $complaint->comments->map(function ($c) use ($complaint) {
                    $name = $c->user ? $c->user->name : null;
                    if ($c->user_id === $complaint->student_id) {
                        $name = 'Anonymous';
                    }
                    return [
                        'id' => $c->id,
                        'body' => $c->body,
                        'created_at' => $c->created_at,
                        'user' => ['name' => $name],
                    ];
                });
                // Replace the comments relation with the masked array so Inertia serializes masked names
                $complaint->setRelation('comments', $masked);
            }
        }
        return Inertia::render('Staff/Complaints/Show', [
            'complaint' => $complaint,
            'isManaging' => $isManaging,
            'managerName' => optional(optional($complaint->manager)->user)->name,
        ]);
    }

    public function claim(Request $request, Complaint $complaint)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $complaint->dorm_id) {
            abort(403, 'Not authorized');
        }
        if ($complaint->managed_by_staff_id && $complaint->managed_by_staff_id !== $staff->id) {
            return back()->with('error','Complaint already managed by another staff');
        }
        if (!$complaint->managed_by_staff_id) {
            $complaint->claimByStaff($staff);
        }
        return back()->with('success','Complaint claimed');
    }

    public function updateStatus(Request $request, Complaint $complaint)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $complaint->dorm_id) {
            abort(403, 'Not authorized');
        }
        if ($complaint->managed_by_staff_id !== $staff->id) {
            abort(403, 'Only managing staff can update status');
        }
        $data = $request->validate([
            'status' => ['required','in:'.implode(',', [Complaint::STATUS_REVIEWED, Complaint::STATUS_IN_PROGRESS, Complaint::STATUS_RESOLVED])]
        ]);
        // Student is the only one who can drop; staff can only move forward sequentially
        $ok = $complaint->transitionStatus($data['status']);
        if (!$ok) {
            return back()->with('error','Invalid status transition');
        }
        return back()->with('success','Status updated');
    }

    public function revertStatus(Request $request, Complaint $complaint)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $complaint->dorm_id) {
            abort(403, 'Not authorized');
        }
        if ($complaint->managed_by_staff_id !== $staff->id) {
            abort(403, 'Only managing staff can revert');
        }
        // Disallow revert if complaint is dropped or still in submitted/reviewed (can't unreview)
        if (in_array($complaint->status, [Complaint::STATUS_DROPPED, Complaint::STATUS_SUBMITTED, Complaint::STATUS_REVIEWED], true)) {
            return back()->with('error','Cannot revert this status');
        }
        $ok = $complaint->revertOneStep();
        if (!$ok) {
            return back()->with('error','Revert failed');
        }
        return back()->with('success','Status reverted');
    }

    public function addComment(Request $request, Complaint $complaint)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $complaint->dorm_id) {
            abort(403, 'Not authorized');
        }
        if ($complaint->managed_by_staff_id !== $staff->id) {
            abort(403, 'Only managing staff can comment');
        }
        if (in_array($complaint->status, [Complaint::STATUS_RESOLVED, Complaint::STATUS_DROPPED], true)) {
            return back()->with('error','Thread is read-only');
        }
        $data = $request->validate([
            'body' => ['required','string','max:4000']
        ]);
        ComplaintComment::create([
            'complaint_id' => $complaint->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);
        return back();
    }
}
