<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Fine;
use App\Models\FineAppeal;
use App\Models\ResidentAssignment;
use App\Models\Staff;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FineAppealController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) abort(403, 'Not assigned to a dorm');

        $filters = [
            'student_id' => $request->integer('student_id'),
            'status' => $request->string('status')->toString(),
        ];

        $query = FineAppeal::query()
            ->whereHas('fine', fn ($q) => $q->where('dorm_id', $staff->dorm_id))
            ->with(['fine:id,fine_code,student_id,category,amount_rm,status,due_date', 'student:id,name']);

        $items = (clone $query)
            ->when($filters['student_id'], fn ($q, $v) => $q->where('student_id', $v))
            ->when($filters['status'], fn ($q, $v) => $q->where('status', $v))
            ->latest('submitted_at')
            ->get(['id','fine_id','student_id','status','submitted_at','decided_at']);

        $students = ResidentAssignment::active()
            ->where('dorm_id', $staff->dorm_id)
            ->with('student:id,name')
            ->get(['student_id'])
            ->map(fn ($ra) => ['id' => $ra->student_id, 'name' => $ra->student?->name])
            ->unique('id')
            ->values();

        return Inertia::render('Staff/FineAppeals/Index', [
            'items' => $items,
            'students' => $students,
            'statuses' => [FineAppeal::STATUS_PENDING, FineAppeal::STATUS_APPROVED, FineAppeal::STATUS_REJECTED],
            'filters' => $filters,
        ]);
    }

    public function show(Request $request, FineAppeal $appeal): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) abort(403, 'Not assigned');
        $appeal->load([
            'fine' => function ($q) {
                $q->select('id','fine_code','dorm_id','student_id','category','amount_rm','status','reason','due_date','issued_at','block_id','room_id','issued_by_staff_id')
                    ->with(['room:id,room_number','block:id,name','issuer.user:id,name','evidences','paymentProofs']);
            },
            'student:id,name,email',
            'media',
        ]);
        if (($appeal->fine?->dorm_id) !== ($staff->dorm_id)) abort(403, 'Not authorized');

        return Inertia::render('Staff/FineAppeals/Show', [
            'appeal' => $appeal,
            'fineStatuses' => [Fine::STATUS_UNPAID, Fine::STATUS_PENDING, Fine::STATUS_PAID, Fine::STATUS_WAIVED],
        ]);
    }

    public function decide(Request $request, FineAppeal $appeal)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) abort(403, 'Not assigned');
        $appeal->load('fine');
        if (!$appeal->fine || $appeal->fine->dorm_id !== $staff->dorm_id) abort(403, 'Not authorized');
        if ($appeal->status !== FineAppeal::STATUS_PENDING) {
            return back()->with('error', 'Appeal already decided');
        }

        $data = $request->validate([
            'decision' => ['required','in:approved,rejected'],
            'decision_reason' => ['required','string','max:3000'],
            'update_fine_status' => ['nullable','in:'.implode(',', [Fine::STATUS_UNPAID, Fine::STATUS_PENDING, Fine::STATUS_PAID, Fine::STATUS_WAIVED])],
        ]);

        DB::transaction(function () use ($appeal, $staff, $data) {
            $appeal->update([
                'status' => $data['decision'] === 'approved' ? FineAppeal::STATUS_APPROVED : FineAppeal::STATUS_REJECTED,
                'decided_at' => now(),
                'decided_by_staff_id' => $staff->id,
                'decision_reason' => $data['decision_reason'],
            ]);

            if (!empty($data['update_fine_status'])) {
                $payload = ['status' => $data['update_fine_status']];
                if ($data['update_fine_status'] === Fine::STATUS_PAID) {
                    $payload['paid_at'] = now();
                } elseif ($data['update_fine_status'] === Fine::STATUS_WAIVED) {
                    $payload['waived_at'] = now();
                }
                $appeal->fine->update($payload);

                UserNotification::create([
                    'user_id' => (int)$appeal->fine->student_id,
                    'type' => 'fine_updated',
                    'data' => [
                        'fine_id' => $appeal->fine->id,
                        'fine_code' => $appeal->fine->fine_code,
                        'status' => $appeal->fine->status,
                    ],
                ]);
            }
        });

        return back()->with('success', 'Appeal has been '.$data['decision']);
    }
}
