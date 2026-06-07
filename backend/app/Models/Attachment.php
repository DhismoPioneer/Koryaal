<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'daily_report_id',
        'transaction_id',
        'project_id',
        'file_path',
        'file_type',
        'extracted_text',
        'status',
    ];

    protected $appends = [
        'file_url',
        'original_name',
        'is_image',
    ];

    public function getFileUrlAttribute(): string
    {
        return '/api/attachments/'.$this->id.'/file';
    }

    public function getOriginalNameAttribute(): ?string
    {
        return $this->extracted_text;
    }

    public function getIsImageAttribute(): bool
    {
        return in_array($this->file_type, ['image', 'receipt', 'photo', 'payment_proof'], true);
    }
}

