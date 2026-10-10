<?php
namespace Database\Seeders;
use App\Models\{Attachment,Client,Company,DailyReport,Project,Transaction,User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB,Hash,Storage};

class BuildTrackDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $company = Company::firstOrCreate(['email'=>'workspace@demo.koryaal.test'], ['name'=>'Koryaal Demo Construction','status'=>'active']);
            $users = [];
            foreach (['admin'=>'Amina Hassan','finance'=>'Omar Ali','engineer'=>'Abdi Mohamed','client'=>'Sahra Ahmed'] as $role=>$name) {
                $users[$role] = User::firstOrCreate(['email'=>"$role@demo.koryaal.test"], [
                    'company_id'=>$company->id,'name'=>$name,'role'=>$role,'status'=>'active','password'=>Hash::make('KoryaalDemo123!'),
                ]);
            }
            $today = now('Africa/Nairobi')->startOfDay();
            $month = $today->copy()->startOfMonth();
            $specs = [
                ['Taleh Family Villa','Taleh, Mogadishu',25000,'in_progress'],
                ['Hodan Office Building','Hodan, Mogadishu',60000,'in_progress'],
                ['Wadajir School Renovation','Wadajir, Mogadishu',15000,'delayed'],
                ['Hamar Weyne Shop Fitout','Hamar Weyne, Mogadishu',10000,'completed'],
            ];
            foreach ($specs as $index=>[$name,$location,$budget,$status]) {
                $client = Client::firstOrCreate(['company_id'=>$company->id,'email'=>"client$index@demo.koryaal.test"], [
                    'name'=>['Sahra Ahmed','Hodan Business Group','Wadajir School Committee','Hamar Retail'][$index], 'phone'=>'+252 61 000 000'.$index,
                ]);
                $project = Project::firstOrCreate(['company_id'=>$company->id,'project_name'=>$name], [
                    'client_id'=>$client->id,'location'=>$location,'budget'=>$budget,'status'=>$status,
                    'start_date'=>$month->copy()->subMonths(2),'end_date'=>$status==='completed' ? $today : $today->copy()->addMonths(3),
                    'description'=>'Sample project for exploring Koryaal. All records in this workspace are demonstration data.',
                ]);
                foreach (['finance','engineer','client'] as $role) $project->users()->syncWithoutDetaching([$users[$role]->id=>['role_on_project'=>$role]]);
                for ($day=0; $day<5; $day++) {
                    $date = $month->copy()->addDays(min($day*2,$today->day-1));
                    $pending = $day===3 && $status!=='completed';
                    $amount = [10000+$index*2000,450+$index*100,1200+$index*200,350,500][$day];
                    $category = ['deposit','labor','materials','equipment','withdrawal'][$day];
                    $description = ['Client advance payment','Site team wages','Cement and reinforcement delivery','Concrete mixer hire','Petty cash withdrawal'][$day];
                    $report = DailyReport::firstOrCreate(['project_id'=>$project->id,'notes'=>"koryaal-demo-$index-$day"], [
                        'submitted_by'=>$users[$day===1 || $day===3 ? 'engineer' : 'finance']->id,
                        'report_date'=>$date,'raw_message'=>"$description = $amount\nTotal = $amount",
                        'provided_total'=>$amount,'calculated_total'=>$amount,'difference'=>0,'payment_method'=>$day===0 ? 'Bank' : 'EVC Plus',
                        'status'=>$pending ? 'pending' : 'approved','ai_summary'=>$description,'created_at'=>$date->copy()->setHour(10),
                    ]);
                    Transaction::firstOrCreate(['daily_report_id'=>$report->id,'description'=>$description], [
                        'project_id'=>$project->id,'type'=>$day===0 ? 'income' : 'expense','category'=>$category,
                        'quantity'=>1,'unit_price'=>$amount,'amount'=>$amount,'currency'=>'USD','payment_method'=>$report->payment_method,
                        'payment_reference'=>"DEMO-$index-$day",'paid_to'=>$day===0 ? null : 'Sample supplier',
                        'paid_by'=>$day===0 ? $client->name : $users['finance']->name,'status'=>$pending ? 'pending' : 'approved',
                        'needs_review'=>$pending,'review_reason'=>$pending ? 'Confirm equipment hire receipt before approval.' : null,'created_at'=>$date->copy()->setHour(10),
                    ]);
                    if ($day===2) {
                        $filePath = "attachments/demo/invoice-$index.pdf";
                        $pdf = $this->invoicePdf($name,$amount);
                        Storage::disk('public')->put($filePath,$pdf);
                        Attachment::firstOrCreate(['daily_report_id'=>$report->id,'file_path'=>$filePath], [
                            'project_id'=>$project->id,'file_data'=>$pdf,'file_type'=>'invoice','mime_type'=>'application/pdf',
                            'file_size'=>strlen($pdf),'extracted_text'=>"Sample invoice - $name.pdf",'status'=>'verified',
                        ]);
                    }
                }
            }
        });
        $this->command?->info('Demo workspace ready: admin@demo.koryaal.test / KoryaalDemo123!');
    }

    private function invoicePdf(string $project,int $amount): string
    {
        $stream = "BT /F1 18 Tf 50 760 Td (Koryaal - Sample Invoice) Tj 0 -40 Td /F1 12 Tf ($project) Tj 0 -30 Td (Cement and reinforcement: USD $amount) Tj 0 -30 Td (DEMONSTRATION DATA) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length '.strlen($stream)." >>\nstream\n$stream\nendstream",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $index=>$object) { $offsets[]=strlen($pdf); $pdf.=($index+1)." 0 obj\n$object\nendobj\n"; }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";
        foreach ($offsets as $offset) $pdf .= sprintf("%010d 00000 n \n",$offset);
        return $pdf."trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n";
    }
}
