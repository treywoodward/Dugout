'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { getTeams, getTeamGames } from '@/lib/db-utils'
import { ArrowRight, Plus, Calendar, Users } from 'lucide-react'

export default function DashboardPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [recentGames, setRecentGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const teamsData = await getTeams(user.id)
        setTeams(teamsData)

        // Get recent games from all teams
        if (teamsData.length > 0) {
          const allGames: any[] = []
          for (const team of teamsData) {
            const games = await getTeamGames(team.id)
            allGames.push(...games)
          }
          setRecentGames(allGames.sort((a, b) => 
            new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
          ).slice(0, 5))
        }
      }
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teams.length}</div>
              <p className="text-sm text-gray-600 mt-2">Active teams</p>
              <Link href="/teams">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Manage Teams
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Games Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recentGames.length}</div>
              <p className="text-sm text-gray-600 mt-2">Recent games</p>
              <Link href="/games">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View Games
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Ready</div>
              <p className="text-sm text-gray-600 mt-2">View insights & stats</p>
              <Link href="/analytics">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Games</h2>
            <Link href="/games">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </Link>
          </div>

          {recentGames.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No games tracked yet. Start by creating a team and scheduling a game.</p>
                <Link href="/teams">
                  <Button className="mt-4">Create Team</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentGames.map((game) => (
                <Card key={game.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">vs {game.opponent_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(game.game_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {game.final_score_us} - {game.final_score_them}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{game.status}</p>
                      </div>
                      <Link href={`/games/${game.id}`}>
                        <Button variant="outline" size="sm">
                          View
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
