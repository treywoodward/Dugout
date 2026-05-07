'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamStatsCard } from '@/components/team-stats-card'
import { PlayerStatsCard } from '@/components/player-stats-card'
import { AiInsights } from '@/components/ai-insights'
import { getTeams, getTeamGames, getTeamPlayers, getPlayerGameStats } from '@/lib/db-utils'
import { calculateTeamStats } from '@/lib/stats-calculator'
import { AlertCircle, TrendingUp, ChevronDown } from 'lucide-react'
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
        if (teamsData.length > 0) setSelectedTeamId(teamsData[0].id)
      }
      setLoading(false)
    }
    fetchAnalytics()
  }, [])

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedTeamId) return
      const [gamesData, playersData] = await Promise.all([
        getTeamGames(selectedTeamId),
        getTeamPlayers(selectedTeamId),
      ])
      setGames(gamesData)
      setPlayers(playersData)

      const statsMap: Record<string, any> = {}
      await Promise.all(
        playersData.map(async (player: any) => {
          statsMap[player.id] = await getPlayerGameStats(player.id, selectedTeamId)
        })
      )
      setPlayerStats(statsMap)
    }
    fetchTeamData()
  }, [selectedTeamId])

  const selectedTeam = teams.find(t => t.id === selectedTeamId)
  const completedGames = games.filter(g => g.status === 'completed')
  const teamStats = selectedTeam ? calculateTeamStats(games, players) : null

  const playerStatsArray = players.map(p => ({
    ...p,
    ...(playerStats[p.id] || {}),
  }))

  // Group games by opponent for matchup history
  const opponentMap: Record<string, any[]> = {}
  completedGames.forEach(g => {
    if (!opponentMap[g.opponent_name]) opponentMap[g.opponent_name] = []
    opponentMap[g.opponent_name].push(g)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-primary rounded-full" />
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-1">Analytics & Insights</h2>
          <p className="text-muted-foreground">Stats, trends, and AI coaching recommendations</p>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Create a team to start seeing analytics</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-8">
              {/* AI Insights */}
              <AiInsights
                teamName={selectedTeam?.name || ''}
                teamStats={teamStats}
                playerStats={playerStatsArray}
                opponentHistory={completedGames}
              />

              {/* Team Overview */}
              {selectedTeam && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Team Overview</h3>
                  <TeamStatsCard teamName={selectedTeam.name} games={games} level={selectedTeam.level} />
                </div>
              )}

              {/* Opponent History */}
              {Object.keys(opponentMap).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Matchup History</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(opponentMap).map(([opponent, matchups]) => {
                      const wins = matchups.filter(g => g.final_score_us > g.final_score_them).length
                      const losses = matchups.length - wins
                      const avgRuns = (matchups.reduce((s, g) => s + (g.final_score_us || 0), 0) / matchups.length).toFixed(1)
                      const avgAllowed = (matchups.reduce((s, g) => s + (g.final_score_them || 0), 0) / matchups.length).toFixed(1)
                      return (
                        <Card key={opponent} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold">{opponent}</CardTitle>
                              <Badge variant={wins >= losses ? 'default' : 'destructive'} className="text-xs">
                                {wins}-{losses}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium text-foreground">{avgRuns}</span> avg runs
                              </div>
                              <div>
                                <span className="font-medium text-foreground">{avgAllowed}</span> avg allowed
                              </div>
                            </div>
                            <div className="mt-2 space-y-1">
                              {matchups.slice(0, 3).map(g => (
                                <div key={g.id} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{new Date(g.game_date).toLocaleDateString()}</span>
                                  <span className={g.final_score_us > g.final_score_them ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {g.final_score_us}-{g.final_score_them} {g.final_score_us > g.final_score_them ? 'W' : 'L'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Player Stats */}
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
            </div>
          </>
        )}
      </main>
    </div>
  )
}
