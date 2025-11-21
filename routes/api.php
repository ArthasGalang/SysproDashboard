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
Route::get('/invenvaldb', function() {
    $warehouses = request()->query('warehouses');
    $productClasses = request()->query('product_classes');
    $whereClauses = [];
    $bindings = [];

    if ($warehouses) {
        $list = array_filter(array_map('trim', explode(',', $warehouses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "b.Warehouse IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }
    if ($productClasses) {
        $list = array_filter(array_map('trim', explode(',', $productClasses)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "a.ProductClass IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }
    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    $sql = <<<SQL
WITH LastMovement AS (
    SELECT 
        m.StockCode,
        m.Warehouse,
        MAX(m.EntryDate) AS LastMovementDate
    FROM InvMovements m
    GROUP BY m.StockCode, m.Warehouse
)
SELECT
    a.StockCode,
    a.Description AS ProductDescription,
    a.ProductClass,
    b.UnitCost,
    b.Warehouse,
    c.Description AS WarehouseDescription,
    b.QtyOnHand,
    b.UnitCost * b.QtyOnHand AS TotalValue,
    lm.LastMovementDate
FROM InvMaster a
JOIN InvWarehouse b
    ON a.StockCode = b.StockCode
JOIN InvWhControl c
    ON b.Warehouse = c.Warehouse
LEFT JOIN LastMovement lm
    ON a.StockCode = lm.StockCode
   AND b.Warehouse = lm.Warehouse
$whereSql
SQL;
    $data = DB::select($sql, $bindings);

    // Calculate summary stats for dashboard
    $totalValue = 0;
    $totalQty = 0;
    $uniqueStockCodes = [];
    $slowMovingValue = 0;
    $slowThreshold = now()->subMonths(12); 

    foreach ($data as $row) {
        $totalValue += (float)($row->TotalValue ?? 0);
        $totalQty += (float)($row->QtyOnHand ?? 0);
        if (!empty($row->StockCode)) $uniqueStockCodes[$row->StockCode] = true;
       
        if (empty($row->LastMovementDate) || (strtotime($row->LastMovementDate) < $slowThreshold->getTimestamp())) {
            $slowMovingValue += (float)($row->TotalValue ?? 0);
        }
    }

    return response()->json([
        'data' => $data,
        'TotalInventoryValue' => $totalValue,
        'TotalQuantityOnHand' => $totalQty,
        'UniqueStockCodes' => count($uniqueStockCodes),
        'SlowMovingStockValue' => $slowMovingValue,
    ]);
});


// --------------------------PURCHASING--------------------------
Route::get('/purchase', function() {
    $suppliers = request()->query('suppliers');
    $buyers = request()->query('buyers');
    $dateFrom = request()->query('dateFrom');
    $dateTo = request()->query('dateTo');

    $whereClauses = [];
    $bindings = [];

    if ($suppliers) {
        $list = array_filter(array_map('trim', explode(',', $suppliers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "a.Supplier IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($buyers) {
        $list = array_filter(array_map('trim', explode(',', $buyers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "a.Buyer IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    // Date range filters (filter by OrderEntryDate date portion)
    if (!empty($dateFrom)) {
        $whereClauses[] = "CAST(a.OrderEntryDate AS DATE) >= ?";
        $bindings[] = $dateFrom;
    }
    if (!empty($dateTo)) {
        $whereClauses[] = "CAST(a.OrderEntryDate AS DATE) <= ?";
        $bindings[] = $dateTo;
    }

    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    $sql = <<<SQL
WITH DetailJoin AS (
    SELECT 
        d.PurchaseOrder,
        d.MStockCode,
        d.MOrderQty,
        d.MPrice,
        CAST(d.MLatestDueDate AS DATE) AS MLatestDueDate,
        CAST(d.MLastReceiptDat AS DATE) AS MLastReceiptDat,
        ISNULL(SUM(f.CurGrnValue), 0) AS TotalCurGrnValue,
        ISNULL(SUM(f.OrigPurchValue), 0) AS TotalOrigPurchaseValue
    FROM PorMasterDetail d
    LEFT JOIN GrnDetails f
        ON d.PurchaseOrder = f.PurchaseOrder
        AND d.MStockCode = f.StockCode
    GROUP BY 
        d.PurchaseOrder,
        d.MStockCode,
        d.MOrderQty,
        d.MPrice,
        d.MLatestDueDate,
        d.MLastReceiptDat
)
SELECT 
    'PO-' + CAST(CAST(a.PurchaseOrder AS INT) AS VARCHAR) AS PONumber,
    a.Supplier,
    b.SupplierName,
    a.Buyer,
    e.Name AS BuyerName,
    a.OrderStatus,
    a.ActiveFlag,
    a.CancelledFlag,
    CAST(a.OrderEntryDate AS DATE) AS OrderEntryDate,
    CAST(MAX(dj.MLatestDueDate) AS DATE) AS MLatestDueDate,
    CAST(MAX(dj.MLastReceiptDat) AS DATE) AS MLastReceiptDat,
    SUM(dj.MPrice) AS TotalPrice,
    SUM(dj.MOrderQty) AS TotalOrderQty,
    SUM(dj.MPrice * dj.MOrderQty) AS POValue,
    SUM(dj.TotalCurGrnValue) AS TotalCurGrnValue,
    SUM(dj.TotalOrigPurchaseValue) AS TotalOrigPurchaseValue
FROM PorMasterHdr a
JOIN ApSupplier b 
    ON a.Supplier = b.Supplier
JOIN InvBuyer e
    ON a.Buyer = e.Buyer
JOIN DetailJoin dj
    ON a.PurchaseOrder = dj.PurchaseOrder
$whereSql
GROUP BY 
    a.PurchaseOrder,
    a.Supplier,
    b.SupplierName,
    a.Buyer,
    e.Name,
    a.OrderStatus,
    a.ActiveFlag,
    a.CancelledFlag,
    a.OrderEntryDate
ORDER BY PONumber DESC
SQL;

    $data = DB::select($sql, $bindings);
    return response()->json($data);
});

// Spend by supplier (YTD fixed year for now)
Route::get('/purchase/spend-by-supplier', function() {
    $year = request()->query('year', null);
    $suppliers = request()->query('suppliers');
    $buyers = request()->query('buyers');
    $dateFrom = request()->query('dateFrom');
    $dateTo = request()->query('dateTo');

    $whereClauses = [];
    $bindings = [];

    // If a date range is provided, use it. Otherwise, fall back to year if provided.
    if (!empty($dateFrom)) {
        $whereClauses[] = "CAST(a.OrderEntryDate AS DATE) >= ?";
        $bindings[] = $dateFrom;
    }
    if (!empty($dateTo)) {
        $whereClauses[] = "CAST(a.OrderEntryDate AS DATE) <= ?";
        $bindings[] = $dateTo;
    }
    if (empty($dateFrom) && empty($dateTo) && !empty($year)) {
        $whereClauses[] = "YEAR(a.OrderEntryDate) = ?";
        $bindings[] = $year;
    }

    if ($suppliers) {
        $list = array_filter(array_map('trim', explode(',', $suppliers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "a.Supplier IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    if ($buyers) {
        $list = array_filter(array_map('trim', explode(',', $buyers)));
        if (count($list)) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $whereClauses[] = "a.Buyer IN ($placeholders)";
            $bindings = array_merge($bindings, $list);
        }
    }

    // Build WHERE SQL
    $whereSql = '';
    if (count($whereClauses)) {
        $whereSql = 'WHERE ' . implode(' AND ', $whereClauses);
    }

    // Replace the view with your full query
    $sql = <<<SQL
WITH DetailJoin AS (
    SELECT 
        d.PurchaseOrder,
        d.MStockCode,
        d.MOrderQty,
        d.MPrice,
        CAST(d.MLatestDueDate AS DATE) AS MLatestDueDate,
        CAST(d.MLastReceiptDat AS DATE) AS MLastReceiptDat,
        ISNULL(SUM(f.CurGrnValue), 0) AS TotalCurGrnValue,
        ISNULL(SUM(f.OrigPurchValue), 0) AS TotalOrigPurchaseValue
    FROM PorMasterDetail d
    LEFT JOIN GrnDetails f
        ON d.PurchaseOrder = f.PurchaseOrder
        AND d.MStockCode = f.StockCode
    GROUP BY 
        d.PurchaseOrder,
        d.MStockCode,
        d.MOrderQty,
        d.MPrice,
        d.MLatestDueDate,
        d.MLastReceiptDat
),
PurchaseData AS (
    SELECT 
        a.Supplier,
        b.SupplierName,
        a.Buyer,
        e.Name AS BuyerName,
        SUM(dj.MPrice * dj.MOrderQty) AS POValue
    FROM PorMasterHdr a
    JOIN ApSupplier b 
        ON a.Supplier = b.Supplier
    JOIN InvBuyer e
        ON a.Buyer = e.Buyer
    JOIN DetailJoin dj
        ON a.PurchaseOrder = dj.PurchaseOrder
    $whereSql
    GROUP BY 
        a.Supplier,
        b.SupplierName,
        a.Buyer,
        e.Name
)
SELECT 
    Supplier,
    SupplierName,
    SUM(POValue) AS POValue
FROM PurchaseData
GROUP BY Supplier, SupplierName
ORDER BY Supplier
SQL;

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

// Return list of databases available on the current DB server
Route::get('/env/databases', function () {
    try {

        $driver = config('database.connections.' . config('database.default') . '.driver');
        if ($driver === 'mysql' || $driver === 'mysqli') {
            $rows = DB::select('SHOW DATABASES');
           
            $names = array_map(function ($r) {
                
                if (is_object($r)) {
                    $props = get_object_vars($r);
                    return reset($props);
                }
                if (is_array($r)) {
                    return reset($r);
                }
                return (string) $r;
            }, $rows);
            return response()->json(['databases' => $names]);
        }

     
        $connection = config('database.default');
        $dbName = config("database.connections.$connection.database") ?? env('DB_DATABASE');
        return response()->json(['databases' => [$dbName]]);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Could not list databases', 'message' => $e->getMessage()], 500);
    }
});


Route::post('/env/db-switch', function (Request $request) {
    $database = $request->input('database');
    if (empty($database)) {
        return response()->json(['error' => 'database is required'], 400);
    }

    $connection = config('database.default');
    $configKey = "database.connections.$connection.database";

    try {
        config([$configKey => $database]);

        DB::purge($connection);
        DB::reconnect($connection);

    $test = DB::connection($connection)->select('SELECT 1 as ok');

        return response()->json(['ok' => true, 'database' => $database, 'test' => $test]);
    } catch (\Exception $e) {
        return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
    }
});
