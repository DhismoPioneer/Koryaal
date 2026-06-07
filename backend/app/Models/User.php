<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use App\Models\Company;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
        ];
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class)
            ->withPivot('role_on_project')
            ->withTimestamps();
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isFinance(): bool
    {
        return $this->role === 'finance';
    }

    public function isEngineer(): bool
    {
        return $this->role === 'engineer';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function canManageUsers(): bool
    {
        return $this->hasPermission('users.manage');
    }

    public function canManageProjects(): bool
    {
        return $this->hasPermission('projects.manage');
    }

    public function canViewFinancials(): bool
    {
        return $this->hasPermission('finance.view');
    }

    public function canApproveReports(): bool
    {
        return $this->hasPermission('reports.approve');
    }

    public function canCreateReports(): bool
    {
        return $this->hasPermission('reports.create');
    }

    public function canViewDashboard(): bool
    {
        return $this->hasPermission('dashboard.view');
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permissions = $this->permissions ?? self::defaultPermissionsForRole($this->role);

        return in_array($permission, $permissions, true);
    }

    public static function defaultPermissionsForRole(string $role): array
    {
        return match ($role) {
            'admin' => [
                'dashboard.view',
                'projects.view',
                'projects.manage',
                'projects.complete',
                'reports.create',
                'reports.view',
                'reports.approve',
                'finance.view',
                'excel.export',
                'users.manage',
            ],
            'finance' => [
                'dashboard.view',
                'projects.view',
                'reports.view',
                'reports.approve',
                'finance.view',
                'excel.export',
            ],
            'engineer' => [
                'projects.view',
                'reports.create',
                'reports.view_own',
            ],
            'client' => [
                'projects.view',
                'client.progress.view',
            ],
            default => ['projects.view'],
        };
    }
}
