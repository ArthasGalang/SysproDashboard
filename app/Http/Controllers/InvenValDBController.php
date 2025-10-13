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

        // Calculate stats
        $totalInventoryValue = $stocks->sum('TotalValue');
        $totalQuantityOnHand = $stocks->sum('QtyOnHand');
        $uniqueStockCodes = $stocks->unique('StockCode')->count();

        // Slow-Moving Stock Value: sum TotalValue where LastMovementDate is null or > 180 days ago
        $slowMovingThreshold = now()->subDays(180);
        $slowMovingStockValue = $stocks->filter(function($item) use ($slowMovingThreshold) {
            if (empty($item->LastMovementDate)) return true;
            try {
                $date = \Carbon\Carbon::parse($item->LastMovementDate);
                return $date->lessThan($slowMovingThreshold);
            } catch (\Exception $e) {
                return false;
            }
        })->sum('TotalValue');

        return response()->json([
            'TotalInventoryValue' => $totalInventoryValue,
            'TotalQuantityOnHand' => $totalQuantityOnHand,
            'UniqueStockCodes' => $uniqueStockCodes,
            'SlowMovingStockValue' => $slowMovingStockValue,
            'data' => $stocks,
        ]);
    }
}
