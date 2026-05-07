'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menu } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch {
        // auth unavailable — stay unauthenticated
      }
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) {
    return null
  }

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="font-bold text-lg text-primary">
            Dugout
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/teams">
              <Button variant="ghost" size="sm">Teams</Button>
            </Link>
            <Link href="/games">
              <Button variant="ghost" size="sm">Games</Button>
            </Link>
            <Link href="/lineup">
              <Button variant="ghost" size="sm">Lineup</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="ghost" size="sm">Analytics</Button>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/teams">Teams</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/games">Games</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/lineup">Lineup Builder</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/analytics">Analytics</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {user.email?.split('@')[0]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
