<?php

namespace App\Http\Controllers\Jakmas;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EventController extends Controller
{
    protected function ensureOwner(Request $request, Event $event): void
    {
        if ((int)$event->created_by !== (int)$request->user()->id) {
            abort(403, 'Only the creator can manage this event.');
        }
    }
    public function index(Request $request)
    {
        $events = Event::query()
            ->withCount(['registrations','attendance'])
            ->orderByDesc('starts_at')
            ->paginate(10);

        return Inertia::render('Jakmas/Events/Index', [
            'events' => $events,
        ]);
    }

    public function create()
    {
        return Inertia::render('Jakmas/Events/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'description' => ['nullable','string'],
            'visibility' => ['required','in:open,closed'],
            'type' => ['required','in:announcement,event'],
            'starts_at' => ['required','date'],
            'ends_at' => ['required','date','after:starts_at'],
            'registration_opens_at' => ['nullable','date'],
            'registration_closes_at' => ['nullable','date','after:registration_opens_at'],
            'capacity' => ['nullable','integer','min:1'],
            'dorm_id' => ['nullable','exists:dorms,id'],
            'images.*' => ['nullable','image','max:5120'],
        ]);

        if ($validated['visibility'] === 'closed' && empty($validated['dorm_id'])) {
            return back()->withErrors(['dorm_id' => 'Dorm is required for closed visibility']);
        }

        $event = Event::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'visibility' => $validated['visibility'],
            'type' => $validated['type'],
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
            'registration_opens_at' => $validated['registration_opens_at'] ?? null,
            'registration_closes_at' => $validated['registration_closes_at'] ?? null,
            'capacity' => $validated['capacity'] ?? null,
            'dorm_id' => $validated['dorm_id'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        if (!empty($request->file('images'))) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('events/'.$event->id, 'public');
                EventMedia::create([
                    'event_id' => $event->id,
                    'path' => $path,
                    'original_name' => $image->getClientOriginalName(),
                ]);
            }
        }

        return redirect()->route('jakmas.events.show', $event);
    }

    public function show(Request $request, Event $event)
    {
        $this->ensureOwner($request, $event);
        $event->load(['media','registrations.user','attendance.user']);
        return Inertia::render('Jakmas/Events/Show', [
            'event' => $event,
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $this->ensureOwner($request, $event);
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'description' => ['nullable','string'],
            'visibility' => ['required','in:open,closed'],
            'type' => ['required','in:announcement,event'],
            'starts_at' => ['required','date'],
            'ends_at' => ['required','date','after:starts_at'],
            'registration_opens_at' => ['nullable','date'],
            'registration_closes_at' => ['nullable','date','after:registration_opens_at'],
            'capacity' => ['nullable','integer','min:1'],
            'dorm_id' => ['nullable','exists:dorms,id'],
        ]);

        if ($validated['visibility'] === 'closed' && empty($validated['dorm_id'])) {
            return back()->withErrors(['dorm_id' => 'Dorm is required for closed visibility']);
        }

        $event->update($validated);

        if (($validated['type'] ?? $event->type) === 'announcement') {
            $event->attendance_password_hash = null;
            $event->save();
        }

        return redirect()->route('jakmas.events.show', $event);
    }

    public function destroy(Request $request, Event $event)
    {
        $this->ensureOwner($request, $event);
        $event->delete();
        return redirect()->route('jakmas.events.index');
    }

    public function setPassword(Request $request, Event $event)
    {
        $this->ensureOwner($request, $event);
        if ($event->type !== 'event') {
            return back()->withErrors(['attendance_password' => 'Attendance password applies to events only.']);
        }
        $validated = $request->validate([
            'attendance_password' => ['required','string','min:6'],
        ]);

        $event->attendance_password_hash = Hash::make($validated['attendance_password']);
        $event->save();

        return back()->with('success', 'Attendance password set');
    }

    public function uploadMedia(Request $request, Event $event)
    {
        $this->ensureOwner($request, $event);
        $validated = $request->validate([
            'images.*' => ['required','image','max:5120'],
        ]);

        foreach ($request->file('images') as $image) {
            $path = $image->store('events/'.$event->id, 'public');
            EventMedia::create([
                'event_id' => $event->id,
                'path' => $path,
                'original_name' => $image->getClientOriginalName(),
            ]);
        }

        return back()->with('success', 'Images uploaded');
    }

    public function removeMedia(Request $request, Event $event, EventMedia $media)
    {
        $this->ensureOwner($request, $event);
        if ($media->event_id !== $event->id) {
            abort(404);
        }
        Storage::disk('public')->delete($media->path);
        $media->delete();
        return back()->with('success', 'Image removed');
    }
}
