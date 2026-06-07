<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\DailyReport;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user()->loadMissing('company');
        $companyId = $user->company_id;
        $monthStart = now()->startOfMonth();

        return [
            'company_id' => $companyId,
            'company_name' => $user->company?->name,
            'company_status' => $user->company?->status,
            'user_role' => $user->role,
            'projects' => Project::where('company_id', $companyId)->count(),
            'active_projects' => Project::where('company_id', $companyId)->where('status','in_progress')->count(),
            'pending_reports' => DailyReport::whereHas('project', fn ($q) => $q->where('company_id', $companyId))->where('status','pending')->count(),
            'this_month_expenses' => Transaction::whereHas('project', fn ($q) => $q->where('company_id', $companyId))->where('type','expense')->where('created_at','>=',$monthStart)->sum('amount'),
            'this_month_income' => Transaction::whereHas('project', fn ($q) => $q->where('company_id', $companyId))->where('type','income')->where('created_at','>=',$monthStart)->sum('amount'),
            'needs_review' => Transaction::whereHas('project', fn ($q) => $q->where('company_id', $companyId))->where('needs_review', true)->count(),
        ];
    }
}
