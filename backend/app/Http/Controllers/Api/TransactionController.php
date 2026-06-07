<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->canViewFinancials()) {
            return response()->json([
                'message' => 'Only admins and finance users can view transactions.',
            ], 403);
        }

        return Transaction::query()
            ->whereHas('project', fn($q) => $q->where('company_id', $request->user()->company_id))
            ->when($request->project_id, fn($q) => $q->where('project_id', $request->project_id))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->payment_method, fn($q) => $q->where('payment_method', $request->payment_method))
            ->latest()
            ->paginate(30);
    }
    public function show(Request $request, Transaction $transaction)
    {
        $this->authorizeTransactionAccess($request, $transaction);

        return $transaction;
    }

    public function update(Request $request, Transaction $transaction)
    {
        $this->authorizeTransactionAccess($request, $transaction);
        $transaction->update($request->all());

        return $transaction;
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        $this->authorizeTransactionAccess($request, $transaction);
        $transaction->delete();

        return response()->noContent();
    }

    private function authorizeTransactionAccess(Request $request, Transaction $transaction): void
    {
        abort_unless($request->user()->canViewFinancials(), 403, 'Only admins and finance users can manage transactions.');
        $transaction->loadMissing('project');
        abort_unless(
            $transaction->project && $transaction->project->company_id === $request->user()->company_id,
            403,
            'You can only access transactions from your own company.'
        );
    }
}
