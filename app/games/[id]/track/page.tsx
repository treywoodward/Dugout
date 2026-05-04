'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { getTeamPlayers, recordAtBat } from '@/lib/db-utils'
import { cn } from '@/lib/utils'
import { Shield, Users, ChevronRight, X, ChevronDown } from 'lucide-react'

type Player = { id: string; name: string; jersey_number?: number }
type Mode = 'batting' | 'fielding'
type ResultType = 'single' | 'double' | 'triple' | 'home_run' | 'strikeout' | 'out' | 'walk' | 'hbp'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function CountDots({ count, max, filled }: { count: number; max: number; filled: string }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-4 rounded-full border-2 transition-all duration-150',
            i < count ? filled : 'border-slate-200 bg-white'
          )}
        />
      ))}
    </div>
  )
}

function Diamond({ bases }: { bases: { first: boolean; second: boolean; third: boolean } }) {
  const base = (on: boolean) =>
    cn('w-4 h-4 rotate-45 border-2 transition-all', on ? 'bg-yellow-400 border-yellow-500' : 'border-slate-300 bg-white')
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <div className={cn('absolute top-0 left-1/2 -translate-x-1/2', base(bases.second))} />
      <div className={cn('absolute left-0 top-1/2 -translate-y-1/2', base(bases.third))} />
      <div className={cn('absolute right-0 top-1/2 -translate-y-1/2', base(bases.first))} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 border-slate-400 bg-slate-100" />
    </div>
  )
}

