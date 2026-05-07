'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineupBuilder } from '@/components/lineup-builder'
import { getTeams, getTeamPlayers, getPlayerGameStats } from '@/lib/db-utils'
import { AlertCircle, ClipboardList } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function LineupPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const teamsData = await getTeams(user.id)
        setTeams(teamsData)
        if (teamsData.length > 0) setSelectedTeamId(teamsData[0].id)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedTeamId) return
      const playersData = await getTeamPlayers(selectedTeamId)
      const enriched = await Promise.all(
        playersData.map(async (p: any) => ({
          ...p,
          stats: await getPlayerGameStats(p.id, selectedTeamId),
        }))
      )
      setPlayers(enriched)
    }
    fetchPlayers()
  }, [selectedTeamId])

  const handleSave = async (lineup: { playerId: string; battingOrder: number; position: string }[]) => {
    // Save lineup to each player record
    const updates = lineup.map(({ playerId, battingOrder, position }) =>
      supabase
        .from('players')
        .update({ position, batting_order: battingOrder })
        .eq('id', playerId)
    )
    await Promise.all(updates)
    toast.success('Lineup saved!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-primary rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">Lineup Builder</h2>
          </div>
          <p className="text-muted-foreground">
            Drag to reorder, auto-sort by OBP, assign positions. Saved lineups carry into game tracking.
          </p>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Create a team with players to build a lineup</p>
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

            {players.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-muted-foreground">Add players to this team to build a lineup</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {teams.find(t => t.id === selectedTeamId)?.name} — Batting Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LineupBuilder players={players} onSave={handleSave} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
