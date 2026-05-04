'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTeamPlayers, createPlayer } from '@/lib/db-utils'
import { Plus, Trash2, Edit } from 'lucide-react'

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params.id as string
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '',
    position: '',
    throws: 'R',
    bats: 'R',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
      setTeam(team)

      const playersData = await getTeamPlayers(teamId)
      setPlayers(playersData)
      setLoading(false)
    }
    fetchTeamData()
  }, [teamId])

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newPlayer = await createPlayer(teamId, {
        ...formData,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
      })
      setPlayers([...players, newPlayer])
      setFormData({
        name: '',
        jersey_number: '',
        position: '',
        throws: 'R',
        bats: 'R',
      })
      setShowForm(false)
    } catch (error) {
      console.error('Error adding player:', error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to remove this player?')) {
      const { error } = await supabase.from('players').delete().eq('id', playerId)
      if (!error) {
        setPlayers(players.filter(p => p.id !== playerId))
      }
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p>Team not found</p>
        <Link href="/teams">
          <Button className="mt-4">Back to Teams</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <Link href="/teams">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            <span className="capitalize">{team.level}</span> • Season {team.season}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!showForm ? (
          <div className="mb-8">
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Player</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPlayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Player Name</label>
                  <Input
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Jersey #</label>
                    <Input
                      type="number"
                      placeholder="1-99"
                      value={formData.jersey_number}
                      onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                      min="1"
                      max="99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Position</label>
                    <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">Pitcher</SelectItem>
                        <SelectItem value="C">Catcher</SelectItem>
                        <SelectItem value="1B">First Base</SelectItem>
                        <SelectItem value="2B">Second Base</SelectItem>
                        <SelectItem value="3B">Third Base</SelectItem>
                        <SelectItem value="SS">Shortstop</SelectItem>
                        <SelectItem value="LF">Left Field</SelectItem>
                        <SelectItem value="CF">Center Field</SelectItem>
                        <SelectItem value="RF">Right Field</SelectItem>
                        <SelectItem value="DH">Designated Hitter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Throws</label>
                    <Select value={formData.throws} onValueChange={(value) => setFormData({ ...formData, throws: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R">Right</SelectItem>
                        <SelectItem value="L">Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bats</label>
                    <Select value={formData.bats} onValueChange={(value) => setFormData({ ...formData, bats: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R">Right</SelectItem>
                        <SelectItem value="L">Left</SelectItem>
                        <SelectItem value="S">Switch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Add Player</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">Roster ({players.length} players)</h2>
          {players.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No players on this team yet. Add your first player!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">#</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Position</th>
                    <th className="text-left py-3 px-4 font-semibold">Throws</th>
                    <th className="text-left py-3 px-4 font-semibold">Bats</th>
                    <th className="text-right py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{player.jersey_number}</td>
                      <td className="py-3 px-4">{player.name}</td>
                      <td className="py-3 px-4">{player.position}</td>
                      <td className="py-3 px-4">{player.throws}</td>
                      <td className="py-3 px-4">{player.bats}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlayer(player.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
