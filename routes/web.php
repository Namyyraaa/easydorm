<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DormController;
use App\Http\Controllers\Staff\ResidentsController;
use App\Http\Controllers\Admin\DormManageController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/details', [ProfileController::class, 'updateDetails'])->name('profile.details.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Super Admin routes
Route::middleware(['auth', 'verified', 'superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dorms', [DormController::class, 'index'])->name('dorms.index');
    Route::post('/dorms', [DormController::class, 'store'])->name('dorms.store');
    Route::post('/dorms/assign-staff', [DormController::class, 'assignStaff'])->name('dorms.assignStaff');
    Route::post('/dorms/assign-staff-bulk', [DormController::class, 'assignStaffBulk'])->name('dorms.assignStaffBulk');
    Route::post('/dorms/revoke-staff', [DormController::class, 'revokeStaff'])->name('dorms.revokeStaff');

    // Dorm management (blocks & rooms)
    Route::get('/dorms/{dorm}', [DormManageController::class, 'show'])->name('dorms.manage');
    Route::post('/dorms/{dorm}/blocks', [DormManageController::class, 'storeBlock'])->name('dorms.blocks.store');
    Route::post('/dorms/{dorm}/rooms', [DormManageController::class, 'storeRoom'])->name('dorms.rooms.store');
});

require __DIR__.'/auth.php';

// Staff routes
Route::middleware(['auth', 'verified', 'staff'])->prefix('staff')->name('staff.')->group(function () {
    Route::get('/residents', [ResidentsController::class, 'index'])->name('residents.index');
    Route::post('/residents/assign', [ResidentsController::class, 'assign'])->name('residents.assign');
    Route::post('/residents/assign-bulk', [ResidentsController::class, 'assignBulk'])->name('residents.assignBulk');
    Route::post('/residents/revoke', [ResidentsController::class, 'revoke'])->name('residents.revoke');
});
