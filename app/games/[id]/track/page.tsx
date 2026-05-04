'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTeamPlayers, recordAtBat, recordPitch } from '@/lib/db-utils'
import { Plus, Minus } from 'lucide-react'

export default function GameTrackerPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const [game, setGame] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gameStatus, setGameStatus] = useState('in_progress')
  const [inning, setInning] = useState(1)
  const [outs, setOuts] = useState(0)
  const [balls, setBalls] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [selectedBatter, setSelectedBatter] = useState('')
  const [selectedPitcher, setSelectedPitcher] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchGameData = async () => {
      const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
      setGame(game)

      const playersData = await getTeamPlayers(game.team_id)
      setPlayers(playersData)
      
      if (playersData.length > 0) {
        setSelectedBatter(playersData[0].id)
        if (playersData.length > 1) {
          setSelectedPitcher(playersData[1].id)
        }
      }

      setLoading(false)
    }
    fetchGameData()
  }, [gameId])

  const handleBall = () => {
    setBalls(Math.min(balls + 1, 4))
  }

  const handleStrike = () => {
    setStrikes(Math.min(strikes + 1, 3))
  }

  const handleFoul = () => {
    if (strikes < 2) setStrikes(strikes + 1)
  }

  const handleOut = () => {
    setOuts(Math.min(outs + 1, 3))
    resetCount()
  }

  const handleHit = async (hitType: string) => {
    if (!selectedBatter || !selectedPitcher) return

    try {
      await recordAtBat(gameId, {
        batter_id: selectedBatter,
        pitcher_id: selectedPitcher,
        inning,
        result: 'hit',
        hit_type: hitType,
      })
      resetCount()
    } catch (error) {
      console.error('Error recording hit:', error)
    }
  }

  const handleWalk = async () => {
    if (!selectedBatter || !selectedPitcher) return

    try {
      await recordAtBat(gameId, {
        batter_id: selectedBatter,
        pitcher_id: selectedPitcher,
        inning,
        result: 'walk',
      })
      resetCount()
    } catch (error) {
      console.error('Error recording walk:', error)
    }
  }

  const resetCount = () => {
    setBalls(0)
    setStrikes(0)
  }

  const handleEndGame = async () => {
    const { error } = await supabase
      .from('games')
      .update({ status: 'completed' })
      .eq('id', gameId)

    if (!error) {
      router.push(`/games/${gameId}`)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">{game.team_id}</h1>
              <p className="text-sm text-gray-600">vs {game.opponent_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Inning {inning}</p>
              <Button variant="outline" size="sm" onClick={() => setInning(Math.max(1, inning - 1))}>
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInning(inning + 1)} className="ml-2">
                Next →
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scoreboard */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-100 rounded">
                    <p className="text-xs text-gray-600">Balls</p>
                    <p className="text-4xl font-bold text-blue-600">{balls}</p>
                  </div>
                  <div className="text-center p-4 bg-red-100 rounded">
                    <p className="text-xs text-gray-600">Strikes</p>
                    <p className="text-4xl font-bold text-red-600">{strikes}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded">
                    <p className="text-xs text-gray-600">Outs</p>
                    <p className="text-4xl font-bold text-gray-600">{outs}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={() => {
                    setBalls(0)
                    setStrikes(0)
                  }}
                >
                  Reset Count
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Pitch Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleBall} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Ball
                </Button>
                <Button onClick={handleStrike} className="w-full bg-red-600 hover:bg-red-700" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Strike
                </Button>
                <Button onClick={handleFoul} variant="outline" className="w-full" size="lg">
                  Foul
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Tracking Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Selection */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Current At-Bat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Batter</label>
                  <Select value={selectedBatter} onValueChange={setSelectedBatter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pitcher</label>
                  <Select value={selectedPitcher} onValueChange={setSelectedPitcher}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* At-Bat Results */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>At-Bat Results</CardTitle>
                <CardDescription>Record the outcome of this at-bat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button onClick={() => handleHit('single')} className="bg-green-600 hover:bg-green-700">
                    Single
                  </Button>
                  <Button onClick={() => handleHit('double')} className="bg-green-600 hover:bg-green-700">
                    Double
                  </Button>
                  <Button onClick={() => handleHit('triple')} className="bg-green-600 hover:bg-green-700">
                    Triple
                  </Button>
                  <Button onClick={() => handleHit('home_run')} className="bg-yellow-600 hover:bg-yellow-700">
                    Home Run
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button onClick={handleWalk} className="bg-blue-600 hover:bg-blue-700">
                    Walk
                  </Button>
                  <Button onClick={() => handleHit('foul')} variant="outline">
                    Foul Ball
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button onClick={handleOut} className="bg-red-600 hover:bg-red-700" size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Defensive Plays */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Defensive Events</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline">Error</Button>
                <Button variant="outline">Assist</Button>
                <Button variant="outline">Stolen Base</Button>
                <Button variant="outline">Wild Pitch</Button>
              </CardContent>
            </Card>

            {/* Game Control */}
            <div className="flex gap-3">
              <Link href={`/games/${gameId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Stats
                </Button>
              </Link>
              <Button onClick={handleEndGame} className="flex-1 bg-purple-600 hover:bg-purple-700">
                End Game
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
