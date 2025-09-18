<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\InvenValDBController;
use Illuminate\Support\Facades\DB;

Route::get('/api/value-by-class', function () {
    $data = DB::select("
        SELECT ProductClass, SUM(QtyOnHand * UnitCost) as TotalValue
        FROM vw_InvenValDB
        GROUP BY ProductClass
    ");
    return response()->json($data);
});


Route::get('/api/stocks', [InvenValDBController::class, 'index']);


Route::get('/api/stats', function () {
    $data = DB::selectOne("
        SELECT 
            MAX(GrandTotalValue) AS TotalInventoryValue,
            SUM(QtyOnHand) AS TotalQuantityOnHand,
            COUNT(DISTINCT StockCode) AS UniqueStockCodes,
            SUM(CASE WHEN QtyOnHand < 10 THEN (QtyOnHand * UnitCost) ELSE 0 END) AS SlowMovingStockValue
        FROM vw_InvenValDB
    ");

    return response()->json($data);
});

Route::get('/', function () {
    return Inertia::render('Dashboard');
})->name('Dashboard');


// Route::get('/api/stocks', function () {
//     $data = DB::select('SELECT * FROM dbo.vw_InvenValDB'); // 👈 add schema
//     return response()->json($data);
// });



