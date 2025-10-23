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
