<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Event;
use App\Http\Controllers\Admin\DormController;
use App\Http\Controllers\Staff\ResidentsController;
use App\Http\Controllers\Admin\DormManageController;
use App\Http\Controllers\Student\MaintenanceRequestController as StudentMaintenanceController;
use App\Http\Controllers\Staff\MaintenanceRequestController as StaffMaintenanceController;
use App\Http\Controllers\Student\ComplaintController as StudentComplaintController;
use App\Http\Controllers\Staff\ComplaintController as StaffComplaintController;
use App\Http\Controllers\Admin\InventoryCategoryController;
use App\Http\Controllers\Staff\InventoryItemController;
use App\Http\Controllers\Staff\InventoryStockController;
use App\Http\Controllers\Staff\InventoryTransactionController;
use App\Http\Controllers\Staff\FineController as StaffFineController;
use App\Http\Controllers\Student\FineController as StudentFineController;
use App\Http\Controllers\Staff\FineAppealController as StaffFineAppealController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
    $user = $request->user();
    if ($user && method_exists($user, 'isStaff') && $user->isStaff()) {
        return redirect()->route('staff.dashboard');
    }
    // Redirect authenticated students to their dashboard
    if ($user
        && method_exists($user, 'isSuperAdmin') && !$user->isSuperAdmin()
        && method_exists($user, 'isStaff') && !$user->isStaff()
        && method_exists($user, 'isJakmas') && !$user->isJakmas()
    ) {
        return redirect()->route('student.dashboard');
    }
    $announcements = Event::query()
        ->where('type', 'announcement')
        ->orderByDesc('starts_at')
        ->orderByDesc('created_at')
        ->get(['id', 'name', 'description', 'starts_at', 'created_at']);

    return Inertia::render('Dashboard', [
        'announcements' => $announcements,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/details', [ProfileController::class, 'updateDetails'])->name('profile.details.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Student maintenance routes (auth + verified + student-only)
Route::middleware(['auth','verified','student'])->prefix('student')->name('student.')->group(function() {
    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Student\DashboardController::class, 'index'])->name('dashboard');
    // Fines
    Route::get('/fines', [StudentFineController::class, 'index'])->name('fines.index');
    Route::get('/fines/{fine}', [StudentFineController::class, 'show'])->name('fines.show');
    Route::post('/fines/{fine}/appeals', [StudentFineController::class, 'appeal'])->name('fines.appeal');
    Route::post('/fines/{fine}/payment-proof', [StudentFineController::class, 'submitPaymentProof'])->name('fines.paymentProof');
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

    // Inventory Categories (catalog management)
    Route::get('/inventory/categories', [InventoryCategoryController::class, 'index'])->name('inventory.categories.index');
    Route::post('/inventory/categories', [InventoryCategoryController::class, 'store'])->name('inventory.categories.store');
    Route::patch('/inventory/categories/{inventoryCategory}', [InventoryCategoryController::class, 'update'])->name('inventory.categories.update');
    Route::patch('/inventory/categories/{inventoryCategory}/toggle', [InventoryCategoryController::class, 'toggle'])->name('inventory.categories.toggle');
});

require __DIR__.'/auth.php';

