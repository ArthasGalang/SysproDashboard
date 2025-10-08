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

Route::get('/api/value-by-warehouse', function () {
    $data = DB::select("
        SELECT Warehouse, SUM(QtyOnHand * UnitCost) as TotalValue
        FROM vw_InvenValDB
        GROUP BY Warehouse
    ");
    return response()->json($data);
});

Route::get('/api/stats', function () {
    $data = DB::selectOne("
        SELECT
            MAX(GrandTotalValue) AS TotalInventoryValue,
            SUM(QtyOnHand) AS TotalQuantityOnHand,
            COUNT(DISTINCT StockCode) AS UniqueStockCodes,
            MAX(SlowMovingStockTotal) AS SlowMovingStockValue
        FROM vw_InvenValDB
    ");

    return response()->json($data);
});















Route::get('/api/stocks', [InvenValDBController::class, 'index']);


Route::get('/', function () {
    return Inertia::render('InvenValDB');
})->name('InvenValDB');

Route::get('/InvenValDB', function () {
    return Inertia::render('InvenValDB');
})->name('InvenValDB');

Route::get('/ARDB', function () {
    return Inertia::render('ARDB');
})->name('ARDB');

Route::get('/PurchasingDB', function () {
    return Inertia::render('PurchasingDB');
})->name('PurchasingDB');

Route::get('/SalesDB', function () {
    return Inertia::render('SalesDB');
})->name('SalesDB');




