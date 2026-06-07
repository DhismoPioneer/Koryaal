<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function file(Attachment $attachment): StreamedResponse|Response
    {
        $fileName = $attachment->original_name ?: basename((string) $attachment->file_path);
        $mimeType = $attachment->mime_type ?: 'application/octet-stream';

        if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
            return Storage::disk('public')->response($attachment->file_path, $fileName);
        }

        abort_unless($attachment->file_data, 404, 'Attachment file not found.');

        return response($attachment->file_data, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.str_replace('"', '', $fileName).'"',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}

