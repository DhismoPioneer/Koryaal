<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppReportParser;
use Illuminate\Http\Request;

class ReportParserController extends Controller
{
    public function parse(Request $request, WhatsAppReportParser $parser)
    {
        $validated = $request->validate([
            'raw_message' => ['required','string'],
            'payment_method' => ['nullable','string'],
        ]);

        return response()->json($parser->parse(
            $validated['raw_message'],
            $validated['payment_method'] ?? null
        ));
    }
}
