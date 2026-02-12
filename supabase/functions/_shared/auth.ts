/**
 * Shared JWT authentication helper for Supabase Edge Functions.
 *
 * Extracts and verifies the Bearer token from the Authorization header,
 * returning the authenticated Supabase User. All user-scoped edge
 * functions MUST call requireUser() before accessing any user data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthResult {
  user: { id: string; email?: string };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Extract and verify the JWT from the request Authorization header.
 *
 * @returns The authenticated user object.
 * @throws {AuthError} with `status` property (401 or 403) on failure.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  // Use the anon key client to verify the token — this validates the JWT
  // signature against the project's JWT secret without granting service-role
  // privileges.
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await authClient.auth.getUser()

  if (error || !user) {
    throw new AuthError(error?.message ?? 'Invalid or expired token', 401)
  }

  return { user: { id: user.id, email: user.email } }
}

/**
 * Convenience: if the request body contains a userId field, verify it
 * matches the JWT-authenticated user. Prevents the client from
 * requesting data for a different user.
 */
export function enforceUserIdMatch(jwtUserId: string, bodyUserId: unknown): void {
  if (bodyUserId !== undefined && bodyUserId !== null && bodyUserId !== jwtUserId) {
    throw new AuthError('userId in request body does not match authenticated user', 403)
  }
}

/**
 * Build a 401/403 JSON error response with CORS headers.
 */
export function authErrorResponse(err: AuthError): Response {
  return new Response(
    JSON.stringify({ error: err.message }),
    {
      status: err.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

/** Typed error with HTTP status code. */
export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
