<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        return Client::where('company_id', $request->user()->company_id)
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        if (!$request->user()->canManageProjects()) {
            return response()->json([
                'message' => 'Only company admins can create clients.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'phone' => ['nullable','string'],
            'email' => ['nullable','email'],
            'address' => ['nullable','string'],
            'notes' => ['nullable','string'],
        ]);

        return Client::create([
            ...$validated,
            'company_id' => $request->user()->company_id,
        ]);
    }

    public function show(Request $request, Client $client)
    {
        $this->authorizeClientAccess($request, $client);

        return $client;
    }

    public function update(Request $request, Client $client)
    {
        $this->authorizeClientAccess($request, $client);

        if (!$request->user()->canManageProjects()) {
            return response()->json([
                'message' => 'Only company admins can update clients.',
            ], 403);
        }

        $client->update($request->only(['name', 'phone', 'email', 'address', 'notes']));

        return $client;
    }

    public function destroy(Request $request, Client $client)
    {
        $this->authorizeClientAccess($request, $client);

        if (!$request->user()->canManageProjects()) {
            return response()->json([
                'message' => 'Only company admins can delete clients.',
            ], 403);
        }

        $client->delete();

        return response()->noContent();
    }

    private function authorizeClientAccess(Request $request, Client $client): void
    {
        abort_unless(
            $client->company_id === $request->user()->company_id,
            403,
            'You can only access clients from your own company.'
        );
    }
}
