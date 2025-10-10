<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvenValDB extends Model
{
    protected $table = 'vw_PurchasingDB';  
    protected $primaryKey = 'PONumber';    
    public $incrementing = false;
    public $timestamps = false;            

    protected $casts = [
        'TotalOrderQty' => 'integer',
        'TotalPrice' => 'float',
        'POValue' => 'float',
    ];
}
