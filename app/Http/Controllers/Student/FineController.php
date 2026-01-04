<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Fine;
use App\Models\FineAppeal;
use App\Models\FineAppealMedia;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FineController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $items = Fine::where('student_id', $user->id)
            ->latest()
            ->with(['room:id,room_number','block:id,name'])
            ->get(['id','fine_code','category','amount_rm','status','due_date','issued_at','room_id','block_id']);
        return Inertia::render('Student/Fines/Index', [
            'items' => $items,
        ]);
    }

    public function show(Request $request, Fine $fine): Response
    {
        if ($fine->student_id !== $request->user()->id) abort(403, 'Not authorized');
        $fine->load(['room:id,room_number','block:id,name','issuer.user:id,name','media','appeals.media']);
        return Inertia::render('Student/Fines/Show', [
            'fine' => $fine,
        ]);
    }

    public function appeal(Request $request, Fine $fine)
    {
        if ($fine->student_id !== $request->user()->id) abort(403, 'Not authorized');
        $data = $request->validate([
            'reason' => ['required','string','max:3000'],
            'attachments.*' => ['file','mimes:jpeg,jpg,png,webp,pdf','max:5120'],
        ]);

        $appeal = null;
        $files = $request->file('attachments', []);
        \DB::transaction(function () use ($fine, $request, $data, $files, &$appeal) {
            $appeal = FineAppeal::create([
                'fine_id' => $fine->id,
                'student_id' => $request->user()->id,
                'reason' => $data['reason'],
                'status' => FineAppeal::STATUS_PENDING,
            ]);
            $count = 0;
            foreach ($files as $file) {
                $mime = $file->getMimeType();
                $ext = $file->getClientOriginalExtension();
                $filename = Str::uuid()->toString().'.'.($ext ?: 'bin');
                $dir = 'fines/'.$fine->id.'/appeals/'.$appeal->id;
                Storage::disk('public')->putFileAs($dir, $file, $filename);
                $path = $dir.'/'.$filename;
                FineAppealMedia::create([
                    'fine_appeal_id' => $appeal->id,
                    'type' => ($mime === 'application/pdf' ? 'file' : 'image'),
                    'path' => $path,
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $mime,
                    'size_bytes' => Storage::disk('public')->size($path),
                ]);
                $count++;
            }
            if ($count > 0) $appeal->update(['attachments_count' => $count]);
        });

        // Notify student (self) to surface appeal pending in dashboard
        UserNotification::create([
            'user_id' => (int)$request->user()->id,
            'type' => 'fine_appeal_submitted',
            'data' => [
                'fine_id' => $fine->id,
                'fine_code' => $fine->fine_code,
                'appeal_id' => $appeal->id,
            ],
        ]);

        return back()->with('success','Appeal submitted');
    }
}
