'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiInsightsProps {
  teamName: string
  teamStats: any
  playerStats: any[]
  opponentHistory: any[]
}

export function AiInsights({ teamName, teamStats, playerStats, opponentHistory }: AiInsightsProps) {
  const [insights, setInsights] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [error, setError] = useState('')

  const fetchInsights = async () => {
    setLoading(true)
    setInsights('')
    setError('')

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, teamStats, playerStats, opponentHistory, context }),
      })

      if (!res.ok) throw new Error('Failed to fetch insights')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setInsights(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e) {
      setError('Could not load AI insights. Check that ANTHROPIC_API_KEY is set.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI Coaching Insights</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
          {insights && !loading && (
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchInsights}
              className="h-8 gap-1 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowContext(v => !v)}
        >
          {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Add context for the AI (optional)
        </button>

        {showContext && (
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="e.g. Playing against a lefty pitcher this weekend, need to optimize the lineup..."
            className="text-sm min-h-[80px] resize-none"
          />
        )}

        {!insights && !loading && !error && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-blue-200 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered coaching insights based on your team&apos;s stats and history
            </p>
            <Button onClick={fetchInsights} className="bg-blue-600 hover:bg-blue-700">
              <Brain className="w-4 h-4 mr-2" />
              Generate Insights
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your team data...
            </div>
            {insights && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                {insights}
                <span className="inline-block w-1 h-4 bg-blue-600 animate-pulse ml-0.5 align-middle" />
              </div>
            )}
          </div>
        )}

        {!loading && insights && (
          <div className="space-y-1">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{insights}</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
