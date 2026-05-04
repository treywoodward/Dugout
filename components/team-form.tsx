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

interface TeamFormProps {
  organizationId: string
  onSuccess?: () => void
}

export function TeamForm({ organizationId, onSuccess }: TeamFormProps) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [season, setSeason] = useState('')
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

      const { error: dbError } = await supabase.from('teams').insert([
        {
          organization_id: organizationId,
          name,
          level,
          season,
          user_id: user.id,
        },
      ])

      if (dbError) throw dbError

      setName('')
      setLevel('')
      setSeason('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
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
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          placeholder="e.g., High School Varsity"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-level">Team Level</Label>
        <Select value={level} onValueChange={setLevel} required>
          <SelectTrigger id="team-level">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youth">Youth</SelectItem>
            <SelectItem value="high_school">High School</SelectItem>
            <SelectItem value="college">College</SelectItem>
            <SelectItem value="adult">Adult</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-season">Season (Optional)</Label>
        <Input
          id="team-season"
          placeholder="e.g., 2024 Spring"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Team'}
      </Button>
    </form>
  )
}
