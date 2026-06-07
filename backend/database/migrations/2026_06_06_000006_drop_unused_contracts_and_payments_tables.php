<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('contracts');
    }

    public function down(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contract_title');
            $table->decimal('contract_amount', 15, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('file_path')->nullable();
            $table->enum('status', ['draft', 'signed', 'active', 'completed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('USD');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->date('payment_date');
            $table->enum('type', ['received', 'paid'])->default('received');
            $table->text('notes')->nullable();
            $table->foreignId('attachment_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }
};
