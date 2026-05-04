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

interface PlayerFormProps {
  teamId: string
  onSuccess?: () => void
}

const POSITIONS = [
  'Pitcher',
  'Catcher',
  'First Base',
  'Second Base',
  'Third Base',
  'Shortstop',
  'Left Field',
  'Center Field',
  'Right Field',
  'Designated Hitter',
]

export function PlayerForm({ teamId, onSuccess }: PlayerFormProps) {
  const [name, setName] = useState('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [position, setPosition] = useState('')
  const [throws, setThrows] = useState('')
  const [bats, setBats] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase.from('players').insert([
        {
          team_id: teamId,
          name,
          jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
          position: position || null,
          throws: throws || null,
          bats: bats || null,
        },
      ])

      if (dbError) throw dbError

      setName('')
      setJerseyNumber('')
      setPosition('')
      setThrows('')
      setBats('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create player')
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
        <Label htmlFor="player-name">Player Name</Label>
        <Input
          id="player-name"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jersey-number">Jersey Number (Optional)</Label>
        <Input
          id="jersey-number"
          type="number"
          placeholder="e.g., 23"
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          min="0"
          max="99"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Position (Optional)</Label>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger id="position">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="throws">Throws (Optional)</Label>
          <Select value={throws} onValueChange={setThrows}>
            <SelectTrigger id="throws">
              <SelectValue placeholder="L/R" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Left</SelectItem>
              <SelectItem value="R">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bats">Bats (Optional)</Label>
          <Select value={bats} onValueChange={setBats}>
            <SelectTrigger id="bats">
              <SelectValue placeholder="L/R/S" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Left</SelectItem>
              <SelectItem value="R">Right</SelectItem>
              <SelectItem value="S">Switch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding...' : 'Add Player'}
      </Button>
    </form>
  )
}