interface DetailModalProps {
  resultType: ResultType
  rbis: number
  direction: string | null
  outType: string | null
  onRBIs: (n: number) => void
  onDirection: (d: string) => void
  onOutType: (t: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function ResultDetailModal({
  resultType, rbis, direction, outType,
  onRBIs, onDirection, onOutType, onConfirm, onCancel,
}: DetailModalProps) {
  const isHit = ['single', 'double', 'triple', 'home_run'].includes(resultType)
  const isOut = resultType === 'strikeout' || resultType === 'out'
  const hitLabels: Record<string, string> = { single: 'Single', double: 'Double', triple: 'Triple', home_run: 'Home Run' }
  const canConfirm = isOut ? (resultType === 'strikeout' || !!outType) : true

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 space-y-5 pb-10 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Result</div>
            <div className="text-2xl font-black text-slate-900">
              {isHit ? hitLabels[resultType] : isOut ? (resultType === 'strikeout' ? 'Strikeout' : 'Out') : resultType}
            </div>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {isHit && resultType !== 'home_run' && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">Where did the ball go?</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'left', label: 'Left Field' },
                { id: 'center', label: 'Center Field' },
                { id: 'right', label: 'Right Field' },
                { id: 'infield', label: 'Infield Hit' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => onDirection(d.id)}
                  className={cn(
                    'py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95',
                    direction === d.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isOut && resultType !== 'strikeout' && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">How did they get out?</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'groundout', label: 'Ground Out' },
                { id: 'flyout', label: 'Fly Out' },
                { id: 'lineout', label: 'Line Drive Out' },
                { id: 'popup', label: 'Pop Up' },
                { id: 'force', label: 'Force Out' },
                { id: 'double_play', label: 'Double Play' },
              ].map(o => (
                <button
                  key={o.id}
                  onClick={() => onOutType(o.id)}
                  className={cn(
                    'py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95',
                    outType === o.id
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isHit && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-600">
              {resultType === 'home_run' ? 'Runners on base?' : 'RBIs scored?'}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => onRBIs(n)}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all active:scale-95',
                    rbis === n
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg disabled:opacity-30 active:scale-95 transition-all"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default function GameTrackerPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const supabase = createClient()

  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inning, setInning] = useState(1)
  const [isTop, setIsTop] = useState(true)
  const [mode, setMode] = useState<Mode | null>(null)
  const [outs, setOuts] = useState(0)
  const [score, setScore] = useState({ us: 0, them: 0 })
  const [bases, setBases] = useState({ first: false, second: false, third: false })
  const [balls, setBalls] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [lineup, setLineup] = useState<Player[]>([])
  const [batterIdx, setBatterIdx] = useState(0)
  const [oppBalls, setOppBalls] = useState(0)
  const [oppStrikes, setOppStrikes] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [pendingResult, setPendingResult] = useState<ResultType | null>(null)
  const [detailDir, setDetailDir] = useState<string | null>(null)
  const [detailOutType, setDetailOutType] = useState<string | null>(null)
  const [detailRBIs, setDetailRBIs] = useState(0)
  const [flashMsg, setFlashMsg] = useState<string | null>(null)
  const [outFlash, setOutFlash] = useState(false)
  const [halfOver, setHalfOver] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: g } = await supabase.from('games').select('*').eq('id', gameId).single()
      setGame(g)
      if (g?.team_id) {
        const p = await getTeamPlayers(g.team_id)
        setLineup(p)
      }
      setLoading(false)
    }
    load()
  }, [gameId])

  const flash = (msg: string) => {
    setFlashMsg(msg)
    setTimeout(() => setFlashMsg(null), 2500)
  }

  const resetCount = () => { setBalls(0); setStrikes(0) }
  const resetOppCount = () => { setOppBalls(0); setOppStrikes(0) }

  const nextBatter = useCallback(() => {
    setBatterIdx(i => (i + 1) % Math.max(lineup.length, 1))
    setBalls(0); setStrikes(0)
    setDetailDir(null); setDetailOutType(null); setDetailRBIs(0)
    setShowDetail(false); setPendingResult(null)
  }, [lineup.length])

  const addOut = useCallback(() => {
    setOutFlash(true)
    setTimeout(() => setOutFlash(false), 600)
    setOuts(prev => {
      const next = prev + 1
      if (next >= 3) {
        setTimeout(() => setHalfOver(true), 50)
        return 3
      }
      return next
    })
  }, [])

  const handleBall = () => {
    if (balls >= 3) { flash('Ball 4 — Walk!'); openResult('walk') }
    else setBalls(b => b + 1)
  }

  const handleStrike = () => {
    if (strikes >= 2) { flash('Strike 3!'); openResult('strikeout') }
    else setStrikes(s => s + 1)
  }

  const handleFoul = () => { if (strikes < 2) setStrikes(s => s + 1) }

  const openResult = (type: ResultType) => {
    setPendingResult(type)
    if (type === 'walk' || type === 'hbp') finalize(type, {})
    else setShowDetail(true)
  }

  const finalize = async (type: ResultType, detail: { dir?: string; outType?: string; rbis?: number }) => {
    const batter = lineup[batterIdx]
    if (batter) {
      try {
        await recordAtBat(gameId, {
          batter_id: batter.id,
          inning,
          result: type,
          hit_type: ['single', 'double', 'triple', 'home_run'].includes(type) ? type : undefined,
          rbis: detail.rbis ?? 0,
        })
      } catch {}
    }

    const rbis = detail.rbis ?? 0
    const isOut = type === 'strikeout' || type === 'out'

    if (type === 'home_run') setScore(s => ({ ...s, us: s.us + 1 + rbis }))
    else if (rbis > 0) setScore(s => ({ ...s, us: s.us + rbis }))

    if (type === 'single' || type === 'walk' || type === 'hbp') setBases(b => ({ ...b, first: true }))
    else if (type === 'double') setBases(b => ({ ...b, second: true }))
    else if (type === 'triple') setBases(b => ({ ...b, third: true }))
    else if (type === 'home_run') setBases({ first: false, second: false, third: false })

    if (isOut) addOut()
    nextBatter()
  }

  const confirmDetail = () => {
    if (!pendingResult) return
    finalize(pendingResult, { dir: detailDir ?? undefined, outType: detailOutType ?? undefined, rbis: detailRBIs })
  }

  const handleOppOut = () => { addOut(); resetOppCount() }
  const handleOppRun = () => { setScore(s => ({ ...s, them: s.them + 1 })); flash('Opponent scores!') }

  const endHalfInning = () => {
    setHalfOver(false)
    setOuts(0)
    setBases({ first: false, second: false, third: false })
    resetCount(); resetOppCount()
    setMode(null)
    if (isTop) setIsTop(false)
    else { setInning(i => i + 1); setIsTop(true) }
  }

  const handleEndGame = async () => {
    await supabase.from('games').update({
      status: 'completed',
      final_score_us: score.us,
      final_score_them: score.them,
    }).eq('id', gameId)
    router.push(`/games/${gameId}`)
  }

  const batter = lineup[batterIdx]
  const onDeck = lineup[(batterIdx + 1) % Math.max(lineup.length, 1)]
  const inHolePlayer = lineup[(batterIdx + 2) % Math.max(lineup.length, 1)]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // 3 outs — half inning over
  if (halfOver) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center space-y-1">
          <div className="text-8xl font-black text-white tracking-tight">3</div>
          <div className="text-slate-400 text-xl uppercase tracking-widest font-semibold">Outs</div>
          <div className="text-slate-500 text-sm mt-2">Half inning complete</div>
        </div>
        <div className="w-full max-w-xs bg-slate-800/80 rounded-2xl p-6 text-center space-y-4">
          <div className="text-xs text-slate-500 uppercase tracking-widest">Score</div>
          <div className="flex items-center justify-center gap-8">
            <div>
              <div className="text-5xl font-black text-white">{score.us}</div>
              <div className="text-xs text-slate-500 mt-1">Us</div>
            </div>
            <div className="text-slate-700 text-2xl">—</div>
            <div>
              <div className="text-5xl font-black text-white">{score.them}</div>
              <div className="text-xs text-slate-500 mt-1">{game?.opponent_name ?? 'Them'}</div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={endHalfInning}
            className="w-full h-14 bg-green-500 hover:bg-green-400 active:scale-95 text-white rounded-2xl text-lg font-bold transition-all"
          >
            Switch Sides →
          </button>
          <button onClick={handleEndGame} className="w-full text-slate-600 text-sm py-2 hover:text-slate-400 transition-colors">
            End Game
          </button>
        </div>
      </div>
    )
  }

