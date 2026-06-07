<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class ForgotPasswordController extends Controller
{
    private const SAFE_MESSAGE = 'If this email exists, a reset code has been sent.';

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower($validated['email']);
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => self::SAFE_MESSAGE,
            ]);
        }

        if ($this->smtpPlaceholdersAreConfigured()) {
            return response()->json([
                'message' => 'Email sending is not configured yet. Add one system sender email in backend/.env using MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM_ADDRESS. The reset code will be sent automatically to the user email entered on the forgot-password form.',
            ], 422);
        }

        $code = (string) random_int(100000, 999999);

        DB::table('password_reset_codes')
            ->where('email', $user->email)
            ->whereNull('used_at')
            ->delete();

        DB::table('password_reset_codes')->insert([
            'email' => $user->email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::to($user->email)->send(new PasswordResetCodeMail($code, $user->email));

        $response = [
            'message' => self::SAFE_MESSAGE,
        ];

        if (app()->environment('local') && config('mail.default') === 'log') {
            $response['local_reset_code'] = $code;
            $response['message'] = 'Local mail is using the log driver. Use the code shown below or check backend/storage/logs/laravel.log.';
        }

        return response()->json($response);
    }

    public function verifyResetCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $reset = $this->validResetCode($validated['email'], $validated['code']);

        if (!$reset) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 422);
        }

        return response()->json([
            'message' => 'Code verified. You can now create a new password.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();
        $reset = $this->validResetCode($validated['email'], $validated['code']);

        if (!$user || !$reset) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 422);
        }

        DB::transaction(function () use ($user, $reset, $validated) {
            $user->forceFill([
                'password' => Hash::make($validated['password']),
            ])->save();

            DB::table('password_reset_codes')
                ->where('id', $reset->id)
                ->update([
                    'used_at' => now(),
                    'updated_at' => now(),
                ]);

            $user->tokens()->delete();
        });

        return response()->json([
            'message' => 'Password updated successfully. You can now log in with your new password.',
        ]);
    }

    private function validResetCode(string $email, string $code): ?object
    {
        $user = User::where('email', strtolower($email))->first();

        if (!$user) {
            return null;
        }

        $reset = DB::table('password_reset_codes')
            ->where('email', $user->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$reset || !Hash::check($code, $reset->code_hash)) {
            return null;
        }

        return $reset;
    }

    private function smtpPlaceholdersAreConfigured(): bool
    {
        return config('mail.default') === 'smtp'
            && (
                config('mail.mailers.smtp.username') === 'your-email@gmail.com'
                || config('mail.from.address') === 'your-email@gmail.com'
                || config('mail.mailers.smtp.password') === 'your-gmail-app-password'
            );
    }
}
