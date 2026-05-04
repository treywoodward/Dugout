'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameBoxScore } from '@/components/game-box-score'
import { PlayerStatsCard } from '@/components/player-stats-card'
import { getTeamPlayers, getPlayerGameStats } from '@/lib/db-utils'
import { ArrowLeft, Download, Share2 } from 'lucide-react'

interface GameReportPageProps {
  params: {
    id: string
  }
}

export default function GameReportPage({ params }: GameReportPageProps) {
  const [game, setGame] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchGameData = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*, teams(id, name, level)')
        .eq('id', params.id)
        .single()

      if (gameError) {
        console.error('Error fetching game:', gameError)
        setLoading(false)
        return
      }

      setGame(gameData)
      setTeam(gameData.teams)

      // Fetch players and their stats
      const playersData = await getTeamPlayers(gameData.team_id)
      setPlayers(playersData)

      const statsMap: Record<string, any> = {}
      for (const player of playersData) {
        const stats = await getPlayerGameStats(player.id, gameData.team_id)
        statsMap[player.id] = stats
      }
      setPlayerStats(statsMap)

      setLoading(false)
    }

    fetchGameData()
  }, [params.id])

  const handleExport = () => {
    const reportData = {
      game: game,
      team: team,
      players: players.map(p => ({
        ...p,
        stats: playerStats[p.id],
      })),
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `game-report-${game?.id}.json`
    link.click()
  }

  const handleShare = () => {
    const reportUrl = `${window.location.origin}/games/${params.id}/report`
    navigator.clipboard.writeText(reportUrl)
    alert('Report link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">Game not found</p>
              <Link href="/games">
                <Button variant="outline">Back to Games</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href={`/games/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h2 className="text-3xl font-bold">Game Report</h2>
          <div className="flex gap-2">
            <Button onClick={handleShare} size="sm" variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Game Summary */}
          <div>
            <h3 className="text-lg font-bold mb-4">Game Summary</h3>
            <GameBoxScore
              game={game}
              team={team}
              opponent={game.opponent_name}
              onExport={handleExport}
              onShare={handleShare}
            />
          </div>

          {/* Player Performance */}
          {players.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Player Performance</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => (
                  <PlayerStatsCard
                    key={player.id}
                    playerName={player.name}
                    jerseyNumber={player.jersey_number}
                    stats={playerStats[player.id] || {}}
                    statType="batting"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Game Details */}
          {game.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Game Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{game.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Weather and Conditions */}
          {game.weather && (
            <Card>
              <CardHeader>
                <CardTitle>Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{game.weather}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
