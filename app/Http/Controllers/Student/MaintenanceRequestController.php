<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\MaintenanceRequestMedia;
use App\Models\ResidentAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
// Using GD for image compression to avoid extra dependencies

class MaintenanceRequestController extends Controller
{
    protected function firstTwoWords(?string $name): ?string
    {
        if (!$name) return null;
        $trim = trim($name);
        if ($trim === '') return null;
        $parts = preg_split('/\s+/', $trim);
        if (!$parts || count($parts) === 0) return null;
        return implode(' ', array_slice($parts, 0, min(2, count($parts))));
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $requests = [];
        $roommateRequests = [];

        // Only show requests when the student is an active resident
        $assignment = ResidentAssignment::active()->where('student_id', $user->id)->first();
        if ($assignment) {
            // Own requests
            $requests = MaintenanceRequest::where('student_id', $user->id)
                ->latest()
                ->withCount('media')
                ->with(['student:id,name'])
                ->get(['id','student_id','room_id','title','status','created_at']);

            // Roommate-visible requests (same room, not created by user)
            $query = MaintenanceRequest::where('room_id', $assignment->room_id)
                ->where('student_id', '!=', $user->id)
                ->latest()
                ->withCount('media')
                ->with(['student:id,name']);

            // Limit visibility to requests created during the user's current active assignment window
            if ($assignment->check_in_date) {
                $query = $query->where('created_at', '>=', $assignment->check_in_date);
            }
            if ($assignment->check_out_date) {
                $query = $query->where('created_at', '<=', $assignment->check_out_date);
            }

            $roommateRequests = $query->get(['id','student_id','room_id','title','status','created_at']);
        }

        return Inertia::render('Student/Maintenance/Index', [
            'requests' => $requests,
            'roommateRequests' => $roommateRequests,
        ]);
    }

    protected function ensureEligible(Request $request): array
    {
        $user = $request->user();
        $assignment = ResidentAssignment::active()->where('student_id', $user->id)->first();
        if (!$assignment) {
            abort(403, 'You must be an active resident to create maintenance requests.');
        }
        return [$assignment->dorm_id, $assignment->block_id, $assignment->room_id];
    }

    public function store(Request $request)
    {
        [$dormId, $blockId, $roomId] = $this->ensureEligible($request);
        $data = $request->validate([
            'title' => ['required','string','max:150'],
            'description' => ['required','string','max:5000'],
            'images.*' => ['image','mimes:jpeg,jpg,png,webp','max:5120'], // 5MB
        ]);

        $user = $request->user();
        $countExisting = 0; // new
        $images = $request->file('images', []);
        if (count($images) > 10) {
            return back()->with('error', 'Maximum 10 images per request');
        }

        $mr = MaintenanceRequest::create([
            'student_id' => $user->id,
            'dorm_id' => $dormId,
            'block_id' => $blockId,
            'room_id' => $roomId,
            'title' => $data['title'],
            'description' => $data['description'],
            'status' => MaintenanceRequest::STATUS_SUBMITTED,
        ]);

        foreach ($images as $img) {
            $this->storeCompressedImage($mr, $img);
        }

        return redirect()->route('student.maintenance.index')->with('success', 'Maintenance request submitted');
    }

    public function show(Request $request, MaintenanceRequest $maintenanceRequest): Response
    {
        $user = $request->user();
        // Owner always allowed
        if ($maintenanceRequest->student_id === $user->id) {
            $maintenanceRequest->load([
                'media',
                'student:id,name',
                'reviewedBy:id,name',
                'inProgressBy:id,name',
                'completedBy:id,name',
            ]);
            $actors = [
                'submitted' => $this->firstTwoWords(optional($maintenanceRequest->student)->name),
                'reviewed' => $this->firstTwoWords(optional($maintenanceRequest->reviewedBy)->name),
                'in_progress' => $this->firstTwoWords(optional($maintenanceRequest->inProgressBy)->name),
                'completed' => $this->firstTwoWords(optional($maintenanceRequest->completedBy)->name),
            ];
            return Inertia::render('Student/Maintenance/Show', [
                'requestItem' => $maintenanceRequest,
                'actors' => $actors,
            ]);
        }

        // Allow roommates (students assigned to same room) to view only if the maintenance request
        // was created between their check-in and check-out dates.
        $assignment = ResidentAssignment::active()->where('student_id', $user->id)
            ->where('room_id', $maintenanceRequest->room_id)
            ->where(function ($q) use ($maintenanceRequest) {
                $q->whereNull('check_in_date')->orWhere('check_in_date', '<=', $maintenanceRequest->created_at);
            })
            ->where(function ($q) use ($maintenanceRequest) {
                $q->whereNull('check_out_date')->orWhere('check_out_date', '>=', $maintenanceRequest->created_at);
            })
            ->first();

        if ($assignment) {
            $maintenanceRequest->load([
                'media',
                'student:id,name',
                'reviewedBy:id,name',
                'inProgressBy:id,name',
                'completedBy:id,name',
            ]);
            $actors = [
                'submitted' => $this->firstTwoWords(optional($maintenanceRequest->student)->name),
                'reviewed' => $this->firstTwoWords(optional($maintenanceRequest->reviewedBy)->name),
                'in_progress' => $this->firstTwoWords(optional($maintenanceRequest->inProgressBy)->name),
                'completed' => $this->firstTwoWords(optional($maintenanceRequest->completedBy)->name),
            ];
            return Inertia::render('Student/Maintenance/Show', [
                'requestItem' => $maintenanceRequest,
                'actors' => $actors,
            ]);
        }

        $this->authorizeOwnership($request, $maintenanceRequest);
        $maintenanceRequest->load([
            'media',
            'student:id,name',
            'reviewedBy:id,name',
            'inProgressBy:id,name',
            'completedBy:id,name',
        ]);
        $actors = [
            'submitted' => $this->firstTwoWords(optional($maintenanceRequest->student)->name),
            'reviewed' => $this->firstTwoWords(optional($maintenanceRequest->reviewedBy)->name),
            'in_progress' => $this->firstTwoWords(optional($maintenanceRequest->inProgressBy)->name),
            'completed' => $this->firstTwoWords(optional($maintenanceRequest->completedBy)->name),
        ];
        return Inertia::render('Student/Maintenance/Show', [
            'requestItem' => $maintenanceRequest,
            'actors' => $actors,
        ]);
    }

