'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navbar } from '@/components/navbar'
import { getTeams, createTeam, getTeamPlayers } from '@/lib/db-utils'
import { Plus, Users, Trash2 } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', level: 'youth', season: new Date().getFullYear().toString() })
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    const fetchTeams = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const teamsData = await getTeams(user.id)
        setTeams(teamsData)

        // Get player counts for each team
        const counts: Record<string, number> = {}
        for (const team of teamsData) {
          const players = await getTeamPlayers(team.id)
          counts[team.id] = players.length
        }
        setPlayerCounts(counts)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      try {
        const newTeam = await createTeam(user.id, formData)
        setTeams([newTeam, ...teams])
        setPlayerCounts({ ...playerCounts, [newTeam.id]: 0 })
        setFormData({ name: '', level: 'youth', season: new Date().getFullYear().toString() })
        setShowForm(false)
      } catch (error) {
        console.error('Error creating team:', error)
      }
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)
      if (!error) {
        setTeams(teams.filter(t => t.id !== teamId))
      }
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
          <h2 className="text-3xl font-bold mb-2">Teams</h2>
          <p className="text-muted-foreground">Manage your teams and rosters</p>
        </div>
        {!showForm ? (
          <div className="mb-8">
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Team Name</label>
                  <Input
                    placeholder="e.g., Yankees"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youth">Youth</SelectItem>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Season</label>
                    <Input
                      placeholder="2024"
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Team</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">Your Teams</h2>
          {teams.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <p>No teams yet. Create your first team to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>
                        <span className="capitalize">{team.level}</span> • Season {team.season}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{playerCounts[team.id] || 0} players</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteTeam(team.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
