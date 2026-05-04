'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGameStats } from '@/lib/db-utils'

export default function GameStatsPage() {
  const params = useParams()
  const gameId = params.id as string
  const [game, setGame] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: gameData } = await supabase.from('games').select('*').eq('id', gameId).single()
      setGame(gameData)

      const statsData = await getGameStats(gameId)
      setStats(statsData)

      setLoading(false)
    }
    fetchData()
  }, [gameId])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!game) {
    return (
      <div className="p-8 text-center">
        <p>Game not found</p>
        <Link href="/games">
          <Button className="mt-4">Back to Games</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Game Stats</h1>
              <p className="text-gray-600">vs {game.opponent_name}</p>
            </div>
            <Link href="/games">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            {new Date(game.game_date).toLocaleDateString()} • {game.home_away === 'home' ? 'Home' : 'Away'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Score Box */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Team</p>
                <p className="text-5xl font-bold text-blue-600">
                  {game.final_score_us ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <p className="text-lg font-semibold capitalize">{game.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Opponent</p>
                <p className="text-5xl font-bold text-red-600">
                  {game.final_score_them ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="batting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batting">Batting</TabsTrigger>
            <TabsTrigger value="pitching">Pitching</TabsTrigger>
            <TabsTrigger value="defense">Defense</TabsTrigger>
          </TabsList>

          <TabsContent value="batting">
            <Card>
              <CardHeader>
                <CardTitle>Batting Statistics</CardTitle>
                <CardDescription>
                  {stats?.playerStats.length || 0} players with at-bats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.playerStats || stats.playerStats.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    <p>No batting statistics yet. Track at-bats during the game.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Player</th>
                          <th className="text-center py-2 px-2">AB</th>
                          <th className="text-center py-2 px-2">H</th>
                          <th className="text-center py-2 px-2">R</th>
                          <th className="text-center py-2 px-2">RBI</th>
                          <th className="text-center py-2 px-2">BB</th>
                          <th className="text-center py-2 px-2">K</th>
                          <th className="text-center py-2 px-2">HR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.playerStats.map((stat: any) => (
                          <tr key={stat.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2">{stat.player_id}</td>
                            <td className="text-center py-2 px-2">{stat.at_bats}</td>
                            <td className="text-center py-2 px-2">{stat.hits}</td>
                            <td className="text-center py-2 px-2">{stat.runs}</td>
                            <td className="text-center py-2 px-2">{stat.rbis}</td>
                            <td className="text-center py-2 px-2">{stat.walks}</td>
                            <td className="text-center py-2 px-2">{stat.strikeouts}</td>
                            <td className="text-center py-2 px-2">{stat.home_runs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pitching">
            <Card>
              <CardHeader>
                <CardTitle>Pitching Statistics</CardTitle>
                <CardDescription>
                  {stats?.pitcherStats.length || 0} pitchers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.pitcherStats || stats.pitcherStats.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    <p>No pitching statistics yet. Track pitchers during the game.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Pitcher</th>
                          <th className="text-center py-2 px-2">IP</th>
                          <th className="text-center py-2 px-2">P</th>
                          <th className="text-center py-2 px-2">S</th>
                          <th className="text-center py-2 px-2">B</th>
                          <th className="text-center py-2 px-2">H</th>
                          <th className="text-center py-2 px-2">K</th>
                          <th className="text-center py-2 px-2">BB</th>
                          <th className="text-center py-2 px-2">ER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.pitcherStats.map((stat: any) => (
                          <tr key={stat.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2">{stat.pitcher_id}</td>
                            <td className="text-center py-2 px-2">{stat.innings_pitched}</td>
                            <td className="text-center py-2 px-2">{stat.pitches_thrown}</td>
                            <td className="text-center py-2 px-2">{stat.strikes}</td>
                            <td className="text-center py-2 px-2">{stat.balls}</td>
                            <td className="text-center py-2 px-2">{stat.hits_allowed}</td>
                            <td className="text-center py-2 px-2">{stat.strikeouts}</td>
                            <td className="text-center py-2 px-2">{stat.walks}</td>
                            <td className="text-center py-2 px-2">{stat.earned_runs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defense">
            <Card>
              <CardHeader>
                <CardTitle>Defensive Plays</CardTitle>
                <CardDescription>
                  {stats?.defensivePlays.length || 0} plays recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.defensivePlays || stats.defensivePlays.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    <p>No defensive plays recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.defensivePlays.map((play: any) => (
                      <div key={play.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold capitalize">{play.play_type}</p>
                            <p className="text-sm text-gray-600">Inning {play.inning}</p>
                          </div>
                          {play.description && (
                            <p className="text-sm text-gray-600">{play.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex gap-4">
          <Link href="/games" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Games
            </Button>
          </Link>
          {game.status !== 'completed' && (
            <Link href={`/games/${gameId}/track`} className="flex-1">
              <Button className="w-full">
                Continue Tracking
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
