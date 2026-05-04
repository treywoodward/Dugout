'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamStatsCard } from '@/components/team-stats-card'
import { PlayerStatsCard } from '@/components/player-stats-card'
import { GameBoxScore } from '@/components/game-box-score'
import { getTeams, getTeamGames, getTeamPlayers, getPlayerGameStats } from '@/lib/db-utils'
import { BarChart3, TrendingUp, Users, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AnalyticsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [games, setGames] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const teamsData = await getTeams(user.id)
        setTeams(teamsData)

        if (teamsData.length > 0) {
          setSelectedTeamId(teamsData[0].id)
        }
      }
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  // Fetch data for selected team
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedTeamId) return

      const gamesData = await getTeamGames(selectedTeamId)
      setGames(gamesData)

      const playersData = await getTeamPlayers(selectedTeamId)
      setPlayers(playersData)

      // Get player stats
      const statsMap: Record<string, any> = {}
      for (const player of playersData) {
        const stats = await getPlayerGameStats(player.id, selectedTeamId)
        statsMap[player.id] = stats
      }
      setPlayerStats(statsMap)
    }

    fetchTeamData()
  }, [selectedTeamId])

  const selectedTeam = teams.find(t => t.id === selectedTeamId)
  const completedGames = games.filter(g => g.status === 'completed')

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-primary rounded-full"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Analytics & Insights</h2>
          <p className="text-muted-foreground">
            View detailed statistics, trends, and coaching insights from your games
          </p>
        </div>

        {/* Team Selector */}
        {teams.length > 0 && (
          <div className="mb-8">
            <label className="text-sm font-medium mb-2 block">Select Team</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {teams.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a team to start tracking games and viewing analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Team Overview */}
            {selectedTeam && (
              <div>
                <h3 className="text-lg font-bold mb-4">Team Overview</h3>
                <TeamStatsCard
                  teamName={selectedTeam.name}
                  games={games}
                  level={selectedTeam.level}
                />
              </div>
            )}

            {/* Games Summary */}
            <div>
              <h3 className="text-lg font-bold mb-4">Games ({completedGames.length} Completed)</h3>
              {completedGames.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-8">
                    <p className="text-muted-foreground">No completed games yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {completedGames.map(game => (
                    <GameBoxScore
                      key={game.id}
                      game={game}
                      team={selectedTeam}
                      opponent={game.opponent_name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Player Statistics */}
            {players.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Player Statistics</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.map(player => (
                    <PlayerStatsCard
                      key={player.id}
                      playerName={player.name}
                      jerseyNumber={player.jersey_number}
                      stats={playerStats[player.id] || {}}
                      statType={player.position?.toLowerCase().includes('pitch') ? 'pitching' : 'batting'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Insights */}
            <div>
              <h3 className="text-lg font-bold mb-4">Coaching Insights</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                    <CardTitle className="text-base">Matchup History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track historical performance against different opponents to inform lineup decisions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
                    <CardTitle className="text-base">Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Analyze player and team performance trends over the season
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Users className="w-6 h-6 text-purple-600 mb-2" />
                    <CardTitle className="text-base">Roster Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Build optimal lineups based on statistical matchups and player performance
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
