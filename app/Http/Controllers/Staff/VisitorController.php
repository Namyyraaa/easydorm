<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Room;
use App\Models\Staff;
use App\Models\VisitorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VisitorController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            abort(403, 'Not assigned to a dorm');
        }
        $dormId = $staff->dorm_id;

        $blocks = Block::active()
            ->where('dorm_id', $dormId)
            ->orderBy('name')
            ->get(['id','name']);

        $rooms = Room::active()
            ->where('dorm_id', $dormId)
            ->orderBy('block_id')
            ->orderBy('room_number')
            ->get(['id','block_id','room_number']);

        $activeVisitors = VisitorLog::where('dorm_id', $dormId)
            ->whereNull('out_time')
            ->with(['block:id,name','room:id,room_number','recorder.user:id,name'])
            ->orderByDesc('arrival_time')
            ->get(['id','visitor_name','company','phone','arrival_time','entry_reason','block_id','room_id','recorded_by_staff_id']);

        $recentVisitors = VisitorLog::where('dorm_id', $dormId)
            ->whereNotNull('out_time')
            ->orderByDesc('out_time')
            ->limit(50)
            ->get(['id','visitor_name','company','phone','arrival_time','out_time','block_id','room_id']);

        return Inertia::render('Staff/Visitors/Index', [
            'blocks' => $blocks,
            'rooms' => $rooms,
            'activeVisitors' => $activeVisitors,
            'recentVisitors' => $recentVisitors,
        ]);
    }

    public function store(Request $request)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff) {
            return back()->with('error', 'You are not assigned to any dorm.');
        }
        $dormId = (int)$staff->dorm_id;

        $data = $request->validate([
            'visitor_name' => ['required','string','max:150'],
            'company' => ['nullable','string','max:150'],
            'phone' => ['nullable','string','max:30'],
            'arrival_time' => ['nullable','date'],
            'block_id' => ['required','integer','exists:dorm_blocks,id'],
            'room_id' => ['nullable','integer','exists:rooms,id'],
            'entry_reason' => ['nullable','string','max:500'],
        ]);

        // Ensure block belongs to staff's dorm; if room provided, ensure it belongs to same dorm and block
        $block = Block::active()->where('id', $data['block_id'])->where('dorm_id', $dormId)->first();
        if (!$block) {
            return back()->with('error', 'Invalid block for your dorm.');
        }
        $roomId = $data['room_id'] ?? null;
        if ($roomId) {
            $room = Room::active()->where('id', $roomId)->where('dorm_id', $dormId)->where('block_id', $block->id)->first();
            if (!$room) {
                return back()->with('error', 'Invalid room selection for the chosen block.');
            }
        }

        VisitorLog::create([
            'dorm_id' => $dormId,
            'block_id' => $block->id,
            'room_id' => $roomId,
            'visitor_name' => $data['visitor_name'],
            'company' => $data['company'] ?? null,
            'phone' => $data['phone'] ?? null,
            'arrival_time' => $data['arrival_time'] ?? now(),
            'entry_reason' => $data['entry_reason'] ?? null,
            'recorded_by_staff_id' => $staff->id,
        ]);

        return back()->with('success', 'Visitor entry recorded');
    }

    public function update(Request $request, VisitorLog $visitorLog)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $visitorLog->dorm_id) {
            abort(403, 'Not authorized');
        }

        $data = $request->validate([
            'visitor_name' => ['required','string','max:150'],
            'company' => ['nullable','string','max:150'],
            'phone' => ['nullable','string','max:30'],
            'entry_reason' => ['nullable','string','max:500'],
            'block_id' => ['required','integer','exists:dorm_blocks,id'],
            'room_id' => ['nullable','integer','exists:rooms,id'],
            'arrival_time' => ['nullable','date'],
        ]);

        // Validate dorm scoping
        $block = Block::active()->where('id', $data['block_id'])->where('dorm_id', $staff->dorm_id)->first();
        if (!$block) {
            return back()->with('error', 'Invalid block for your dorm.');
        }
        $roomId = $data['room_id'] ?? null;
        if ($roomId) {
            $room = Room::active()->where('id', $roomId)->where('dorm_id', $staff->dorm_id)->where('block_id', $block->id)->first();
            if (!$room) {
                return back()->with('error', 'Invalid room selection for the chosen block.');
            }
        }

        $visitorLog->update([
            'visitor_name' => $data['visitor_name'],
            'company' => $data['company'] ?? null,
            'phone' => $data['phone'] ?? null,
            'entry_reason' => $data['entry_reason'] ?? null,
            'block_id' => $block->id,
            'room_id' => $roomId,
            'arrival_time' => $data['arrival_time'] ?? $visitorLog->arrival_time,
        ]);

        return back()->with('success', 'Visitor entry updated');
    }

    public function checkout(Request $request, VisitorLog $visitorLog)
    {
        $staff = Staff::active()->where('user_id', $request->user()->id)->first();
        if (!$staff || $staff->dorm_id !== $visitorLog->dorm_id) {
            abort(403, 'Not authorized');
        }

        $data = $request->validate([
            'out_time' => ['nullable','date'],
        ]);

        $visitorLog->update([
            'out_time' => $data['out_time'] ?? now(),
        ]);

        return back()->with('success', 'Visitor checked out');
    }
}
