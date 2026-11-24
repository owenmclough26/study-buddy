/**
 * Public half of the Web Push key pair. Safe to ship in the app: browsers use it to check
 * that notifications really come from our server. The private half lives only in the
 * Supabase function secrets (VAPID_PRIVATE_KEY). Regenerate both together.
 */
export const VAPID_PUBLIC_KEY = 'BL9CuIZIYfIkD74yuJQQvigeP9yt4VCjrrKXHrVw78bntRi8GNEoy3ree_nd9mwCjHQ_8ZcC9KGwvMecV00fYTE'
