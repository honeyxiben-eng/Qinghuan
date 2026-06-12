import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import TopHeader from '@/components/layout/TopHeader'
import { ToastContainer } from '@/components/ui/Toast'
import { MainContent } from '@/components/layout/MainContent'

export const metadata: Metadata = {
  title: '清欢 · 智慧盐湖数据管理平台',
  description: '资源保障部 · 采卤井全生命周期数字化管理平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased" style={{background:'var(--bg-void)'}}>
        <div className="ambient-bg" aria-hidden="true">
          <div className="ambient-blob" style={{width:600,height:600,top:'-10%',right:'-5%',background:'radial-gradient(circle,#4a9eff 0%,transparent 70%)',animationDelay:'0s'}} />
          <div className="ambient-blob" style={{width:500,height:500,bottom:'-15%',left:'-5%',background:'radial-gradient(circle,#34d399 0%,transparent 70%)',animationDelay:'-20s'}} />
          <div className="ambient-blob" style={{width:400,height:400,top:'40%',right:'20%',background:'radial-gradient(circle,#a78bfa 0%,transparent 70%)',animationDelay:'-40s'}} />
        </div>
        <TopHeader />
        <Sidebar />
        <MainContent>{children}</MainContent>
        <ToastContainer />
      </body>
    </html>
  )
}
