import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname === '/admin/login'
  const isAdminRoute = url.pathname.startsWith('/admin')

  // 1. If trying to access /admin routes WITHOUT being logged in -> Redirect to login WITH redirect param
  if (isAdminRoute && !isLoginPage && !user) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('redirect', url.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. If already logged in and on login page -> redirect to applicants (remove this redirect loop)
  // REMOVED: This was causing the infinite loop
  
  // 3. If accessing /admin root and logged in -> Send to applicants
  if (url.pathname === '/admin' && user) {
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}