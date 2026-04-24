import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // On Vercel the internal request.url host differs from the public host
      const forwardedHost = request.headers.get('x-forwarded-host')
      const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          return NextResponse.redirect(`${redirectBase}/setup`)
        }
      }

      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin
  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`)
}
