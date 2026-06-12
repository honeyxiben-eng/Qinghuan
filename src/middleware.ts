import{NextResponse}from'next/server'
import type{NextRequest}from'next/server'

export function middleware(request:NextRequest){
  const{pathname}=request.nextUrl
  // API 路由由各自的鉴权守卫处理（Bearer Token），中间件不拦截、不重定向
  if(pathname.startsWith('/api'))return NextResponse.next()
  if(pathname==='/login'||pathname.startsWith('/_next')||pathname==='/favicon.ico')return NextResponse.next()
  const role=request.cookies.get('sl_role')?.value
  if(!role)return NextResponse.redirect(new URL('/login',request.url))
  return NextResponse.next()
}
export const config={matcher:['/((?!_next/static|_next/image).*)']}
