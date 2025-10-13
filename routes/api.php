<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Inertia\Inertia;
use App\Http\Controllers\InvenValDBController;
use App\Http\Controllers\PurchasingDBController;
use Illuminate\Support\Facades\DB;


// ---------------------------INVENVAL---------------------------
Route::get('/invenvaldb', [InvenValDBController::class, 'index']);


// --------------------------PURCHASING--------------------------
Route::get('/purchase', function() {
    $suppliers = request()->query('suppliers');
    $buyers = request()->query('buyers');

    $whereClauses = [];
    $bindings = [];

    if ($suppliers) {
        $list = array_filter(array_map('trim', explode(',', $suppliers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            // filter by SupplierName (frontend sends SupplierName values)
            $whereClauses[] = "SupplierName IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($buyers) {
        $list = array_filter(array_map('trim', explode(',', $buyers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            // filter by Buyer (frontend sends Buyer codes)
            $whereClauses[] = "Buyer IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    $sql = "SELECT * FROM vw_PurchasingDB" . $whereSql . " ORDER BY PONumber DESC";
    $data = DB::select($sql, $bindings);
    return response()->json($data);
});

// Spend by supplier (YTD fixed year for now)
Route::get('/purchase/spend-by-supplier', function() {
    // Fixed year - change as needed or make dynamic via query param
    $year = request()->query('year', '2021');
    $suppliers = request()->query('suppliers');
    $buyers = request()->query('buyers');

    $whereClauses = [];
    $bindings = [];

    // year filter first
    if ($year) {
        $whereClauses[] = "YEAR(OrderEntryDate) = ?";
        $bindings[] = $year;
    }

    if ($suppliers) {
        $list = array_filter(array_map('trim', explode(',', $suppliers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "SupplierName IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($buyers) {
        $list = array_filter(array_map('trim', explode(',', $buyers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "Buyer IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }
    $sql = "SELECT Supplier, SupplierName, SUM(CAST(POValue AS DECIMAL(18,2))) AS POValue
            FROM vw_PurchasingDB" . $whereSql . " GROUP BY Supplier, SupplierName ORDER BY POValue DESC";

    $data = DB::select($sql, $bindings);
    return response()->json($data);
});



Route::get('/env/db-name', function () {
    $connection = config('database.default');
    $dbName = config("database.connections.$connection.database");
    if (empty($dbName)) {
        $dbName = env('DB_DATABASE', 'unknown');
    }
    return response()->json(['db' => $dbName, 'connection' => $connection]);
});
