<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('attachments', 'file_data')) {
            DB::statement('ALTER TABLE attachments ADD COLUMN file_data LONGBLOB NULL AFTER file_path');
        }

        Schema::table('attachments', function (Blueprint $table) {
            if (!Schema::hasColumn('attachments', 'mime_type')) {
                $table->string('mime_type')->nullable()->after('file_type');
            }

            if (!Schema::hasColumn('attachments', 'file_size')) {
                $table->unsignedBigInteger('file_size')->nullable()->after('mime_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attachments', function (Blueprint $table) {
            if (Schema::hasColumn('attachments', 'file_data')) {
                $table->dropColumn('file_data');
            }

            if (Schema::hasColumn('attachments', 'mime_type')) {
                $table->dropColumn('mime_type');
            }

            if (Schema::hasColumn('attachments', 'file_size')) {
                $table->dropColumn('file_size');
            }
        });
    }
};

