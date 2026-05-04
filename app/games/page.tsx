'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navbar } from '@/components/navbar'
import { getTeams, getTeamGames, createGame } from '@/lib/db-utils'
import { Plus, Play, BarChart3 } from 'lucide-react'

export default function GamesPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [formData, setFormData] = useState({
    opponent_name: '',
    game_date: new Date().toISOString().split('T')[0],
    game_time: '10:00',
    location: '',
    home_away: 'home',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const teamsData = await getTeams(user.id)
        setTeams(teamsData)

        // Get all games
        const allGames: any[] = []
        for (const team of teamsData) {
          const teamGames = await getTeamGames(team.id)
          allGames.push(...teamGames.map(g => ({ ...g, team })))
        }
        setGames(allGames.sort((a, b) => 
          new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
        ))

        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0].id)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return

    try {
      const newGame = await createGame(selectedTeam, {
        ...formData,
        status: 'scheduled',
      })
      const team = teams.find(t => t.id === selectedTeam)
      setGames([{ ...newGame, team }, ...games])
      setFormData({
        opponent_name: '',
        game_date: new Date().toISOString().split('T')[0],
        game_time: '10:00',
        location: '',
        home_away: 'home',
      })
      setShowForm(false)
    } catch (error) {
      console.error('Error creating game:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Games</h2>
          <p className="text-muted-foreground">Create and track your games</p>
        </div>
        {!showForm ? (
          <div className="mb-8">
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Game
            </Button>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Schedule New Game</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center text-gray-600">
                  <p className="mb-4">Create a team first to schedule games</p>
                  <Link href="/teams">
                    <Button>Create Team</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team</label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Opponent</label>
                      <Input
                        placeholder="Opponent team name"
                        value={formData.opponent_name}
                        onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Home/Away</label>
                      <Select value={formData.home_away} onValueChange={(value) => setFormData({ ...formData, home_away: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <Input
                        type="date"
                        value={formData.game_date}
                        onChange={(e) => setFormData({ ...formData, game_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Time</label>
                      <Input
                        type="time"
                        value={formData.game_time}
                        onChange={(e) => setFormData({ ...formData, game_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      placeholder="Field name or address"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Schedule Game</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">All Games</h2>
          {games.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No games scheduled yet. Create a team and schedule your first game!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <Card key={game.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{game.team.name} vs {game.opponent_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(game.game_date).toLocaleDateString()} at {game.game_time || 'TBD'}
                        </p>
                        {game.location && (
                          <p className="text-sm text-gray-600">{game.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 capitalize mb-2">{game.home_away}</p>
                        {game.status === 'completed' ? (
                          <p className="font-semibold text-lg">
                            {game.final_score_us} - {game.final_score_them}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 capitalize">{game.status}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {game.status === 'scheduled' ? (
                          <Link href={`/games/${game.id}/track`}>
                            <Button size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Track
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/games/${game.id}`}>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Stats
                            </Button>
                          </Link>
                        )}
                      </div>
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
