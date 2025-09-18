<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvenValDB extends Model
{
    protected $table = 'vw_InvenValDB';   // name of your SQL Server view
    protected $primaryKey = 'StockCode';    // pick a unique column if available
    public $incrementing = false;
    public $timestamps = false;             // views don’t have timestamps

    protected $casts = [
        'QtyOnHand' => 'integer',
    ];
}