    public function update(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        $this->authorizeOwnership($request, $maintenanceRequest);
        if (!in_array($maintenanceRequest->status, [MaintenanceRequest::STATUS_SUBMITTED, MaintenanceRequest::STATUS_REVIEWED], true)) {
            return back()->with('error', 'Cannot edit after work has started.');
        }
        $data = $request->validate([
            'title' => ['required','string','max:150'],
            'description' => ['required','string','max:5000'],
            'add_images.*' => ['image','mimes:jpeg,jpg,png,webp','max:5120'],
        ]);
        $images = $request->file('add_images', []);
        if ($maintenanceRequest->media()->count() + count($images) > 10) {
            return back()->with('error', 'Maximum 10 images per request');
        }
        $maintenanceRequest->update([
            'title' => $data['title'],
            'description' => $data['description'],
        ]);
        foreach ($images as $img) {
            $this->storeCompressedImage($maintenanceRequest, $img);
        }
        return back()->with('success', 'Request updated');
    }

    public function destroy(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        $this->authorizeOwnership($request, $maintenanceRequest);
        if (!in_array($maintenanceRequest->status, [MaintenanceRequest::STATUS_SUBMITTED, MaintenanceRequest::STATUS_REVIEWED], true)) {
            return back()->with('error', 'Cannot delete after work has started.');
        }
        $maintenanceRequest->delete();
        return redirect()->route('student.maintenance.index')->with('success', 'Request deleted');
    }

    protected function authorizeOwnership(Request $request, MaintenanceRequest $maintenanceRequest): void
    {
        if ($maintenanceRequest->student_id !== $request->user()->id) {
            abort(403, 'Not authorized');
        }
    }

    protected function storeCompressedImage(MaintenanceRequest $requestModel, $file): void
    {
        $mime = $file->getMimeType();
        $srcPath = $file->getPathname();

        // If GD is not available, store original immediately
        $gdAvailable = function_exists('\\imagecreatetruecolor') && function_exists('\\imagecopyresampled') && function_exists('\\imagejpeg');
        if (!$gdAvailable) {
            $this->storeOriginalImage($requestModel, $file);
            return;
        }

        $image = null;
        if (in_array($mime, ['image/jpeg','image/jpg'], true) && function_exists('\\imagecreatefromjpeg')) {
            $image = @\imagecreatefromjpeg($srcPath);
        } elseif ($mime === 'image/png' && function_exists('\\imagecreatefrompng')) {
            $image = @\imagecreatefrompng($srcPath);
        } elseif ($mime === 'image/webp' && function_exists('\\imagecreatefromwebp')) {
            $image = @\imagecreatefromwebp($srcPath);
        }

        if ($image) {
            $origW = \imagesx($image);
            $origH = \imagesy($image);
            $maxSide = 1600;
            $scale = min(1.0, $maxSide / max($origW, $origH));
            $newW = (int) floor($origW * $scale);
            $newH = (int) floor($origH * $scale);
            $canvas = \imagecreatetruecolor($newW, $newH);
            // Fill white to avoid black background when converting transparency to JPEG
            $white = \imagecolorallocate($canvas, 255,255,255);
            \imagefilledrectangle($canvas, 0,0, $newW, $newH, $white);
            \imagecopyresampled($canvas, $image, 0,0, 0,0, $newW, $newH, $origW, $origH);
            ob_start();
            \imagejpeg($canvas, null, 80);
            $jpegData = ob_get_clean();
            \imagedestroy($canvas);
            \imagedestroy($image);

            $filename = Str::uuid()->toString().'.jpg';
            $path = 'maintenance/'.$requestModel->id.'/images/'.$filename;
            Storage::disk('public')->put($path, $jpegData);
            MaintenanceRequestMedia::create([
                'maintenance_request_id' => $requestModel->id,
                'type' => 'image',
                'path' => $path,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => 'image/jpeg',
                'size_bytes' => Storage::disk('public')->size($path),
                'width' => $newW,
                'height' => $newH,
            ]);
        } else {
            // Unsupported type or failed to read — store original file
            $this->storeOriginalImage($requestModel, $file);
        }
    }

    protected function storeOriginalImage(MaintenanceRequest $requestModel, $file): void
    {
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $dir = 'maintenance/'.$requestModel->id.'/images';
        Storage::disk('public')->putFileAs($dir, $file, $filename);
        $path = $dir.'/'.$filename;
        MaintenanceRequestMedia::create([
            'maintenance_request_id' => $requestModel->id,
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
