<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SetDatabaseFromSession
{
    public function handle(Request $request, Closure $next)
    {
        $sessionDb = session('selected_database');
        if ($sessionDb) {
            $connection = config('database.default');
            $configKey = "database.connections.$connection.database";
            config([$configKey => $sessionDb]);
            DB::purge($connection);
            DB::reconnect($connection);
        }
        return $next($request);
    }
}
