<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
    $profile = $user->profile ?: \App\Models\UserProfile::create(['user_id' => $user->id]);
    $hobbies = \App\Models\Hobby::where('is_active', true)->orderBy('name')->get(['id','name']);
    $faculties = \App\Models\Faculty::where('is_active', true)->orderBy('name')->get(['id','name','code']);
        $userHobbyIds = $user->hobbies()->pluck('hobby_id');

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'profile' => $profile->only(['gender','intake_session','faculty_id','interaction_style','daily_schedule']),
            'hobbies' => $hobbies,
            'userHobbies' => $userHobbyIds,
            'faculties' => $faculties,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    public function updateDetails(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'gender' => ['nullable','in:male,female'],
            'intake_session' => ['nullable','regex:/^\\d{2}\\/\\d{2}$/'],
            'faculty_id' => ['nullable','integer','exists:faculties,id'],
            'interaction_style' => ['nullable','in:quiet_and_independent,friendly_and_interactive,flexible'],
            'daily_schedule' => ['nullable','in:consistent,variable'],
            'hobby_ids' => ['array'],
            'hobby_ids.*' => ['integer','exists:hobbies,id'],
        ]);

        // Intake session logical check (second part == first+1) if provided
        if (!empty($data['intake_session'])) {
            [$start,$end] = explode('/', $data['intake_session']);
            if (((int)$end) !== ((int)$start + 1)) {
                return Redirect::back()->with('error', 'Invalid intake session range');
            }
        }

        // Update / create profile
    $profile = $user->profile ?: new \App\Models\UserProfile(['user_id' => $user->id]);
    $profile->gender = $data['gender'] ?? $profile->gender;
    $profile->intake_session = $data['intake_session'] ?? $profile->intake_session;
    $profile->faculty_id = array_key_exists('faculty_id', $data) ? $data['faculty_id'] : $profile->faculty_id;
    $profile->interaction_style = array_key_exists('interaction_style', $data) ? $data['interaction_style'] : $profile->interaction_style;
    $profile->daily_schedule = array_key_exists('daily_schedule', $data) ? $data['daily_schedule'] : $profile->daily_schedule;
    $profile->save();

        // Sync hobbies
        if (isset($data['hobby_ids'])) {
            $user->hobbies()->sync($data['hobby_ids']);
        }

        return Redirect::route('profile.edit')->with('success', 'Profile details updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
