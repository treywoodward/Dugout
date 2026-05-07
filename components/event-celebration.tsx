'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type EventType = 'home_run' | 'strikeout' | 'walk' | 'triple' | 'double' | 'single' | 'hbp' | null

const EVENT_CONFIG: Record<
  NonNullable<EventType>,
  { emoji: string; label: string; bg: string; textColor: string; duration: number }
> = {
  home_run: { emoji: '🚀', label: 'HOME RUN!', bg: 'bg-yellow-400', textColor: 'text-yellow-950', duration: 3000 },
  strikeout: { emoji: '🔥', label: 'STRIKE OUT!', bg: 'bg-red-600', textColor: 'text-white', duration: 1800 },
  triple: { emoji: '⚡', label: 'TRIPLE!', bg: 'bg-purple-600', textColor: 'text-white', duration: 2000 },
  double: { emoji: '💥', label: 'DOUBLE!', bg: 'bg-blue-600', textColor: 'text-white', duration: 1800 },
  single: { emoji: '✅', label: 'SINGLE!', bg: 'bg-green-600', textColor: 'text-white', duration: 1400 },
  walk: { emoji: '🚶', label: 'WALK!', bg: 'bg-slate-700', textColor: 'text-white', duration: 1400 },
  hbp: { emoji: '🩹', label: 'HIT BY PITCH', bg: 'bg-orange-600', textColor: 'text-white', duration: 1600 },
}

interface EventCelebrationProps {
  event: EventType
  onDone: () => void
}

export function EventCelebration({ event, onDone }: EventCelebrationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!event) return
    setVisible(true)
    const cfg = EVENT_CONFIG[event]
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, cfg.duration)
    return () => clearTimeout(t)
  }, [event, onDone])

  if (!event) return null
  const cfg = EVENT_CONFIG[event]

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none transition-all duration-300',
        cfg.bg,
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className={cn('text-center', cfg.textColor)}>
        <div
          className={cn(
            'text-8xl mb-4 transition-transform duration-500',
            visible ? 'scale-100' : 'scale-0'
          )}
        >
          {cfg.emoji}
        </div>
        <div
          className={cn(
            'text-5xl font-black tracking-tight transition-all duration-300',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          )}
        >
          {cfg.label}
        </div>
      </div>
    </div>
  )
}

export { type EventType }
