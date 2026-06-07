<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function registerCompany(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_email' => 'nullable|email|max:255',
            'company_phone' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:8',
        ]);

        return DB::transaction(function () use ($validated) {
            $company = Company::create([
                'name' => $validated['company_name'],
                'email' => $validated['company_email'] ?? null,
                'phone' => $validated['company_phone'] ?? null,
                'status' => 'active',
            ]);

            $user = User::create([
                'company_id' => $company->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'admin',
                'status' => 'active',
            ]);

            $token = $user->createToken('buildtrack-web')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user->load(['company', 'projects']),
            ], 201);
        });
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'This account is inactive. Please contact an administrator.',
            ], 403);
        }

        $token = $user->createToken('buildtrack-web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->load(['company', 'projects']),
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load(['company', 'projects']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:50',
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['password'])) {
            if (
                empty($validated['current_password'])
                || !Hash::check($validated['current_password'], $user->password)
            ) {
                return response()->json([
                    'message' => 'Current password is required to change your password.',
                ], 422);
            }

            $user->password = Hash::make($validated['password']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->save();

        return $user->load(['company', 'projects']);
    }

    public function requestPasswordReset(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'If this email exists in Koryaal, a reset code has been sent.',
            ]);
        }

        if (
            config('mail.default') === 'smtp'
            && (
                config('mail.mailers.smtp.username') === 'your-email@gmail.com'
                || config('mail.from.address') === 'your-email@gmail.com'
                || config('mail.mailers.smtp.password') === 'your-gmail-app-password'
            )
        ) {
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
            'expires_at' => now()->addMinutes(15),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::raw(
            "Your password reset code is {$code}. This code expires in 15 minutes. If you did not request this, you can ignore this email.",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Koryaal password reset code');
            }
        );

        $response = [
            'message' => 'If this email exists in Koryaal, a reset code has been sent.',
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

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 422);
        }

        $reset = DB::table('password_reset_codes')
            ->where('email', $user->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$reset || !Hash::check($validated['code'], $reset->code_hash)) {
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

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 422);
        }

        $reset = DB::table('password_reset_codes')
            ->where('email', $user->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$reset || !Hash::check($validated['code'], $reset->code_hash)) {
            return response()->json([
                'message' => 'Invalid or expired reset code.',
            ], 422);
        }

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

        return response()->json([
            'message' => 'Password updated successfully. You can now log in with your new password.',
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}





