<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Company;
use App\Models\User;

class Project extends Model
{
    protected $fillable = [
        'company_id',
        'client_id',
        'project_name',
        'location',
        'start_date',
        'end_date',
        'budget',
        'status',
        'description',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = [
        'spent_amount',
        'income_amount',
        'cash_balance',
        'remaining_budget',
        'budget_status',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role_on_project')
            ->withTimestamps();
    }

    public function getSpentAmountAttribute()
    {
        if (array_key_exists('spent_amount_sum', $this->attributes)) {
            return (float) $this->attributes['spent_amount_sum'];
        }

        return (float) $this->transactions()
            ->where('type', 'expense')
            ->sum('amount');
    }

    public function getIncomeAmountAttribute()
    {
        if (array_key_exists('income_amount_sum', $this->attributes)) {
            return (float) $this->attributes['income_amount_sum'];
        }

        return (float) $this->transactions()
            ->where('type', 'income')
            ->sum('amount');
    }

    public function getCashBalanceAttribute()
    {
        return $this->income_amount - $this->spent_amount;
    }

    public function getRemainingBudgetAttribute()
    {
        return (float) $this->budget - $this->spent_amount;
    }

    public function getBudgetStatusAttribute()
    {
        if ($this->budget <= 0) {
            return 'no_budget';
        }

        if ($this->spent_amount > $this->budget) {
            return 'over_budget';
        }

        if ($this->spent_amount >= ($this->budget * 0.8)) {
            return 'near_limit';
        }

        return 'within_budget';
    }
}
