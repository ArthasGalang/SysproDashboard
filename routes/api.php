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
    $slowThreshold = now()->subMonths(12); // 12 months ago

    foreach ($data as $row) {
        $totalValue += (float)($row->TotalValue ?? 0);
        $totalQty += (float)($row->QtyOnHand ?? 0);
        if (!empty($row->StockCode)) $uniqueStockCodes[$row->StockCode] = true;
        // Slow-moving: no movement in 12+ months
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
            FROM vw_PurchasingDB" . $whereSql . " GROUP BY Supplier, SupplierName";

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
        // This uses the current DB connection and runs a provider-specific query.
        // For MySQL/MariaDB use SHOW DATABASES; for other drivers this may need to change.
        $driver = config('database.connections.' . config('database.default') . '.driver');
        if ($driver === 'mysql' || $driver === 'mysqli') {
            $rows = DB::select('SHOW DATABASES');
            // rows are objects with Database property
            $names = array_map(function ($r) {
                // some PDO drivers return associative arrays
                if (is_object($r)) {
                    // common key is 'Database'
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

        // Fallback: return configured database only
        $connection = config('database.default');
        $dbName = config("database.connections.$connection.database") ?? env('DB_DATABASE');
        return response()->json(['databases' => [$dbName]]);
    } catch (\Exception $e) {
        return response()->json(['error' => 'Could not list databases', 'message' => $e->getMessage()], 500);
    }
});

// Switch the active database for the current runtime (in-memory) connection
Route::post('/env/db-switch', function (Request $request) {
    $database = $request->input('database');
    if (empty($database)) {
        return response()->json(['error' => 'database is required'], 400);
    }

    $connection = config('database.default');
    $configKey = "database.connections.$connection.database";

    try {
        // Set runtime config value
        config([$configKey => $database]);

        // Purge and reconnect so the DB facade uses the new database
        DB::purge($connection);
        DB::reconnect($connection);

    // Run a lightweight test query to confirm the new connection works
    // Use a plain string query so PDO receives a string (avoid passing a Query\Expression)
    $test = DB::connection($connection)->select('SELECT 1 as ok');

        return response()->json(['ok' => true, 'database' => $database, 'test' => $test]);
    } catch (\Exception $e) {
        return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
    }
});
