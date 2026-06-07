<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\DailyReport;
use App\Models\Project;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyReportController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->visibleReports($request)
            ->with(['project.client', 'transactions', 'attachments'])
            ->latest();

        if ($request->query('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }

        if ($request->query('month')) {
            $month = $request->query('month'); // format: 2026-06

            $query->whereYear('report_date', substr($month, 0, 4))
                  ->whereMonth('report_date', substr($month, 5, 2));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'report_date' => 'required|date',
            'raw_message' => 'required|string',

            'payment_method' => 'nullable|string',
            'provided_total' => 'nullable|numeric',
            'calculated_total' => 'nullable|numeric',
            'difference' => 'nullable|numeric',
            'total_status' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,webp,pdf',

            'transactions' => 'nullable|array',
            'transactions.*.type' => 'nullable|string',
            'transactions.*.category' => 'nullable|string',
            'transactions.*.description' => 'required_with:transactions|string',
            'transactions.*.quantity' => 'nullable|numeric',
            'transactions.*.unit_price' => 'nullable|numeric',
            'transactions.*.amount' => 'required_with:transactions|numeric',
            'transactions.*.currency' => 'nullable|string',
            'transactions.*.payment_method' => 'nullable|string',
            'transactions.*.payment_reference' => 'nullable|string',
            'transactions.*.paid_to' => 'nullable|string',
            'transactions.*.paid_by' => 'nullable|string',
            'transactions.*.needs_review' => 'nullable|boolean',
            'transactions.*.review_reason' => 'nullable|string',
            'transactions.*.expected_amount' => 'nullable|numeric',
            'transactions.*.calculation_error' => 'nullable|boolean',
        ]);

        $user = $request->user();

        if (!$user->canCreateReports() && !$user->canViewFinancials()) {
            return response()->json([
                'message' => 'You do not have permission to submit daily or manual financial reports.',
            ], 403);
        }

        $project = Project::where('company_id', $user->company_id)
            ->findOrFail($validated['project_id']);

        if (!$user->canManageProjects() && !$project->users()->where('users.id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You can only submit reports for assigned projects.',
            ], 403);
        }

        if ($project->status === 'completed') {
            return response()->json([
                'message' => 'This project is completed. You cannot add a new report to a completed project.',
            ], 422);
        }

        $calculationErrors = collect($validated['transactions'] ?? [])
            ->filter(fn ($item) => !empty($item['calculation_error']))
            ->values();

        if ($calculationErrors->isNotEmpty()) {
            return response()->json([
                'message' => 'Cannot save report because one or more lines have wrong calculations. Please correct quantity x rate totals first.',
                'errors' => $calculationErrors->map(fn ($item) => [
                    'description' => $item['description'] ?? '',
                    'review_reason' => $item['review_reason'] ?? 'Wrong calculation.',
                ]),
            ], 422);
        }

        if (($validated['total_status'] ?? null) === 'mismatch') {
            return response()->json([
                'message' => 'Cannot save report because provided Total does not match calculated transactions.',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $request, $user) {
            $report = DailyReport::create([
                'project_id' => $validated['project_id'],
                'submitted_by' => $user->id,
                'report_date' => $validated['report_date'],
                'raw_message' => $validated['raw_message'],
                'provided_total' => $validated['provided_total'] ?? null,
                'calculated_total' => $validated['calculated_total'] ?? 0,
                'difference' => $validated['difference'] ?? 0,
                'payment_method' => $validated['payment_method'] ?? 'Not Provided',
                'status' => 'pending',
                'ai_summary' => null,
                'notes' => $validated['total_status'] ?? null,
            ]);

            foreach (($validated['transactions'] ?? []) as $item) {
                Transaction::create([
                    'daily_report_id' => $report->id,
                    'project_id' => $report->project_id,

                    'type' => $item['type'] ?? 'expense',
                    'category' => $item['category'] ?? 'other',
                    'description' => $item['description'],

                    'quantity' => $item['quantity'] ?? null,
                    'unit_price' => $item['unit_price'] ?? null,
                    'amount' => $item['amount'],
                    'currency' => $item['currency'] ?? 'USD',

                    'payment_method' => $item['payment_method'] ?? ($validated['payment_method'] ?? 'Not Provided'),
                    'payment_reference' => $item['payment_reference'] ?? null,
                    'paid_to' => $item['paid_to'] ?? null,
                    'paid_by' => $item['paid_by'] ?? null,

                    'status' => !empty($item['needs_review']) ? 'pending' : 'approved',
                    'needs_review' => $item['needs_review'] ?? false,
                    'review_reason' => $item['review_reason'] ?? null,
                ]);
            }

            foreach ($request->file('attachments', []) as $file) {
                Attachment::create([
                    'daily_report_id' => $report->id,
                    'project_id' => $report->project_id,
                    'file_path' => $file->store('attachments/daily-reports', 'public'),
                    'file_data' => file_get_contents($file->getRealPath()),
                    'file_type' => $this->detectAttachmentType($file->getClientOriginalExtension(), $file->getMimeType()),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'extracted_text' => $file->getClientOriginalName(),
                    'status' => 'pending',
                ]);
            }

            return $report->load(['project.client', 'transactions', 'attachments']);
        });
    }

    public function show(Request $request, DailyReport $dailyReport)
    {
        $this->authorizeReportAccess($request, $dailyReport);

        return $dailyReport->load(['project.client', 'transactions']);
    }

    public function update(Request $request, DailyReport $dailyReport)
    {
        $this->authorizeReportAccess($request, $dailyReport);

        if (!$request->user()->canApproveReports()) {
            return response()->json([
                'message' => 'Only admins and finance users can approve or update reports.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'ai_summary' => 'nullable|string',
        ]);

        $dailyReport->update($validated);

        return $dailyReport->load(['project.client', 'transactions']);
    }

    public function destroy(Request $request, DailyReport $dailyReport)
    {
        $this->authorizeReportAccess($request, $dailyReport);

        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Only company admins can delete reports.',
            ], 403);
        }

        $dailyReport->delete();

        return response()->json([
            'message' => 'Daily report deleted successfully',
        ]);
    }

    public function allReports(Request $request)
    {
        $query = $this->visibleReports($request)
            ->with(['project.client', 'transactions', 'attachments'])
            ->orderBy('report_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->query('project_id')) {
            $query->where('project_id', $request->query('project_id'));
        }

        return $query->get();
    }

    public function monthly(Request $request)
    {
        if (!$request->user()->canViewFinancials()) {
            return response()->json([
                'message' => 'Only admins and finance users can view monthly financial reports.',
            ], 403);
        }

        $projectId = $request->query('project_id');
        $month = $request->query('month'); // format: 2026-06

        $query = DailyReport::whereHas('project', fn ($projects) => $projects
                ->where('company_id', $request->user()->company_id))
            ->with(['project.client', 'transactions', 'attachments'])
            ->orderBy('report_date', 'asc')
            ->orderBy('id', 'asc');

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        if ($month) {
            $query->whereYear('report_date', substr($month, 0, 4))
                  ->whereMonth('report_date', substr($month, 5, 2));
        }

        $reports = $query->get();
        $transactions = $reports->flatMap->transactions;

        $rows = [];

        foreach ($reports as $report) {
            foreach ($report->transactions as $transaction) {
                $rows[] = [
                    'report_id' => $report->id,
                    'date' => $report->report_date,
                    'project_name' => $report->project->project_name ?? '',
                    'description' => $transaction->description,
                    'category' => $transaction->category,
                    'qty' => $transaction->quantity,
                    'rate' => $transaction->unit_price,
                    'amount' => $transaction->amount,
                    'payment' => $transaction->payment_method,
                    'review' => $transaction->needs_review ? 'Check' : 'OK',
                ];
            }
        }

        $totalIncome = $transactions
            ->where('type', 'income')
            ->sum('amount');

        $totalExpenses = $transactions
            ->where('type', 'expense')
            ->sum('amount');

        return response()->json([
            'project_id' => $projectId,
            'month' => $month,

            'reports_count' => $reports->count(),
            'transactions_count' => count($rows),

            'total_expenses' => $totalExpenses,
            'total_income' => $totalIncome,
            'balance' => $totalIncome - $totalExpenses,

            'by_category' => $transactions
                ->groupBy('category')
                ->map(fn ($items) => $items->sum('amount')),

            'by_payment_method' => $transactions
                ->groupBy('payment_method')
                ->map(fn ($items) => $items->sum('amount')),

            'rows' => $rows,
            'reports' => $reports,
        ]);
    }

    private function visibleReports(Request $request)
    {
        $user = $request->user();

        $query = DailyReport::query()
            ->whereHas('project', fn ($projects) => $projects->where('company_id', $user->company_id));

        if ($user->hasPermission('reports.view_own') && !$user->hasPermission('reports.view')) {
            $query->where('submitted_by', $user->id);
        }

        if ($user->hasPermission('client.progress.view') && !$user->hasPermission('reports.view')) {
            $query->whereHas('project.users', fn ($users) => $users->where('users.id', $user->id));
        }

        return $query;
    }

    private function detectAttachmentType(?string $extension, ?string $mimeType): string
    {
        $extension = strtolower((string) $extension);
        $mimeType = strtolower((string) $mimeType);

        if ($extension === 'pdf' || $mimeType === 'application/pdf') {
            return 'invoice';
        }

        if (str_starts_with($mimeType, 'image/') || in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            return 'receipt';
        }

        return 'other';
    }

    private function authorizeReportAccess(Request $request, DailyReport $dailyReport): void
    {
        $dailyReport->loadMissing('project');
        $user = $request->user();

        abort_unless(
            $dailyReport->project && $dailyReport->project->company_id === $user->company_id,
            403,
            'You can only access reports from your own company.'
        );

        if ($user->hasPermission('reports.view_own') && !$user->hasPermission('reports.view')) {
            abort_unless(
                (int) $dailyReport->submitted_by === (int) $user->id,
                403,
                'Engineers can only access reports they submitted.'
            );
        }

        if ($user->hasPermission('client.progress.view') && !$user->hasPermission('reports.view')) {
            abort_unless(
                $dailyReport->project->users()->where('users.id', $user->id)->exists(),
                403,
                'Clients can only access assigned project reports.'
            );
        }
    }
}