  // Mode selector
  if (!mode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="pt-16 pb-8 text-center px-6 space-y-6">
          <div className="text-slate-500 text-sm uppercase tracking-widest font-semibold">
            {isTop ? '▲' : '▽'} {ordinal(inning)} Inning
          </div>
          <div className="flex items-center justify-center gap-10">
            <div className="text-center">
              <div className="text-6xl font-black text-white">{score.us}</div>
              <div className="text-slate-500 text-xs mt-2 uppercase tracking-wider">Us</div>
            </div>
            <div className="text-slate-700 text-3xl">—</div>
            <div className="text-center">
              <div className="text-6xl font-black text-white">{score.them}</div>
              <div className="text-slate-500 text-xs mt-2 uppercase tracking-wider">{game?.opponent_name ?? 'Them'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3 pb-16">
          <div className="text-white text-2xl font-bold text-center mb-4">Who's batting?</div>

          <button
            onClick={() => setMode('batting')}
            className="w-full max-w-sm bg-green-500 hover:bg-green-400 active:scale-95 text-white rounded-2xl p-5 flex items-center gap-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-green-600/60 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">We're Batting</div>
              <div className="text-green-100/70 text-sm">Track our lineup & at-bats</div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60" />
          </button>

          <button
            onClick={() => setMode('fielding')}
            className="w-full max-w-sm bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-2xl p-5 flex items-center gap-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-lg">We're Fielding</div>
              <div className="text-slate-300/70 text-sm">Track defense & opponent runs</div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-40" />
          </button>

          <button onClick={handleEndGame} className="mt-10 text-slate-600 text-sm hover:text-slate-400 transition-colors">
            End Game
          </button>
        </div>
      </div>
    )
  }

