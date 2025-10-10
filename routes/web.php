<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\InvenValDBController;
use Illuminate\Support\Facades\DB;















Route::get('/', function () {
    return Inertia::render('InvenValDB');
})->name('InvenValDB');

Route::get('/InvenValDB', function () {
    return Inertia::render('InvenValDB');
})->name('InvenValDB');

Route::get('/ARDB', function () {
    return Inertia::render('ARDB');
})->name('ARDB');

Route::get('/PurchasingDB', function () {
    return Inertia::render('PurchasingDB');
})->name('PurchasingDB');

Route::get('/SalesDB', function () {
    return Inertia::render('SalesDB');
})->name('SalesDB');




