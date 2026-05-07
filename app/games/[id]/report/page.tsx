'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AiInsights } from '@/components/ai-insights'
import { getTeamPlayers, getPlayerGameStats, getGameStats } from '@/lib/db-utils'
import { calculateBattingStats, calculateTeamStats } from '@/lib/stats-calculator'
import {
  ArrowLeft, Share2, Download, Trophy, Target, Zap,
  TrendingUp, Users, Activity
} from 'lucide-react'

interface Params { id: string }

export default function GameReportPage({ params }: { params: Params }) {
  const [game, setGame] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [playerStats, setPlayerStats] = useState<Record<string, any>>({})
  const [atBats, setAtBats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchGameData = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*, teams(id, name)')
        .eq('id', params.id)
        .single()

      if (!gameData) { setLoading(false); return }

      setGame(gameData)
      setTeam(gameData.teams)

      const [playersData, gameStats] = await Promise.all([
        getTeamPlayers(gameData.team_id),
        getGameStats(params.id),
      ])

      setPlayers(playersData)
      setAtBats(gameStats.atBats)

      const statsMap: Record<string, any> = {}
      await Promise.all(
        playersData.map(async (p: any) => {
          statsMap[p.id] = await getPlayerGameStats(p.id, gameData.team_id)
        })
      )
      setPlayerStats(statsMap)
      setLoading(false)
    }
    fetchGameData()
  }, [params.id])

  const handleShare = async () => {
    const url = `${window.location.origin}/games/${params.id}/report`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const lines = [
      `DUGOUT GAME REPORT`,
      `${team?.name} vs ${game?.opponent_name}`,
      `Date: ${game?.game_date ? new Date(game.game_date).toLocaleDateString() : ''}`,
      `Final Score: ${game?.final_score_us ?? '?'} - ${game?.final_score_them ?? '?'}`,
      `Result: ${game?.final_score_us > game?.final_score_them ? 'WIN' : 'LOSS'}`,
      '',
      'BATTING STATS',
      players
        .map(p => {
          const s = playerStats[p.id] || {}
          const calc = calculateBattingStats(s)
          return `${p.name} #${p.jersey_number || '?'}: ${s.at_bats || 0}-${s.hits || 0}, ${s.rbis || 0} RBI, AVG ${calc.avg}`
        })
        .join('\n'),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dugout-report-${params.id}.txt`
    a.click()
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

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Game not found</p>
          <Link href="/games"><Button variant="outline">Back to Games</Button></Link>
        </main>
      </div>
    )
  }

  const won = game.final_score_us > game.final_score_them
  const margin = Math.abs((game.final_score_us || 0) - (game.final_score_them || 0))

  // Aggregate this-game stats from at_bats
  const gamePlayerStats: Record<string, { ab: number; h: number; rbi: number; hr: number; k: number; bb: number; hbp: number }> = {}
  atBats.forEach((ab: any) => {
    if (!gamePlayerStats[ab.batter_id]) {
      gamePlayerStats[ab.batter_id] = { ab: 0, h: 0, rbi: 0, hr: 0, k: 0, bb: 0, hbp: 0 }
    }
    const s = gamePlayerStats[ab.batter_id]
    const isHit = ['single', 'double', 'triple', 'home_run'].includes(ab.result)
    if (!['walk', 'hbp'].includes(ab.result)) s.ab++
    if (isHit) s.h++
    if (ab.result === 'home_run') s.hr++
    if (ab.result === 'strikeout') s.k++
    if (ab.result === 'walk') s.bb++
    if (ab.result === 'hbp') s.hbp++
    s.rbi += ab.rbis || 0
  })

  const playerStatsArray = players.map(p => ({ ...p, ...(playerStats[p.id] || {}) }))
  const mvp = players.reduce((best, p) => {
    const s = gamePlayerStats[p.id]
    if (!s) return best
    const score = (s.h * 2) + (s.rbi * 3) + (s.hr * 5) + (s.bb * 1)
    const bestScore = best
      ? (gamePlayerStats[best.id]?.h || 0) * 2 + (gamePlayerStats[best.id]?.rbi || 0) * 3
      : -1
    return score > bestScore ? p : best
  }, null as any)

  const totalHits = Object.values(gamePlayerStats).reduce((s, p) => s + p.h, 0)
  const totalKs = Object.values(gamePlayerStats).reduce((s, p) => s + p.k, 0)
  const totalBBs = Object.values(gamePlayerStats).reduce((s, p) => s + p.bb, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/games/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} size="sm" variant="outline" className="gap-1.5">
              <Share2 className="h-4 w-4" />
              {copied ? 'Copied!' : 'Share'}
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Hero scorecard */}
        <div
          className={`rounded-3xl p-8 mb-8 text-white ${
            won
              ? 'bg-gradient-to-br from-green-600 to-emerald-800'
              : 'bg-gradient-to-br from-slate-700 to-slate-900'
          }`}
        >
          <div className="text-center mb-6">
            <div className="text-sm font-semibold uppercase tracking-widest opacity-70 mb-1">
              {game.game_date ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Game Report'}
            </div>
            <div className="text-4xl font-black mb-2">
              {won ? '🏆 Victory' : '⚾ Game Summary'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-12 mb-6">
            <div className="text-center">
              <div className="text-6xl font-black">{game.final_score_us ?? '?'}</div>
              <div className="text-sm opacity-70 mt-1 font-semibold">{team?.name ?? 'Us'}</div>
            </div>
            <div className="text-3xl opacity-40 font-light">—</div>
            <div className="text-center">
              <div className="text-6xl font-black">{game.final_score_them ?? '?'}</div>
              <div className="text-sm opacity-70 mt-1 font-semibold">{game.opponent_name}</div>
            </div>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
              {totalHits} Hits
            </Badge>
            <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
              {totalKs} Strikeouts
            </Badge>
            <Badge className="bg-white/20 text-white border-0 text-sm px-3 py-1">
              {totalBBs} Walks
            </Badge>
            {won && (
              <Badge className="bg-yellow-400 text-yellow-900 border-0 text-sm px-3 py-1">
                {margin > 5 ? 'Dominant Win' : margin > 3 ? 'Solid Win' : 'Close Win'}
              </Badge>
            )}
          </div>
        </div>

        {/* MVP */}
        {mvp && gamePlayerStats[mvp.id] && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-2xl flex-shrink-0">
              🌟
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-0.5">Game MVP</div>
              <div className="text-xl font-black text-slate-900">
                {mvp.name}
                {mvp.jersey_number && <span className="text-slate-500 font-normal text-base ml-1">#{mvp.jersey_number}</span>}
              </div>
              <div className="text-sm text-slate-600">
                {gamePlayerStats[mvp.id].h}-{gamePlayerStats[mvp.id].ab}
                {gamePlayerStats[mvp.id].rbi > 0 && `, ${gamePlayerStats[mvp.id].rbi} RBI`}
                {gamePlayerStats[mvp.id].hr > 0 && `, ${gamePlayerStats[mvp.id].hr} HR`}
              </div>
            </div>
          </div>
        )}

        {/* Batting line */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Batting Line
          </h3>
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-8 text-xs font-semibold text-muted-foreground bg-slate-50 px-4 py-2 border-b">
              <div className="col-span-2">Player</div>
              <div className="text-center">AB</div>
              <div className="text-center">H</div>
              <div className="text-center">RBI</div>
              <div className="text-center">HR</div>
              <div className="text-center">BB</div>
              <div className="text-center">K</div>
            </div>
            {players.map((player, i) => {
              const s = gamePlayerStats[player.id] || { ab: 0, h: 0, rbi: 0, hr: 0, k: 0, bb: 0 }
              const battingAvg = s.ab > 0 ? (s.h / s.ab).toFixed(3) : ''
              return (
                <div
                  key={player.id}
                  className={`grid grid-cols-8 px-4 py-3 text-sm items-center ${i % 2 === 0 ? '' : 'bg-slate-50/50'} border-b last:border-0`}
                >
                  <div className="col-span-2 font-medium flex items-center gap-1.5">
                    {player.jersey_number && (
                      <span className="text-xs text-muted-foreground w-5">#{player.jersey_number}</span>
                    )}
                    <span className="truncate">{player.name}</span>
                    {s.hr > 0 && <span className="text-yellow-500">💥</span>}
                  </div>
                  <div className="text-center">{s.ab}</div>
                  <div className="text-center font-semibold">{s.h}</div>
                  <div className="text-center">{s.rbi || 0}</div>
                  <div className="text-center">{s.hr || 0}</div>
                  <div className="text-center">{s.bb || 0}</div>
                  <div className="text-center">{s.k || 0}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Season stats context */}
        {players.length > 0 && Object.keys(playerStats).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Season Averages
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {players.map(player => {
                const s = playerStats[player.id]
                if (!s || !s.at_bats) return null
                const calc = calculateBattingStats(s)
                return (
                  <div key={player.id} className="border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {player.jersey_number || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{player.name}</div>
                        <div className="text-xs text-muted-foreground">{s.games_played} G</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold">{calc.avg}</div>
                        <div className="text-xs text-muted-foreground">AVG</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{calc.obp}</div>
                        <div className="text-xs text-muted-foreground">OBP</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{s.rbis || 0}</div>
                        <div className="text-xs text-muted-foreground">RBI</div>
                      </div>
                    </div>
                  </div>
                )
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* AI Insights for next game */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Coaching Notes
          </h3>
          <AiInsights
            teamName={team?.name || ''}
            teamStats={null}
            playerStats={playerStatsArray}
            opponentHistory={[game]}
          />
        </div>

        {/* Share callout */}
        <div className="bg-slate-50 border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Share this report with parents, players, and coaches
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              {copied ? 'Link Copied!' : 'Copy Share Link'}
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export Text
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
