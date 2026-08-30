import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the routes that require authentication
const protectedRoutes = ['/dashboard', '/classroom', '/attendance', '/generator'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check if it's a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtected) {
    const token = req.cookies.get('session_token')?.value;
    
    if (!token) {
      // Not logged in -> redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    try {
      // Edge-compatible JWT verification
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback-secret'
      );
      
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Strict Consent Firewall
      if (!payload.hasConsent) {
        // Logged in but hasn't consented -> trap them in consent page
        return NextResponse.redirect(new URL('/consent', req.url));
      }
      
      // If we got here, they are authenticated and have consented. Let them proceed.
      return NextResponse.next();
      
    } catch (error) {
      // Invalid token -> redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/classroom/:path*', '/attendance/:path*', '/generator/:path*'],
};
