<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLES = ['admin', 'engineer', 'finance', 'client'];
    private const STATUSES = ['active', 'inactive'];
    private const PERMISSIONS = [
        'dashboard.view',
        'projects.view',
        'projects.manage',
        'projects.complete',
        'reports.create',
        'reports.view',
        'reports.view_own',
        'reports.approve',
        'finance.view',
        'excel.export',
        'users.manage',
        'client.progress.view',
    ];

    public function index()
    {
        $authUser = request()->user();

        if (!$authUser->canManageUsers()) {
            return response()->json([
                'message' => 'Only company admins can manage users.',
            ], 403);
        }

        return User::with(['company', 'projects'])
            ->where('company_id', $authUser->company_id)
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser->canManageUsers()) {
            return response()->json([
                'message' => 'Only company admins can create users.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:8',
            'role' => ['required', Rule::in(self::ROLES)],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'integer|exists:projects,id',
            'role_on_project' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', Rule::in(self::PERMISSIONS)],
        ]);

        $role = $validated['role'];

        $user = User::create([
            'company_id' => $authUser->company_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password'] ?? 'password123'),
            'role' => $role,
            'status' => $validated['status'] ?? 'active',
            'permissions' => $validated['permissions'] ?? User::defaultPermissionsForRole($role),
        ]);

        $this->syncProjects(
            $user,
            $validated['project_ids'] ?? [],
            $validated['role_on_project'] ?? null
        );

        return response()->json($user->load('projects'), 201);
    }

    public function show(Request $request, User $user)
    {
        $this->authorizeCompanyUser($request, $user);

        return $user->load(['company', 'projects']);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeCompanyUser($request, $user);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:8',
            'role' => ['nullable', Rule::in(self::ROLES)],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'integer|exists:projects,id',
            'role_on_project' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => ['string', Rule::in(self::PERMISSIONS)],
        ]);

        $user->fill(collect($validated)
            ->only(['name', 'email', 'phone', 'role', 'status'])
            ->toArray());

        if (array_key_exists('permissions', $validated)) {
            $user->permissions = $validated['permissions'];
        } elseif (array_key_exists('role', $validated) && empty($user->permissions)) {
            $user->permissions = User::defaultPermissionsForRole($validated['role']);
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if ($request->has('project_ids')) {
            $this->syncProjects(
                $user,
                $validated['project_ids'] ?? [],
                $validated['role_on_project'] ?? null
            );
        }

        return $user->load(['company', 'projects']);
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeCompanyUser($request, $user);

        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own admin account while logged in.',
            ], 422);
        }

        $user->projects()->detach();
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    public function assignProject(Request $request, User $user)
    {
        $this->authorizeCompanyUser($request, $user);

        $validated = $request->validate([
            'project_id' => 'nullable|integer|exists:projects,id',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'integer|exists:projects,id',
            'role_on_project' => 'nullable|string|max:255',
        ]);

        $projectIds = $validated['project_ids'] ?? [];

        if (!empty($validated['project_id'])) {
            $projectIds[] = $validated['project_id'];
        }

        $this->syncProjects(
            $user,
            array_values(array_unique($projectIds)),
            $validated['role_on_project'] ?? null
        );

        return $user->load(['company', 'projects']);
    }

    public function updateStatus(Request $request, User $user)
    {
        $this->authorizeCompanyUser($request, $user);

        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account while logged in.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $user->update([
            'status' => $validated['status'],
        ]);

        return $user->load(['company', 'projects']);
    }

    private function syncProjects(User $user, array $projectIds, ?string $roleOnProject): void
    {
        $validProjectIds = Project::where('company_id', $user->company_id)
            ->whereIn('id', $projectIds)
            ->pluck('id')
            ->all();

        $syncData = collect($projectIds)
            ->intersect($validProjectIds)
            ->filter()
            ->unique()
            ->mapWithKeys(fn ($projectId) => [
                $projectId => ['role_on_project' => $roleOnProject],
            ])
            ->toArray();

        $user->projects()->sync($syncData);
    }

    private function authorizeCompanyUser(Request $request, User $user): void
    {
        $authUser = $request->user();

        abort_unless($authUser->canManageUsers(), 403, 'Only company admins can manage users.');
        abort_unless(
            $authUser->company_id === $user->company_id,
            403,
            'You can only manage users from your own company.'
        );
    }
}
