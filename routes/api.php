<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InvenValDBController;
use Illuminate\Support\Facades\DB;

Route::get('/api/value-by-class', function () {
    $data = DB::select("
        SELECT ProductClass
        FROM vw_ProductStock
        GROUP BY ProductClass
    ");
    return response()->json($data);
});

Route::get('/stocks', [InvenValDBController::class, 'index']);
    