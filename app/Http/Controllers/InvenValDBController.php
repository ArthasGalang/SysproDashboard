<?php

namespace App\Http\Controllers;

use App\Models\InvenValDB;

class InvenValDBController extends Controller
{
    public function index()
    {
        $query = InvenValDB::query();

        $warehouses = request()->query('warehouses');
        $productClasses = request()->query('product_classes');

        if ($warehouses) {
            $list = array_filter(array_map('trim', explode(',', $warehouses)));
            if (count($list)) {
                $query->whereIn('Warehouse', $list);
            }
        }

        if ($productClasses) {
            $list = array_filter(array_map('trim', explode(',', $productClasses)));
            if (count($list)) {
                $query->whereIn('ProductClass', $list);
            }
        }

        $stocks = $query->get();
        return response()->json($stocks);
    }
}
