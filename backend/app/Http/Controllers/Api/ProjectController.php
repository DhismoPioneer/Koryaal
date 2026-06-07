<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return $this->visibleProjects($request)
            ->with(['client', 'transactions'])
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        if (!$request->user()->canManageProjects()) {
            return response()->json([
                'message' => 'Only company admins can create projects.',
            ], 403);
        }

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'project_name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'status' => [
                'nullable',
                Rule::in(['pending', 'in_progress', 'completed', 'delayed']),
            ],
            'description' => 'nullable|string',
        ]);

        $this->authorizeCompanyClient($request, $validated['client_id'] ?? null);

        $project = Project::create([
            'company_id' => $request->user()->company_id,
            'client_id' => $validated['client_id'] ?? null,
            'project_name' => $validated['project_name'],
            'location' => $validated['location'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'budget' => $validated['budget'] ?? 0,
            'status' => $validated['status'] ?? 'pending',
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json(
            $project->load(['client', 'transactions']),
            201
        );
    }

    public function show(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        return $project->load([
            'client',
            'transactions',
            'dailyReports.transactions',
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        $isCompletionOnly = $request->user()->hasPermission('projects.complete')
            && collect($request->all())->keys()->diff(['status', 'end_date'])->isEmpty();

        if (!$request->user()->canManageProjects() && !$isCompletionOnly) {
            return response()->json([
                'message' => 'You do not have permission to update projects.',
            ], 403);
        }

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'project_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'status' => [
                'nullable',
                Rule::in(['pending', 'in_progress', 'completed', 'delayed']),
            ],
            'description' => 'nullable|string',
        ]);

        $this->authorizeCompanyClient($request, $validated['client_id'] ?? null);

        if (
            ($validated['status'] ?? null) === 'completed'
            && empty($validated['end_date'])
            && empty($project->end_date)
        ) {
            $validated['end_date'] = now()->toDateString();
        }

        $project->update($validated);

        return $project->load(['client', 'transactions']);
    }

    public function destroy(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project);

        if (!$request->user()->canManageProjects()) {
            return response()->json([
                'message' => 'Only company admins can delete projects.',
            ], 403);
        }

        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully',
        ]);
    }

    private function visibleProjects(Request $request)
    {
        $user = $request->user();

        $query = Project::query()
            ->where('company_id', $user->company_id);

        if (!$user->canManageProjects() && !$user->canViewFinancials()) {
            $query->whereHas('users', fn ($users) => $users->where('users.id', $user->id));
        }

        return $query;
    }

    private function authorizeProjectAccess(Request $request, Project $project): void
    {
        $user = $request->user();

        abort_unless(
            $project->company_id === $user->company_id,
            403,
            'You can only access projects from your own company.'
        );

        if (!$user->canManageProjects() && !$user->canViewFinancials()) {
            abort_unless(
                $project->users()->where('users.id', $user->id)->exists(),
                403,
                'You can only access projects assigned to you.'
            );
        }
    }

    private function authorizeCompanyClient(Request $request, $clientId): void
    {
        if (!$clientId) {
            return;
        }

        abort_unless(
            Client::where('company_id', $request->user()->company_id)->where('id', $clientId)->exists(),
            422,
            'Selected client does not belong to your company.'
        );
    }
}
