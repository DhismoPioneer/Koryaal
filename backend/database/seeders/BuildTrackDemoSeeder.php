<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\Project;

class BuildTrackDemoSeeder extends Seeder
{
    public function run(): void
    {
        $client = Client::firstOrCreate(['name' => 'Demo Client'], [
            'phone' => '+252000000000',
            'email' => 'client@example.com',
        ]);

        Project::firstOrCreate(['project_name' => 'Taleh House Project'], [
            'client_id' => $client->id,
            'location' => 'Mogadishu',
            'budget' => 5000,
            'status' => 'in_progress',
        ]);
    }
}
