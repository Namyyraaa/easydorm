<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintComment;
use App\Models\ComplaintMedia;
use App\Models\ResidentAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ComplaintController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $items = Complaint::where('student_id', $user->id)
            ->latest()
            ->withCount(['media','comments'])
            ->get(['id','title','status','is_anonymous','managed_by_staff_id','created_at']);
        return Inertia::render('Student/Complaints/Index', [
            'items' => $items,
        ]);
    }

    protected function ensureEligible(Request $request): array
    {
        $user = $request->user();
        $assignment = ResidentAssignment::active()->where('student_id', $user->id)->first();
        if (!$assignment) {
            abort(403, 'You must be an active resident to submit complaints.');
        }
        return [$assignment->dorm_id, $assignment->block_id, $assignment->room_id];
    }

    public function store(Request $request)
    {
        [$dormId, $blockId, $roomId] = $this->ensureEligible($request);
        $data = $request->validate([
            'title' => ['required','string','max:150'],
            'description' => ['required','string','max:5000'],
            'is_anonymous' => ['sometimes','boolean'],
            'images.*' => ['image','mimes:jpeg,jpg,png,webp','max:5120'],
        ]);
        $user = $request->user();
        $images = $request->file('images', []);
        if (count($images) > 10) {
            return back()->with('error', 'Maximum 10 images per complaint');
        }
        $complaint = Complaint::create([
            'student_id' => $user->id,
            'is_anonymous' => (bool) ($data['is_anonymous'] ?? false),
            'dorm_id' => $dormId,
            'block_id' => $blockId,
            'room_id' => $roomId,
            'title' => $data['title'],
            'description' => $data['description'],
            'status' => Complaint::STATUS_SUBMITTED,
        ]);
        foreach ($images as $img) {
            $this->storeCompressedImage($complaint, $img);
        }
        return redirect()->route('student.complaints.index')->with('success', 'Complaint submitted');
    }

    public function show(Request $request, Complaint $complaint): Response
    {
        // Only creator can view student complaint details
        if ($complaint->student_id !== $request->user()->id) {
            abort(403, 'Not authorized');
        }
        $complaint->load(['media','manager.user','comments.user:id,name']);
        $threadReadOnly = in_array($complaint->status, [Complaint::STATUS_RESOLVED, Complaint::STATUS_DROPPED], true);
        return Inertia::render('Student/Complaints/Show', [
            'complaint' => $complaint,
            'threadReadOnly' => $threadReadOnly,
            'managerName' => optional(optional($complaint->manager)->user)->name,
        ]);
    }

    public function drop(Request $request, Complaint $complaint)
    {
        if ($complaint->student_id !== $request->user()->id) {
            abort(403, 'Not authorized');
        }
        if (in_array($complaint->status, [Complaint::STATUS_RESOLVED, Complaint::STATUS_DROPPED], true)) {
            return back()->with('error','Cannot drop a resolved or already dropped complaint');
        }
        $complaint->status = Complaint::STATUS_DROPPED;
        $complaint->dropped_at = now();
        $complaint->save();
        return back()->with('success','Complaint dropped');
    }

    public function addComment(Request $request, Complaint $complaint)
    {
        if ($complaint->student_id !== $request->user()->id) {
            abort(403, 'Not authorized');
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

    protected function storeCompressedImage(Complaint $complaint, $file): void
    {
        $mime = $file->getMimeType();
        $srcPath = $file->getPathname();

    $gdAvailable = function_exists('imagecreatetruecolor') && function_exists('imagecopyresampled') && function_exists('imagejpeg');
        if (!$gdAvailable) {
            $this->storeOriginalImage($complaint, $file);
            return;
        }
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
            $path = 'complaints/'.$complaint->id.'/images/'.$filename;
            Storage::disk('public')->put($path, $jpegData);
            ComplaintMedia::create([
                'complaint_id' => $complaint->id,
                'type' => 'image',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => 'image/jpeg',
                'size_bytes' => Storage::disk('public')->size($path),
                'width' => $newW,
                'height' => $newH,
            ]);
        } else {
            $this->storeOriginalImage($complaint, $file);
        }
    }

    protected function storeOriginalImage(Complaint $complaint, $file): void
    {
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $dir = 'complaints/'.$complaint->id.'/images';
        Storage::disk('public')->putFileAs($dir, $file, $filename);
        $path = $dir.'/'.$filename;
        ComplaintMedia::create([
            'complaint_id' => $complaint->id,
            'type' => 'image',
            'path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => Storage::disk('public')->size($path),
            'width' => null,
            'height' => null,
        ]);
    }
}
