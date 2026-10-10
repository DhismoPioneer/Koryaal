<?php

namespace Tests\Feature;

use App\Models\Attachment;
use App\Models\Company;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RestoredFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_finance_user_can_save_a_manual_report_with_an_invoice(): void
    {
        Storage::fake('public');
        $company = Company::create(['name' => 'Test company']);
        $user = User::factory()->create([
            'company_id' => $company->id,
            'role' => 'finance',
            'status' => 'active',
            'permissions' => ['finance.view'],
        ]);
        $project = Project::create([
            'company_id' => $company->id,
            'project_name' => 'Test site',
            'status' => 'in_progress',
            'budget' => 1000,
        ]);
        $project->users()->attach($user);
        Sanctum::actingAs($user);

        $this->postJson('/api/daily-reports', [
            'project_id' => $project->id,
            'report_date' => '2026-10-10',
            'raw_message' => 'Manual expense: cement',
            'calculated_total' => 100,
            'transactions' => [[
                'description' => 'Cement',
                'amount' => 100,
                'type' => 'expense',
            ]],
            'attachments' => [UploadedFile::fake()->createWithContent('invoice.pdf', "%PDF-1.4\nTest invoice\n%%EOF")],
        ])->assertSuccessful()->assertJsonCount(1, 'attachments');

        $attachment = Attachment::firstOrFail();
        $this->assertNotEmpty($attachment->file_data);
        $this->assertSame('application/pdf', $attachment->mime_type);
        Storage::disk('public')->assertExists($attachment->file_path);
        $this->getJson('/api/daily-reports')->assertOk()->assertJsonCount(1, '0.attachments');
        $this->getJson('/api/projects')->assertOk()->assertJsonPath('0.spent_amount', 100);
    }

    public function test_client_cannot_save_financial_reports(): void
    {
        $company = Company::create(['name' => 'Test company']);
        $user = User::factory()->create(['company_id' => $company->id, 'role' => 'client', 'permissions' => []]);
        $project = Project::create(['company_id' => $company->id, 'project_name' => 'Test site']);
        Sanctum::actingAs($user);
        $this->postJson('/api/daily-reports', [
            'project_id' => $project->id,
            'report_date' => '2026-10-10',
            'raw_message' => 'Unauthorized expense',
        ])->assertForbidden();
        $this->assertDatabaseCount('daily_reports', 0);
    }
}
