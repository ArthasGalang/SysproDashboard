<?php

namespace App\Http\Controllers;

use App\Models\InvenValDB;

class InvenValDBController extends Controller
{
    public function index()
    {
        $stocks = InvenValDB::all();
        return response()->json($stocks);
    }
}
