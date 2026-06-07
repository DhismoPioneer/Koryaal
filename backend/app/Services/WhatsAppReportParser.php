<?php

namespace App\Services;

class WhatsAppReportParser
{
    public function parse(string $message, ?string $paymentMethod = null): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($message));
        $records = [];
        $providedTotal = null;

        foreach ($lines as $line) {
            $original = trim($line);
            if ($original === '') continue;

            $normalized = strtolower(str_replace(['🟰', '＝'], '=', $original));
            $normalized = preg_replace('/\s+/', ' ', $normalized);

            if (preg_match('/total\s*=\s*([0-9]+(?:\.[0-9]+)?)/i', $normalized, $m)) {
                $providedTotal = (float) $m[1];
                continue;
            }

            $record = null;

            // Pattern: 5 fuundi x15.5 = 77.5
            if (preg_match('/^(\d+(?:\.\d+)?)\s+(.+?)\s*x\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i', $normalized, $m)) {
                $qty = (float) $m[1];
                $desc = trim($m[2]);
                $rate = (float) $m[3];
                $amount = (float) $m[4];
                $record = $this->quantityRateRecord($desc, $qty, $rate, $amount, $paymentMethod);
            }
            // Pattern: fuundi 5 x 10 = 50
            elseif (preg_match('/^(.+?)\s+(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i', $normalized, $m)) {
                $desc = trim($m[1]);
                $qty = (float) $m[2];
                $rate = (float) $m[3];
                $amount = (float) $m[4];
                $record = $this->quantityRateRecord($desc, $qty, $rate, $amount, $paymentMethod);
            }
            // Pattern: matoor = 35
            elseif (preg_match('/^(.+?)\s*=\s*(\d+(?:\.\d+)?)/i', $normalized, $m)) {
                $desc = trim($m[1]);
                $amount = (float) $m[2];
                $record = $this->record($desc, null, null, $amount, $paymentMethod, false, null);
            }
            // Pattern: Matoor 8
            elseif (preg_match('/^([a-zA-Z\p{L} ]+)\s+(\d+(?:\.\d+)?)$/u', $normalized, $m)) {
                $desc = trim($m[1]);
                $amount = (float) $m[2];
                $record = $this->record($desc, null, null, $amount, $paymentMethod, true, "Line has amount without '=' or quantity/rate format.");
            }
            // Pattern: 15 farsamo yaqaan pom
            elseif (preg_match('/^(\d+(?:\.\d+)?)\s+(.+)$/u', $normalized, $m)) {
                $amount = (float) $m[1];
                $desc = trim($m[2]);
                $record = $this->record($desc, null, null, $amount, $paymentMethod, true, 'Amount appears before description. Confirm before approval.');
            }
            else {
                $record = $this->record($original, null, null, 0, $paymentMethod, true, 'Could not parse this line.');
            }

            $record['original_line'] = $original;
            $records[] = $record;
        }

        $calculated = array_reduce($records, fn($sum, $r) => $sum + (float)$r['amount'], 0.0);
        $difference = $providedTotal !== null ? round($providedTotal - $calculated, 2) : null;

        return [
            'provided_total' => $providedTotal,
            'calculated_total' => round($calculated, 2),
            'difference' => $difference,
            'total_status' => $providedTotal === null ? 'not_provided' : (abs($difference) < 0.01 ? 'matched' : 'mismatch'),
            'records' => $records,
        ];
    }

    private function quantityRateRecord($description, float $quantity, float $unitPrice, float $amount, ?string $paymentMethod): array
    {
        $expectedAmount = round($quantity * $unitPrice, 2);
        $actualAmount = round($amount, 2);
        $hasMathError = abs($expectedAmount - $actualAmount) > 0.01;

        return $this->record(
            $description,
            $quantity,
            $unitPrice,
            $amount,
            $paymentMethod,
            $hasMathError,
            $hasMathError
                ? "Wrong calculation: {$quantity} x {$unitPrice} should be {$expectedAmount}, not {$amount}."
                : null,
            $expectedAmount,
            $hasMathError
        );
    }
    private function record($description, $quantity, $unitPrice, $amount, $paymentMethod, bool $needsReview, ?string $reason, $expectedAmount = null, bool $calculationError = false): array
    {
        return [
            'type' => 'expense',
            'category' => $this->category($description),
            'description' => trim($description),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'amount' => $amount,
            'expected_amount' => $expectedAmount,
            'calculation_error' => $calculationError,
            'currency' => 'USD',
            'payment_method' => $paymentMethod ?: 'Not Provided',
            'payment_reference' => null,
            'paid_to' => null,
            'paid_by' => null,
            'status' => 'pending',
            'needs_review' => $needsReview,
            'review_reason' => $reason,
        ];
    }

    private function category(string $description): string
    {
        $d = strtolower($description);
        if (str_contains($d, 'fuundi') || str_contains($d, 'shaqaale')) return 'labor';
        if (str_contains($d, 'farsamo')) return 'technical_labor';
        if (str_contains($d, 'matoor') || str_contains($d, 'machine')) return 'equipment';
        if (str_contains($d, 'shidaal') || str_contains($d, 'fuel')) return 'fuel';
        if (str_contains($d, 'transport') || str_contains($d, 'gaari')) return 'transport';
        if (str_contains($d, 'cement') || str_contains($d, 'steel') || str_contains($d, 'bir')) return 'material';
        return 'other';
    }
}

