<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\DormController;
use App\Http\Controllers\Staff\ResidentsController;
use App\Http\Controllers\Admin\DormManageController;
use App\Http\Controllers\Student\MaintenanceRequestController as StudentMaintenanceController;
use App\Http\Controllers\Staff\MaintenanceRequestController as StaffMaintenanceController;
use App\Http\Controllers\Student\ComplaintController as StudentComplaintController;
use App\Http\Controllers\Staff\ComplaintController as StaffComplaintController;

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

// Student maintenance routes (auth + verified + student-only)
Route::middleware(['auth','verified','student'])->prefix('student')->name('student.')->group(function() {
    Route::get('/maintenance', [StudentMaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('/maintenance', [StudentMaintenanceController::class, 'store'])->name('maintenance.store');
    Route::get('/maintenance/{maintenanceRequest}', [StudentMaintenanceController::class, 'show'])->name('maintenance.show');
    Route::patch('/maintenance/{maintenanceRequest}', [StudentMaintenanceController::class, 'update'])->name('maintenance.update');
    Route::delete('/maintenance/{maintenanceRequest}', [StudentMaintenanceController::class, 'destroy'])->name('maintenance.destroy');

    // Complaints
    Route::get('/complaints', [StudentComplaintController::class, 'index'])->name('complaints.index');
    Route::post('/complaints', [StudentComplaintController::class, 'store'])->name('complaints.store');
    Route::get('/complaints/{complaint}', [StudentComplaintController::class, 'show'])->name('complaints.show');
    Route::patch('/complaints/{complaint}/drop', [StudentComplaintController::class, 'drop'])->name('complaints.drop');
    Route::post('/complaints/{complaint}/comments', [StudentComplaintController::class, 'addComment'])->name('complaints.comments.store');
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
    // Maintenance
    Route::get('/maintenance', [StaffMaintenanceController::class, 'index'])->name('maintenance.index');
    Route::get('/maintenance/{maintenanceRequest}', [StaffMaintenanceController::class, 'show'])->name('maintenance.show');
    Route::patch('/maintenance/{maintenanceRequest}/status', [StaffMaintenanceController::class, 'updateStatus'])->name('maintenance.updateStatus');
    Route::patch('/maintenance/{maintenanceRequest}/status/revert', [StaffMaintenanceController::class, 'revertStatus'])->name('maintenance.revertStatus');

    // Complaints
    Route::get('/complaints', [StaffComplaintController::class, 'index'])->name('complaints.index');
    Route::get('/complaints/{complaint}', [StaffComplaintController::class, 'show'])->name('complaints.show');
    Route::patch('/complaints/{complaint}/claim', [StaffComplaintController::class, 'claim'])->name('complaints.claim');
    Route::patch('/complaints/{complaint}/status', [StaffComplaintController::class, 'updateStatus'])->name('complaints.updateStatus');
    Route::patch('/complaints/{complaint}/status/revert', [StaffComplaintController::class, 'revertStatus'])->name('complaints.revertStatus');
    Route::post('/complaints/{complaint}/comments', [StaffComplaintController::class, 'addComment'])->name('complaints.comments.store');
});
