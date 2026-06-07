<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['income','expense'])->default('expense');
            $table->string('category')->default('other');
            $table->string('description');
            $table->decimal('quantity', 15, 2)->nullable();
            $table->decimal('unit_price', 15, 2)->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('USD');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('paid_to')->nullable();
            $table->string('paid_by')->nullable();
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->boolean('needs_review')->default(false);
            $table->text('review_reason')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('transactions'); }
};
