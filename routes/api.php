<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Inertia\Inertia;
use App\Http\Controllers\InvenValDBController;
use App\Http\Controllers\PurchasingDBController;
use Illuminate\Support\Facades\DB;

Route::get('/value-by-class', function () {
    $warehouses = request()->query('warehouses');
    $productClasses = request()->query('product_classes');

    $whereClauses = [];
    $bindings = [];

    if ($warehouses) {
        $list = array_filter(array_map('trim', explode(',', $warehouses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "Warehouse IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($productClasses) {
        $list = array_filter(array_map('trim', explode(',', $productClasses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "ProductClass IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    $sql = "SELECT ProductClass, SUM(QtyOnHand * UnitCost) as TotalValue FROM vw_InvenValDB" . $whereSql . " GROUP BY ProductClass";
    $data = DB::select($sql, $bindings);
    return response()->json($data);
});




Route::get('/value-by-warehouse', function () {
    $warehouses = request()->query('warehouses');
    $productClasses = request()->query('product_classes');

    $whereClauses = [];
    $bindings = [];

    if ($warehouses) {
        $list = array_filter(array_map('trim', explode(',', $warehouses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "Warehouse IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($productClasses) {
        $list = array_filter(array_map('trim', explode(',', $productClasses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "ProductClass IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    $sql = "SELECT Warehouse, SUM(QtyOnHand * UnitCost) as TotalValue FROM vw_InvenValDB" . $whereSql . " GROUP BY Warehouse";
    $data = DB::select($sql, $bindings);
    return response()->json($data);
});

Route::get('/purchase', function() {
    $sql = "SELECT * FROM vw_PurchasingDB ORDER BY PONumber DESC";
    $data = DB::select($sql);
    return response()->json($data);
});

Route::get('/stats', function () {
    $warehouses = request()->query('warehouses');
    $productClasses = request()->query('product_classes');

    $whereClauses = [];
    $bindings = [];

    if ($warehouses) {
        $list = array_filter(array_map('trim', explode(',', $warehouses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "Warehouse IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($productClasses) {
        $list = array_filter(array_map('trim', explode(',', $productClasses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "ProductClass IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = ' WHERE ' . implode(' AND ', $whereClauses);
    }

    // Calculate totals over the filtered rows. Use SUM for total inventory value
    // and slow-moving stock value so they respect the WHERE filters.
    $sql = "SELECT
            SUM(QtyOnHand * UnitCost) AS TotalInventoryValue,
            SUM(QtyOnHand) AS TotalQuantityOnHand,
            COUNT(DISTINCT StockCode) AS UniqueStockCodes,
            MAX(SlowMovingStockTotal) AS SlowMovingStockValue
        FROM vw_InvenValDB" . $whereSql;

    $data = DB::selectOne($sql, $bindings);

    return response()->json($data);
});




Route::get('/stocks', [InvenValDBController::class, 'index']);

Route::get('/purchasing', [PurchasingDBController::class, 'index']);
