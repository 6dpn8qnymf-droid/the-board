import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin = new URL(request.url).origin
  const base = forwardedHost ? `https://${forwardedHost}` : origin

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=no_code`)
  }

  // Build the redirect response first so we can attach cookies to it
  const redirectResponse = NextResponse.redirect(`${base}/setup`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          // Write cookies onto the redirect response so they survive the redirect
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${base}/login?error=auth_failed`)
  }

  // Check if this user has claimed an identity yet
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      // Already set up — go straight to the leaderboard
      redirectResponse.headers.set('location', `${base}/leaderboard`)
    }
    // else: no profile → stays on /setup redirect set above
  }

  return redirectResponse
}
