<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Fine;
use App\Models\FineEvidence;
use App\Models\ResidentAssignment;
use App\Models\Room;
use App\Models\Staff;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FineController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) abort(403, 'Not assigned to a dorm');

        $filters = [
            'student_id' => $request->integer('student_id'),
            'block_id' => $request->integer('block_id'),
            'room_id' => $request->integer('room_id'),
            'category' => $request->string('category')->toString(),
            'status' => $request->string('status')->toString(),
        ];

        $items = Fine::query()
            ->inDorm((int)$staff->dorm_id)
            ->when($filters['student_id'], fn ($q, $v) => $q->where('student_id', $v))
            ->when($filters['block_id'], fn ($q, $v) => $q->where('block_id', $v))
            ->when($filters['room_id'], fn ($q, $v) => $q->where('room_id', $v))
            ->when($filters['category'], fn ($q, $v) => $q->where('category', $v))
            ->when($filters['status'], fn ($q, $v) => $q->where('status', $v))
            ->latest()
            ->with(['student:id,name','room:id,room_number','block:id,name'])
            ->get(['id','fine_code','student_id','block_id','room_id','category','amount_rm','status','due_date','issued_at']);

        // Basic lists for filters
        $students = ResidentAssignment::active()
            ->where('dorm_id', $staff->dorm_id)
            ->with('student:id,name')
            ->get(['id','student_id'])
            ->map(fn ($ra) => ['id' => $ra->student_id, 'name' => $ra->student?->name]);

        $rooms = Room::active()->where('dorm_id', $staff->dorm_id)
            ->with('block:id,name')
            ->get(['id','block_id','room_number'])
            ->map(fn ($r) => ['id' => $r->id, 'room_number' => $r->room_number, 'block' => $r->block?->name, 'block_id' => $r->block_id]);

        return Inertia::render('Staff/Fines/Index', [
            'items' => $items,
            'filters' => $filters,
            'students' => $students,
            'rooms' => $rooms,
            'categories' => Fine::CATEGORIES,
            'statuses' => [Fine::STATUS_UNPAID, Fine::STATUS_PENDING, Fine::STATUS_PAID, Fine::STATUS_WAIVED],
        ]);
    }

    public function show(Request $request, Fine $fine): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $fine->dorm_id) abort(403, 'Not authorized');
        $fine->load(['student:id,name,email', 'room:id,room_number', 'block:id,name', 'issuer.user:id,name', 'evidences', 'paymentProofs']);
        return Inertia::render('Staff/Fines/Show', [
            'fine' => $fine,
            'categories' => Fine::CATEGORIES,
            'statuses' => [Fine::STATUS_UNPAID, Fine::STATUS_PENDING, Fine::STATUS_PAID, Fine::STATUS_WAIVED],
        ]);
    }

    public function store(Request $request)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error', 'Not assigned to a dorm');

        $data = $request->validate([
            'student_id' => ['required','exists:users,id'],
            'block_id' => ['nullable','exists:blocks,id'],
            'room_id' => ['nullable','exists:rooms,id'],
            'category' => ['required','in:'.implode(',', Fine::CATEGORIES)],
            'amount_rm' => ['required','numeric','min:0'],
            'reason' => ['nullable','string','max:3000'],
            'offence_date' => ['required','date'],
            'due_date' => ['required','date','after_or_equal:offence_date'],
            'evidence.*' => ['file','mimes:jpeg,jpg,png,webp,pdf','max:5120'],
        ]);

        // Derive room/block from active assignment if not provided
        $assignment = ResidentAssignment::active()->where('student_id', $data['student_id'])->first();
        if (!$assignment || $assignment->dorm_id !== (int)$staff->dorm_id) {
            return back()->with('error', 'Student must be an active resident in your dorm');
        }

        $blockId = $data['block_id'] ?? $assignment->block_id;
        $roomId = $data['room_id'] ?? $assignment->room_id;

        $fine = null;
        DB::transaction(function () use ($request, $staff, $data, $assignment, $blockId, $roomId, &$fine) {
            $fine = Fine::create([
                'dorm_id' => (int)$assignment->dorm_id,
                'block_id' => (int)$blockId,
                'room_id' => (int)$roomId,
                'student_id' => (int)$data['student_id'],
                'issued_by_staff_id' => (int)$staff->id,
                'category' => $data['category'],
                'amount_rm' => $data['amount_rm'],
                'reason' => $data['reason'] ?? null,
                'offence_date' => $data['offence_date'],
                'due_date' => $data['due_date'],
                'status' => Fine::STATUS_UNPAID,
            ]);

            $files = $request->file('evidence', []);
            $count = 0;
            foreach ($files as $file) {
                $this->storeEvidence($fine, $file);
                $count++;
            }
            if ($count > 0) {
                $fine->update(['evidence_count' => $count]);
            }
        });

        // In-app notification for student
        UserNotification::create([
            'user_id' => (int)$data['student_id'],
            'type' => 'fine_issued',
            'data' => [
                'fine_id' => $fine->id,
                'fine_code' => $fine->fine_code,
                'amount_rm' => (string)$fine->amount_rm,
                'due_date' => $fine->due_date->format('Y-m-d'),
            ],
        ]);

        return back()->with('success', 'Fine issued (ID: '.$fine->fine_code.')');
    }

    public function update(Request $request, Fine $fine)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $fine->dorm_id) abort(403, 'Not authorized');

        $data = $request->validate([
            'amount_rm' => ['nullable','numeric','min:0'],
            'due_date' => ['nullable','date','after_or_equal:offence_date'],
            'status' => ['nullable','in:'.implode(',', [Fine::STATUS_UNPAID, Fine::STATUS_PENDING, Fine::STATUS_PAID, Fine::STATUS_WAIVED])],
        ]);

        $payload = [];
        if (array_key_exists('amount_rm', $data)) $payload['amount_rm'] = $data['amount_rm'];
        if (array_key_exists('due_date', $data)) $payload['due_date'] = $data['due_date'];
        if (array_key_exists('status', $data)) {
            $payload['status'] = $data['status'];
            if ($data['status'] === Fine::STATUS_PAID) {
                $payload['paid_at'] = now();
            } elseif ($data['status'] === Fine::STATUS_WAIVED) {
                $payload['waived_at'] = now();
            } else {
                $payload['paid_at'] = null;
                $payload['waived_at'] = null;
            }
        }

        $fine->update($payload);

        // Notify student about updates
        UserNotification::create([
            'user_id' => (int)$fine->student_id,
            'type' => 'fine_updated',
            'data' => [
                'fine_id' => $fine->id,
                'fine_code' => $fine->fine_code,
                'updated_fields' => array_keys($payload),
                'amount_rm' => (string)$fine->amount_rm,
                'due_date' => $fine->due_date?->format('Y-m-d'),
                'status' => $fine->status,
            ],
        ]);

        return back()->with('success', 'Fine updated');
    }

    public function approvePayment(Request $request, Fine $fine)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $fine->dorm_id) abort(403, 'Not authorized');
        // Require pending status and at least one payment proof
        $hasProof = $fine->paymentProofs()->exists();
        if ($fine->status !== Fine::STATUS_PENDING || !$hasProof) {
            return back()->with('error', 'Payment cannot be approved: missing proof or wrong status');
        }
        $fine->update([
            'status' => Fine::STATUS_PAID,
            'paid_at' => now(),
        ]);

        // Notify student about approval
        UserNotification::create([
            'user_id' => (int)$fine->student_id,
            'type' => 'fine_payment_approved',
            'data' => [
                'fine_id' => $fine->id,
                'fine_code' => $fine->fine_code,
            ],
        ]);

        return back()->with('success', 'Payment approved. Fine marked as PAID');
    }

    public function notifyUpcoming(Request $request)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) return back()->with('error','Not assigned');

        $daysAhead = max(1, (int)$request->integer('days', 3));
        $cutoff = now()->addDays($daysAhead)->endOfDay();
        $fines = Fine::query()
            ->where('dorm_id', $staff->dorm_id)
            ->where('status', Fine::STATUS_UNPAID)
            ->whereDate('due_date', '<=', $cutoff->toDateString())
            ->with('student:id,name,email')
            ->get();

        $count = 0;
        foreach ($fines as $fine) {
            $days = now()->diffInDays($fine->due_date, false);
            UserNotification::create([
                'user_id' => (int)$fine->student_id,
                'type' => 'fine_due_soon',
                'data' => [
                    'fine_id' => $fine->id,
                    'fine_code' => $fine->fine_code,
                    'due_date' => $fine->due_date->format('Y-m-d'),
                    'days' => max(0, $days),
                ],
            ]);
            $count++;
        }

        return back()->with('success', "Sent {$count} due-date notifications");
    }

    protected function storeEvidence(Fine $fine, $file): void
    {
        $mime = $file->getMimeType();
        if ($mime === 'application/pdf') {
            $filename = Str::uuid()->toString().'.pdf';
            $dir = 'fines/'.$fine->id.'/evidence';
            Storage::disk('public')->putFileAs($dir, $file, $filename);
            $path = $dir.'/'.$filename;
            FineEvidence::create([
                'fine_id' => $fine->id,
                'type' => 'file',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $mime,
                'size_bytes' => Storage::disk('public')->size($path),
            ]);
            return;
        }

        // Images: compress similar to complaint images if GD available
        $gdAvailable = function_exists('imagecreatetruecolor') && function_exists('imagecopyresampled') && function_exists('imagejpeg');
        if (!$gdAvailable) {
            $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
            $dir = 'fines/'.$fine->id.'/evidence';
            Storage::disk('public')->putFileAs($dir, $file, $filename);
            $path = $dir.'/'.$filename;
            FineEvidence::create([
                'fine_id' => $fine->id,
                'type' => 'image',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_bytes' => Storage::disk('public')->size($path),
            ]);
            return;
        }

        $srcPath = $file->getPathname();
        $image = null;
        if (in_array($mime, ['image/jpeg','image/jpg'], true) && function_exists('imagecreatefromjpeg')) {
            $image = @imagecreatefromjpeg($srcPath);
        } elseif ($mime === 'image/png' && function_exists('imagecreatefrompng')) {
            $image = @imagecreatefrompng($srcPath);
        } elseif ($mime === 'image/webp' && function_exists('imagecreatefromwebp')) {
            $image = @imagecreatefromwebp($srcPath);
        }
        if ($image) {
            $origW = imagesx($image);
            $origH = imagesy($image);
            $maxSide = 1600;
            $scale = min(1.0, $maxSide / max($origW, $origH));
            $newW = (int) floor($origW * $scale);
            $newH = (int) floor($origH * $scale);
            $canvas = imagecreatetruecolor($newW, $newH);
            $white = imagecolorallocate($canvas, 255,255,255);
            imagefilledrectangle($canvas, 0,0, $newW, $newH, $white);
            imagecopyresampled($canvas, $image, 0,0, 0,0, $newW, $newH, $origW, $origH);
            ob_start();
            imagejpeg($canvas, null, 80);
            $jpegData = ob_get_clean();
            imagedestroy($canvas);
            imagedestroy($image);
            $filename = Str::uuid()->toString().'.jpg';
            $path = 'fines/'.$fine->id.'/evidence/'.$filename;
            Storage::disk('public')->put($path, $jpegData);
            FineEvidence::create([
                'fine_id' => $fine->id,
                'type' => 'image',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => 'image/jpeg',
                'size_bytes' => Storage::disk('public')->size($path),
                'width' => $newW,
                'height' => $newH,
            ]);
        } else {
            $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
            $dir = 'fines/'.$fine->id.'/evidence';
            Storage::disk('public')->putFileAs($dir, $file, $filename);
            $path = $dir.'/'.$filename;
            FineEvidence::create([
                'fine_id' => $fine->id,
                'type' => 'image',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_bytes' => Storage::disk('public')->size($path),
            ]);
        }
    }
}
