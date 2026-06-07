<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function file(Attachment $attachment): StreamedResponse
    {
        abort_unless(
            $attachment->file_path && Storage::disk('public')->exists($attachment->file_path),
            404,
            'Attachment file not found.'
        );

        return Storage::disk('public')->response(
            $attachment->file_path,
            $attachment->original_name ?: basename($attachment->file_path)
        );
    }
}
