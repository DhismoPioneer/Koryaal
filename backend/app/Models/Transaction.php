<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_report_id','project_id','type','category','description','quantity','unit_price','amount','currency',
        'payment_method','payment_reference','paid_to','paid_by','status','needs_review','review_reason'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'needs_review' => 'boolean',
    ];

    public function dailyReport(){ return $this->belongsTo(DailyReport::class); }
    public function project(){ return $this->belongsTo(Project::class); }
}