  // Main tracker
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Scoreboard */}
      <header className="bg-slate-950 text-white sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Us</div>
              <div className="text-3xl font-black leading-none">{score.us}</div>
            </div>
            <div className="text-slate-700">—</div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Them</div>
              <div className="text-3xl font-black leading-none">{score.them}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-slate-400">{isTop ? '▲' : '▽'} {ordinal(inning)}</div>
            <button
              onClick={() => setMode(null)}
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1',
                mode === 'batting' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              )}
            >
              {mode} ↕
            </button>
          </div>

          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Outs</div>
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all',
                    i < outs
                      ? outFlash ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-white'
                      : 'border-slate-700'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {flashMsg && (
          <div className="bg-yellow-400 text-slate-900 text-center py-1.5 text-sm font-bold">
            ⚡ {flashMsg}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-3 pb-8">
        {mode === 'batting' ? (
          <>
            {/* Lineup */}
            {lineup.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
                <div className="text-amber-700 font-semibold">No players in lineup</div>
                <Link href="/teams"><Button variant="outline" size="sm">Manage Team</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* At Bat */}
                <div className="bg-white rounded-2xl ring-2 ring-green-500 shadow-lg shadow-green-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-xl">
                        ⚾
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider">At Bat</div>
                        <div className="text-xl font-black text-slate-900 truncate">
                          {batter?.jersey_number != null && `#${batter.jersey_number} `}{batter?.name ?? '—'}
                        </div>
                      </div>
                    </div>
                    <Diamond bases={bases} />
                  </div>
                </div>

                {/* On Deck & In Hole */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-slate-400 text-[9px] font-bold leading-none text-center">ON<br />DECK</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate">
                        {onDeck?.jersey_number != null && `#${onDeck.jersey_number} `}{onDeck?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-slate-400 text-[9px] font-bold leading-none text-center">IN<br />HOLE</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-500 truncate">
                        {inHolePlayer?.jersey_number != null && `#${inHolePlayer.jersey_number} `}{inHolePlayer?.name ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Count */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2.5 font-semibold">Balls</div>
                  <CountDots count={balls} max={4} filled="bg-blue-500 border-blue-500" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2.5 font-semibold">Strikes</div>
                  <CountDots count={strikes} max={3} filled="bg-red-500 border-red-500" />
                </div>
              </div>
            </div>

            {/* Pitch buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleBall}
                className="bg-blue-600 active:bg-blue-800 active:scale-95 text-white rounded-2xl py-7 flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-3xl font-black leading-none">B</span>
                <span className="text-xs opacity-60 font-medium">Ball</span>
              </button>
              <button
                onClick={handleStrike}
                className="bg-red-600 active:bg-red-800 active:scale-95 text-white rounded-2xl py-7 flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-3xl font-black leading-none">S</span>
                <span className="text-xs opacity-60 font-medium">Strike</span>
              </button>
              <button
                onClick={handleFoul}
                className="bg-amber-500 active:bg-amber-700 active:scale-95 text-white rounded-2xl py-7 flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-3xl font-black leading-none">F</span>
                <span className="text-xs opacity-60 font-medium">Foul</span>
              </button>
            </div>

            {/* Result buttons */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Record Result</div>

              {/* Hits */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'single' as ResultType, label: '1B', cls: 'bg-green-500 text-white' },
                  { type: 'double' as ResultType, label: '2B', cls: 'bg-green-600 text-white' },
                  { type: 'triple' as ResultType, label: '3B', cls: 'bg-green-700 text-white' },
                  { type: 'home_run' as ResultType, label: 'HR', cls: 'bg-yellow-500 text-white' },
                ].map(({ type, label, cls }) => (
                  <button
                    key={type}
                    onClick={() => openResult(type)}
                    className={cn('rounded-xl py-4 font-black text-base active:scale-95 transition-all', cls)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Other outcomes */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openResult('walk')}
                  className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl py-3 font-semibold text-sm active:scale-95 transition-all"
                >
                  BB
                </button>
                <button
                  onClick={() => openResult('hbp')}
                  className="bg-purple-50 text-purple-700 border border-purple-100 rounded-xl py-3 font-semibold text-sm active:scale-95 transition-all"
                >
                  HBP
                </button>
                <button
                  onClick={() => openResult('out')}
                  className="bg-slate-100 text-slate-700 rounded-xl py-3 font-semibold text-sm active:scale-95 transition-all"
                >
                  Out
                </button>
              </div>

              <button
                onClick={() => openResult('strikeout')}
                className="w-full bg-red-600 active:bg-red-800 active:scale-95 text-white rounded-xl py-4 font-black text-base transition-all"
              >
                K — Strikeout
              </button>
            </div>

            {/* Full lineup (collapsible) */}
            <details className="bg-white rounded-2xl border border-slate-100 overflow-hidden group">
              <summary className="px-4 py-3.5 text-sm font-semibold text-slate-600 cursor-pointer select-none flex items-center justify-between">
                <span>Full Lineup ({lineup.length} players)</span>
                <ChevronDown className="w-4 h-4 opacity-40 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="border-t border-slate-100">
                {lineup.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setBatterIdx(i)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3 text-left border-b border-slate-50 last:border-0 transition-colors',
                      i === batterIdx ? 'bg-green-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === batterIdx ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {i + 1}
                    </span>
                    <span className={cn(
                      'text-sm flex-1',
                      i === batterIdx ? 'text-green-700 font-bold' : 'text-slate-700 font-medium'
                    )}>
                      {p.jersey_number != null ? `#${p.jersey_number} ` : ''}{p.name}
                    </span>
                    {i === batterIdx && <span className="text-xs text-green-600 font-semibold">AT BAT</span>}
                    {i === (batterIdx + 1) % lineup.length && i !== batterIdx && (
                      <span className="text-xs text-slate-400">On Deck</span>
                    )}
                  </button>
                ))}
              </div>
            </details>
          </>
        ) : (
          <>
            {/* Fielding mode */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Opponent Count</div>
              <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2.5 font-semibold">Balls</div>
                    <CountDots count={oppBalls} max={4} filled="bg-blue-500 border-blue-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2.5 font-semibold">Strikes</div>
                    <CountDots count={oppStrikes} max={3} filled="bg-red-500 border-red-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { if (oppBalls >= 3) resetOppCount(); else setOppBalls(b => b + 1) }}
                  className="bg-blue-600 active:scale-95 text-white rounded-xl py-5 font-black text-lg transition-all"
                >B</button>
                <button
                  onClick={() => { if (oppStrikes >= 2) { handleOppOut() } else setOppStrikes(s => s + 1) }}
                  className="bg-red-600 active:scale-95 text-white rounded-xl py-5 font-black text-lg transition-all"
                >S</button>
                <button
                  onClick={() => { if (oppStrikes < 2) setOppStrikes(s => s + 1) }}
                  className="bg-amber-500 active:scale-95 text-white rounded-xl py-5 font-black text-lg transition-all"
                >F</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Opponent Result</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOppOut}
                  className="bg-red-600 active:scale-95 text-white rounded-xl py-5 font-bold text-base transition-all"
                >
                  + Out
                </button>
                <button
                  onClick={handleOppRun}
                  className="bg-slate-900 active:scale-95 text-white rounded-xl py-5 font-bold text-base transition-all"
                >
                  + Run Scored
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Defensive Events</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Error', cls: 'bg-red-50 text-red-700 border-red-100' },
                  { label: 'Assist', cls: 'bg-green-50 text-green-700 border-green-100' },
                  { label: 'Stolen Base', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Wild Pitch', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { label: 'Passed Ball', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Double Play', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                ].map(({ label, cls }) => (
                  <button
                    key={label}
                    className={cn('border rounded-xl py-3 font-semibold text-sm active:scale-95 transition-all', cls)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <Link href={`/games/${gameId}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl">View Stats</Button>
          </Link>
          <Button onClick={handleEndGame} className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
            End Game
          </Button>
        </div>
      </main>

      {showDetail && pendingResult && (
        <ResultDetailModal
          resultType={pendingResult}
          rbis={detailRBIs}
          direction={detailDir}
          outType={detailOutType}
          onRBIs={setDetailRBIs}
          onDirection={setDetailDir}
          onOutType={setDetailOutType}
          onConfirm={confirmDetail}
          onCancel={() => { setShowDetail(false); setPendingResult(null) }}
        />
      )}
    </div>
  )
}
