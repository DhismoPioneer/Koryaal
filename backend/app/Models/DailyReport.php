<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DailyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id','submitted_by','report_date','raw_message','provided_total','calculated_total',
        'difference','payment_method','status','ai_summary','notes'
    ];

    protected $casts = [
        'report_date' => 'date',
        'provided_total' => 'decimal:2',
        'calculated_total' => 'decimal:2',
        'difference' => 'decimal:2',
    ];

    public function project(){ return $this->belongsTo(Project::class); }
    public function transactions(){ return $this->hasMany(Transaction::class); }
    public function attachments(){ return $this->hasMany(Attachment::class); }
}
