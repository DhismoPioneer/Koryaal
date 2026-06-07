<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('report_date');
            $table->longText('raw_message');
            $table->decimal('provided_total', 15, 2)->nullable();
            $table->decimal('calculated_total', 15, 2)->default(0);
            $table->decimal('difference', 15, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->enum('status', ['draft','pending','approved','rejected'])->default('pending');
            $table->text('ai_summary')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('daily_reports'); }
};
