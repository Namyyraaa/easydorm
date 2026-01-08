<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventRegistration;
use App\Models\ResidentAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $now = now();
        $events = Event::query()
            ->withCount('registrations')
            ->where('type', 'event')
            ->where(function($q) use ($now) {
                $q->whereNull('registration_opens_at')->orWhere('registration_opens_at','<=',$now);
            })
            ->orderBy('starts_at')
            ->paginate(10, ['*'], 'events_page');

        $announcements = Event::query()
            ->where('type', 'announcement')
            ->orderByDesc('starts_at')
            ->paginate(10, ['*'], 'announcements_page');

        $userRegisteredEventIds = [];
        if ($user) {
            $userRegisteredEventIds = EventRegistration::query()
                ->where('user_id', $user->id)
                ->pluck('event_id');
        }

        return Inertia::render('Student/Events/Index', [
            'events' => $events,
            'announcements' => $announcements,
            'userRegisteredEventIds' => $userRegisteredEventIds,
        ]);
    }

    public function show(Request $request, Event $event)
    {
        $user = $request->user();
        $now = now();
        $event->load(['media']);

        $isRegistered = $event->registrations()
            ->where('user_id', $user->id)
            ->exists();

        $isOpenWindow = (!$event->registration_opens_at || $now->gte($event->registration_opens_at))
            && (!$event->registration_closes_at || $now->lte($event->registration_closes_at));

        return Inertia::render('Student/Events/Show', [
            'event' => $event,
            'isRegistered' => $isRegistered,
            'isRegistrationOpen' => $isOpenWindow,
        ]);
    }

    public function register(Request $request, Event $event)
    {
        $user = $request->user();
        $now = now();

        if ($event->type !== 'event') {
            return back()->withErrors(['registration' => 'Registration is only available for events.']);
        }

        if ($event->registration_opens_at && $now->lt($event->registration_opens_at)) {
            return back()->withErrors(['registration' => 'Registration has not opened.']);
        }
        if ($event->registration_closes_at && $now->gt($event->registration_closes_at)) {
            return back()->withErrors(['registration' => 'Registration is closed.']);
        }
        if ($event->capacity && $event->registrations()->count() >= $event->capacity) {
            return back()->withErrors(['registration' => 'Event capacity reached.']);
        }
        if ($event->visibility === 'closed') {
            $residentDormId = ResidentAssignment::query()
                ->where('student_id', $user->id)
                ->active()
                ->value('dorm_id');
            if (!$residentDormId || $residentDormId !== $event->dorm_id) {
                return back()->withErrors(['registration' => 'This event is restricted to residents of the hosting dorm.']);
            }
        }

        EventRegistration::firstOrCreate([
            'event_id' => $event->id,
            'user_id' => $user->id,
        ], [
            'registered_at' => now(),
        ]);

        return back()->with('success', 'Registered successfully.');
    }

    public function attend(Request $request, Event $event)
    {
        $user = $request->user();
        $now = now();

        if ($event->type !== 'event') {
            return back()->withErrors(['attendance' => 'Attendance is only available for events.']);
        }

        $hasRegistration = $event->registrations()
            ->where('user_id', $user->id)
            ->exists();
        if (!$hasRegistration) {
            return back()->withErrors(['attendance' => 'You must be registered to attend this event.']);
        }

        if ($now->lt($event->starts_at) || $now->gt($event->ends_at)) {
            return back()->withErrors(['attendance' => 'Attendance is only allowed during the event time.']);
        }
        $validated = $request->validate([
            'attendance_password' => ['required','string'],
        ]);
        if (!$event->attendance_password_hash || !Hash::check($validated['attendance_password'], $event->attendance_password_hash)) {
            return back()->withErrors(['attendance' => 'Invalid attendance password.']);
        }

        EventAttendance::firstOrCreate([
            'event_id' => $event->id,
            'user_id' => $user->id,
        ], [
            'attended_at' => now(),
        ]);

        return back()->with('success', 'Attendance recorded.');
    }

    public function revoke(Request $request, Event $event)
    {
        $user = $request->user();
        $now = now();

        if ($event->type !== 'event') {
            return back()->withErrors(['registration' => 'Revoking applies to events only.']);
        }

        if ($event->registration_opens_at && $now->lt($event->registration_opens_at)) {
            return back()->withErrors(['registration' => 'Registration has not opened.']);
        }
        if ($event->registration_closes_at && $now->gt($event->registration_closes_at)) {
            return back()->withErrors(['registration' => 'Registration is closed.']);
        }

        $registration = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$registration) {
            return back()->withErrors(['registration' => 'You are not registered for this event.']);
        }

        $registration->delete();

        return back()->with('success', 'Registration revoked.');
    }
}
