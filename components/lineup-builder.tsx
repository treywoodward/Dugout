'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, ChevronUp, ChevronDown, RotateCcw, Save, Trophy, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']

const BATTING_ORDER_TIPS: Record<number, string> = {
  1: 'High OBP, speed — gets on base',
  2: 'Contact hitter, moves runners',
  3: 'Best overall hitter',
  4: 'Power hitter, drives in runs',
  5: 'Second power bat, RBI threats',
  6: 'Solid contact, decent OBP',
  7: 'Developing batter or defensive specialist',
  8: 'Weakest bat or catcher by convention',
  9: 'Second leadoff or pitcher spot',
}

interface LineupPlayer {
  id: string
  name: string
  jersey_number?: number
  position?: string
  stats?: {
    at_bats?: number
    hits?: number
    walks?: number
    hbp?: number
    home_runs?: number
    rbis?: number
    strikeouts?: number
  }
}

interface LineupBuilderProps {
  players: LineupPlayer[]
  onSave?: (lineup: { playerId: string; battingOrder: number; position: string }[]) => void
}

function avg(p: LineupPlayer) {
  const ab = p.stats?.at_bats || 0
  const h = p.stats?.hits || 0
  return ab > 0 ? (h / ab).toFixed(3) : '.000'
}

function obp(p: LineupPlayer) {
  const ab = p.stats?.at_bats || 0
  const h = p.stats?.hits || 0
  const bb = p.stats?.walks || 0
  const hbp = p.stats?.hbp || 0
  const denom = ab + bb + hbp
  return denom > 0 ? ((h + bb + hbp) / denom).toFixed(3) : '.000'
}

export function LineupBuilder({ players, onSave }: LineupBuilderProps) {
  const [lineup, setLineup] = useState<LineupPlayer[]>(players.slice(0, 9))
  const [bench, setBench] = useState<LineupPlayer[]>(players.slice(9))
  const [positions, setPositions] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, p.position || '']))
  )
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setLineup(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    if (idx >= lineup.length - 1) return
    setLineup(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  const handleDragStart = (idx: number) => setDragging(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOver(idx)
  }
  const handleDrop = (idx: number) => {
    if (dragging === null || dragging === idx) return
    setLineup(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragging, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragging(null)
    setDragOver(null)
  }

  const removeFromLineup = (playerId: string) => {
    const player = lineup.find(p => p.id === playerId)
    if (!player) return
    setLineup(prev => prev.filter(p => p.id !== playerId))
    setBench(prev => [...prev, player])
  }

  const addToLineup = (playerId: string) => {
    if (lineup.length >= 9) return
    const player = bench.find(p => p.id === playerId)
    if (!player) return
    setBench(prev => prev.filter(p => p.id !== playerId))
    setLineup(prev => [...prev, player])
  }

  const autoSort = () => {
    setLineup(prev =>
      [...prev].sort((a, b) => {
        const aObp = parseFloat(obp(a))
        const bObp = parseFloat(obp(b))
        const aHr = a.stats?.home_runs || 0
        const bHr = b.stats?.home_runs || 0
        // Top 2: highest OBP, 3-5: mix of OBP+HR, bottom: lower
        return bObp + bHr * 0.05 - (aObp + aHr * 0.05)
      })
    )
  }

  const handleSave = () => {
    const result = lineup.map((p, i) => ({
      playerId: p.id,
      battingOrder: i + 1,
      position: positions[p.id] || '',
    }))
    onSave?.(result)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={autoSort} className="gap-1 text-xs">
            <TrendingUp className="w-3 h-3" />
            Auto-sort by OBP
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setLineup(players.slice(0, 9)); setBench(players.slice(9)) }}
            className="gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
        <Button size="sm" onClick={handleSave} className={cn('gap-1', saved && 'bg-green-600 hover:bg-green-700')}>
          {saved ? <Trophy className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saved ? 'Saved!' : 'Save Lineup'}
        </Button>
      </div>

      {/* Batting order */}
      <div className="space-y-1">
        {lineup.map((player, idx) => (
          <div
            key={player.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => { setDragging(null); setDragOver(null) }}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg border bg-white transition-all',
              dragging === idx && 'opacity-40 scale-95',
              dragOver === idx && dragging !== idx && 'border-blue-400 bg-blue-50 shadow-md',
            )}
          >
            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0" />

            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{player.name}</span>
                {player.jersey_number && (
                  <span className="text-xs text-muted-foreground">#{player.jersey_number}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{BATTING_ORDER_TIPS[idx + 1]}</div>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span>AVG {avg(player)}</span>
              <span>OBP {obp(player)}</span>
              {(player.stats?.home_runs || 0) > 0 && (
                <Badge variant="secondary" className="text-xs py-0 px-1.5">
                  {player.stats?.home_runs} HR
                </Badge>
              )}
            </div>

            <select
              value={positions[player.id] || ''}
              onChange={e => setPositions(prev => ({ ...prev, [player.id]: e.target.value }))}
              className="text-xs border rounded px-1.5 py-1 bg-white w-16 shrink-0"
            >
              <option value="">Pos</option>
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <div className="flex flex-col gap-0.5 shrink-0">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => moveDown(idx)} disabled={idx >= lineup.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-20">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => removeFromLineup(player.id)}
              className="text-xs text-red-400 hover:text-red-600 shrink-0 px-1"
            >
              ✕
            </button>
          </div>
        ))}

        {lineup.length < 9 && (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-muted-foreground">
            {9 - lineup.length} spot{9 - lineup.length !== 1 ? 's' : ''} remaining — add from bench below
          </div>
        )}
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Bench</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {bench.map(player => (
              <button
                key={player.id}
                onClick={() => addToLineup(player.id)}
                disabled={lineup.length >= 9}
                className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-left hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{player.name}</div>
                  <div className="text-xs text-muted-foreground">AVG {avg(player)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