// Staff routes
Route::middleware(['auth', 'verified', 'staff'])->prefix('staff')->name('staff.')->group(function () {
    // Staff dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Staff\DashboardController::class, 'index'])->name('dashboard');
    // Fines
    Route::get('/fines', [StaffFineController::class, 'index'])->name('fines.index');
    Route::get('/fines/{fine}', [StaffFineController::class, 'show'])->name('fines.show');
    Route::post('/fines', [StaffFineController::class, 'store'])->name('fines.store');
    Route::patch('/fines/{fine}', [StaffFineController::class, 'update'])->name('fines.update');
    Route::post('/fines/notify-upcoming', [StaffFineController::class, 'notifyUpcoming'])->name('fines.notifyUpcoming');
    Route::patch('/fines/{fine}/approve-payment', [StaffFineController::class, 'approvePayment'])->name('fines.approvePayment');

    // Fine Appeals (Staff)
    Route::get('/fine-appeals', [StaffFineAppealController::class, 'index'])->name('fineAppeals.index');
    Route::get('/fine-appeals/{appeal}', [StaffFineAppealController::class, 'show'])->name('fineAppeals.show');
    Route::patch('/fine-appeals/{appeal}/decide', [StaffFineAppealController::class, 'decide'])->name('fineAppeals.decide');
    // Residents: split pages for list and assignment
    Route::get('/residents/list', [ResidentsController::class, 'list'])->name('residents.list');
    Route::get('/residents/assign', [ResidentsController::class, 'index'])->name('residents.assignPage');
    Route::post('/residents/assign', [ResidentsController::class, 'assign'])->name('residents.assign');
    Route::post('/residents/assign-bulk', [ResidentsController::class, 'assignBulk'])->name('residents.assignBulk');
    Route::post('/residents/revoke', [ResidentsController::class, 'revoke'])->name('residents.revoke');
    Route::get('/residents/suggestions', [ResidentsController::class, 'suggestions'])->name('residents.suggestions');
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

    // Inventory Items
    Route::get('/inventory/items', [InventoryItemController::class, 'index'])->name('inventory.items.index');
    Route::post('/inventory/items', [InventoryItemController::class, 'store'])->name('inventory.items.store');
    Route::patch('/inventory/items/{inventoryItem}', [InventoryItemController::class, 'update'])->name('inventory.items.update');
    Route::delete('/inventory/items/{inventoryItem}', [InventoryItemController::class, 'destroy'])->name('inventory.items.destroy');

    // Inventory Stock overview
    Route::get('/inventory/stock', [InventoryStockController::class, 'index'])->name('inventory.stock.index');

    // Inventory Transactions
    Route::get('/inventory/transactions', [InventoryTransactionController::class, 'index'])->name('inventory.transactions.index');
    Route::post('/inventory/transactions/receive', [InventoryTransactionController::class, 'receive'])->name('inventory.transactions.receive');
    Route::post('/inventory/transactions/assign', [InventoryTransactionController::class, 'assign'])->name('inventory.transactions.assign');
    Route::post('/inventory/transactions/transfer', [InventoryTransactionController::class, 'transfer'])->name('inventory.transactions.transfer');
    Route::post('/inventory/transactions/demolish-central', [InventoryTransactionController::class, 'demolishCentral'])->name('inventory.transactions.demolishCentral');
    Route::post('/inventory/transactions/demolish-room', [InventoryTransactionController::class, 'demolishRoom'])->name('inventory.transactions.demolishRoom');
    Route::post('/inventory/transactions/unassign', [InventoryTransactionController::class, 'unassign'])->name('inventory.transactions.unassign');

    // Visitors
    Route::get('/visitors', [\App\Http\Controllers\Staff\VisitorController::class, 'index'])->name('visitors.index');
    Route::post('/visitors', [\App\Http\Controllers\Staff\VisitorController::class, 'store'])->name('visitors.store');
    Route::patch('/visitors/{visitorLog}', [\App\Http\Controllers\Staff\VisitorController::class, 'update'])->name('visitors.update');
    Route::patch('/visitors/{visitorLog}/checkout', [\App\Http\Controllers\Staff\VisitorController::class, 'checkout'])->name('visitors.checkout');
    Route::delete('/visitors/{visitorLog}', [\App\Http\Controllers\Staff\VisitorController::class, 'destroy'])->name('visitors.destroy');

    // Events management (Staff)
    Route::get('/events', [\App\Http\Controllers\Staff\EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [\App\Http\Controllers\Staff\EventController::class, 'create'])->name('events.create');
    Route::post('/events', [\App\Http\Controllers\Staff\EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}', [\App\Http\Controllers\Staff\EventController::class, 'show'])->name('events.show');
    Route::patch('/events/{event}', [\App\Http\Controllers\Staff\EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [\App\Http\Controllers\Staff\EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{event}/set-password', [\App\Http\Controllers\Staff\EventController::class, 'setPassword'])->name('events.setPassword');
    Route::post('/events/{event}/media', [\App\Http\Controllers\Staff\EventController::class, 'uploadMedia'])->name('events.media.upload');
    Route::delete('/events/{event}/media/{media}', [\App\Http\Controllers\Staff\EventController::class, 'removeMedia'])->name('events.media.remove');

    // JAKMAS assignment by staff
    Route::get('/jakmas', [\App\Http\Controllers\Staff\JakmasController::class, 'index'])->name('jakmas.index');
    Route::get('/jakmas/candidates', [\App\Http\Controllers\Staff\JakmasController::class, 'candidates'])->name('jakmas.candidates');
    Route::post('/jakmas/assign', [\App\Http\Controllers\Staff\JakmasController::class, 'assign'])->name('jakmas.assign');
    Route::patch('/jakmas/{jakmas}/revoke', [\App\Http\Controllers\Staff\JakmasController::class, 'revoke'])->name('jakmas.revoke');
});

// JAKMAS routes (auth + verified + jakmas)
Route::middleware(['auth', 'verified', 'jakmas'])->prefix('jakmas')->name('jakmas.')->group(function () {
    Route::get('/events', [\App\Http\Controllers\Jakmas\EventController::class, 'index'])->name('events.index');
    Route::get('/events/create', [\App\Http\Controllers\Jakmas\EventController::class, 'create'])->name('events.create');
    Route::post('/events', [\App\Http\Controllers\Jakmas\EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}', [\App\Http\Controllers\Jakmas\EventController::class, 'show'])->name('events.show');
    Route::patch('/events/{event}', [\App\Http\Controllers\Jakmas\EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [\App\Http\Controllers\Jakmas\EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{event}/set-password', [\App\Http\Controllers\Jakmas\EventController::class, 'setPassword'])->name('events.setPassword');
    Route::post('/events/{event}/media', [\App\Http\Controllers\Jakmas\EventController::class, 'uploadMedia'])->name('events.media.upload');
    Route::delete('/events/{event}/media/{media}', [\App\Http\Controllers\Jakmas\EventController::class, 'removeMedia'])->name('events.media.remove');
});

// Student event viewing + registration
Route::middleware(['auth','verified','student'])->prefix('student')->name('student.')->group(function() {
    Route::get('/events', [\App\Http\Controllers\Student\EventController::class, 'index'])->name('events.index');
    Route::get('/events/{event}', [\App\Http\Controllers\Student\EventController::class, 'show'])->name('events.show');
    Route::post('/events/{event}/register', [\App\Http\Controllers\Student\EventController::class, 'register'])->name('events.register');
    Route::post('/events/{event}/revoke', [\App\Http\Controllers\Student\EventController::class, 'revoke'])->name('events.revoke');
    Route::post('/events/{event}/attend', [\App\Http\Controllers\Student\EventController::class, 'attend'])->name('events.attend');
});
