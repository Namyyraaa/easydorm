<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Events\ManageEventController;

class EventController extends ManageEventController
{
    // Inherits all actions; guarded by 'staff' middleware via routes
}
