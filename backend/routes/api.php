<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DailyReportController;
use App\Http\Controllers\Api\ReportParserController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ForgotPasswordController;

Route::get('/health', fn () => ['status' => 'ok', 'app' => 'Koryaal']);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/verify-reset-code', [ForgotPasswordController::class, 'verifyResetCode']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('/register-company', [AuthController::class, 'registerCompany']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('daily-reports', DailyReportController::class);
    Route::apiResource('transactions', TransactionController::class)->only(['index','show','update','destroy']);
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/assign-project', [UserController::class, 'assignProject']);
    Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);

    Route::post('/parse-report', [ReportParserController::class, 'parse']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/reports/monthly', [DailyReportController::class, 'monthly']);
});



