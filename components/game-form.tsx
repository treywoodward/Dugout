'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

interface GameFormProps {
  teamId: string
  onSuccess?: () => void
}

export function GameForm({ teamId, onSuccess }: GameFormProps) {
  const [opponentName, setOpponentName] = useState('')
  const [gameDate, setGameDate] = useState('')
  const [gameTime, setGameTime] = useState('')
  const [location, setLocation] = useState('')
  const [homeAway, setHomeAway] = useState('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: dbError } = await supabase.from('games').insert([
        {
          team_id: teamId,
          opponent_name: opponentName,
          game_date: gameDate,
          game_time: gameTime || null,
          location: location || null,
          home_away: homeAway,
          status: 'scheduled',
          user_id: user.id,
        },
      ])

      if (dbError) throw dbError

      setOpponentName('')
      setGameDate('')
      setGameTime('')
      setLocation('')
      setHomeAway('home')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="opponent">Opponent Name</Label>
        <Input
          id="opponent"
          placeholder="e.g., Central High"
          value={opponentName}
          onChange={(e) => setOpponentName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Game Date</Label>
          <Input
            id="date"
            type="date"
            value={gameDate}
            onChange={(e) => setGameDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Game Time (Optional)</Label>
          <Input
            id="time"
            type="time"
            value={gameTime}
            onChange={(e) => setGameTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          placeholder="Stadium or field name"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="home-away">Home/Away</Label>
        <Select value={homeAway} onValueChange={setHomeAway}>
          <SelectTrigger id="home-away">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home">Home Game</SelectItem>
            <SelectItem value="away">Away Game</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Game'}
      </Button>
    </form>
  )
}
