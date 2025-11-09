<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dorm;
use App\Models\Block;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DormManageController extends Controller
{
    public function show(Dorm $dorm): Response
    {
        $blocks = Block::where('dorm_id', $dorm->id)
            ->withCount(['rooms as active_rooms_count' => function ($q) { $q->where('is_active', true); }])
            ->orderBy('name')
            ->get(['id','dorm_id','name','gender','is_active']);

        $rooms = Room::where('dorm_id', $dorm->id)
            ->with(['block:id,name'])
            ->orderBy('block_id')
            ->orderBy('room_number')
            ->get(['id','dorm_id','block_id','room_number','capacity','is_active']);

        // Include occupancy for each room
        $roomOccupancy = DB::table('resident_assignments')
            ->select('room_id', DB::raw('count(*) as occupants'))
            ->where('is_active', true)
            ->whereIn('room_id', $rooms->pluck('id'))
            ->groupBy('room_id')
            ->pluck('occupants','room_id');

        $rooms = $rooms->map(function ($room) use ($roomOccupancy) {
            $room->occupants = (int)($roomOccupancy[$room->id] ?? 0);
            $room->available = max(0, $room->capacity - $room->occupants);
            return $room;
        });

        return Inertia::render('Admin/DormManage', [
            'dorm' => $dorm->only(['id','name','code','address']),
            'blocks' => $blocks,
            'rooms' => $rooms,
        ]);
    }

    public function storeBlock(Request $request, Dorm $dorm)
    {
        $data = $request->validate([
            'name' => ['required','string','max:50'],
            'gender' => ['required','in:male,female'],
        ]);

        Block::create([
            'dorm_id' => $dorm->id,
            'name' => $data['name'],
            'gender' => $data['gender'],
            'is_active' => true,
        ]);

        return back()->with('success', 'Block added');
    }

    public function storeRoom(Request $request, Dorm $dorm)
    {
        $data = $request->validate([
            'block_id' => ['required','exists:dorm_blocks,id'],
            'room_number' => ['required','string','max:50'],
            'capacity' => ['required','integer','min:1','max:255'],
        ]);

        // Ensure block belongs to dorm
        $block = Block::where('id', $data['block_id'])->where('dorm_id', $dorm->id)->firstOrFail();

        Room::create([
            'dorm_id' => $dorm->id,
            'block_id' => $block->id,
            'room_number' => $data['room_number'],
            'capacity' => (int)$data['capacity'],
            'is_active' => true,
        ]);

        return back()->with('success', 'Room added');
    }
}
