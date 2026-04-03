/**
 * Routes that must never be used as slugs.
 * These are reserved by the app router and system paths.
 */
export const RESERVED_ROUTES = new Set([
  // App routes
  'dashboard', 'login', 'signup', 'pricing', 'api', 'auth',
  'settings', 'account', 'profile', 'billing', 'upgrade',
  'admin', 'manage', 'panel', 'console', 'system',
  // Next.js internals
  '_next', '_vercel', '__nextjs', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'manifest.json',
  // Common web paths
  'index', 'home', 'about', 'contact', 'help', 'support',
  'terms', 'privacy', 'legal', 'blog', 'news', 'press',
  'static', 'public', 'assets', 'images', 'fonts', 'css', 'js',
  // Auth callbacks
  'callback', 'confirm', 'reset', 'verify', 'oauth',
  // Not-found and error
  '404', '500', 'error', 'not-found',
])

/**
 * Profanity / impersonation blocklist (minimal, extend as needed).
 */
export const BANNED_SLUGS = new Set([
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt',
  'nigger', 'faggot', 'whore', 'slut',
  // Impersonation-sensitive
  'linnnkr', 'linker', 'linkr',
  'google', 'naver', 'kakao', 'apple', 'facebook', 'instagram',
  'twitter', 'youtube', 'tiktok', 'netflix', 'amazon',
])

export function isReservedSlug(slug: string): boolean {
  const lower = slug.toLowerCase()
  return RESERVED_ROUTES.has(lower) || BANNED_SLUGS.has(lower)
}
