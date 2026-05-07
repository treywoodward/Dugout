import { gateway } from 'ai'
import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { teamName, teamStats, playerStats, opponentHistory, context } = await req.json()

  const playerSummary = playerStats
    ?.map((p: any) => {
      const avg = p.at_bats > 0 ? (p.hits / p.at_bats).toFixed(3) : '.000'
      const obp =
        p.at_bats + p.walks + (p.hbp || 0) > 0
          ? ((p.hits + p.walks + (p.hbp || 0)) / (p.at_bats + p.walks + (p.hbp || 0))).toFixed(3)
          : '.000'
      return `${p.name} (#${p.jersey_number || '?'}): ${p.at_bats} AB, ${p.hits} H, AVG ${avg}, OBP ${obp}, ${p.rbis} RBI, ${p.strikeouts} K, ${p.walks} BB, ${p.home_runs} HR`
    })
    .join('\n')

  const opponentSummary =
    opponentHistory?.length > 0
      ? opponentHistory
          .map(
            (g: any) =>
              `vs ${g.opponent_name} (${g.game_date}): ${g.final_score_us}-${g.final_score_them} ${g.final_score_us > g.final_score_them ? 'W' : 'L'}`
          )
          .join('\n')
      : 'No prior matchup history'

  const prompt = `You are an experienced baseball coach and analyst helping with the team "${teamName}".

Team record: ${teamStats?.wins || 0}W-${teamStats?.losses || 0}L, averaging ${teamStats?.runsPerGame || '0'} runs/game.

Player statistics:
${playerSummary || 'No player stats available'}

Opponent/matchup history:
${opponentSummary}

${context ? `Additional context: ${context}` : ''}

Provide 3-5 specific, actionable coaching insights. Focus on:
1. Batting order recommendations (who should bat where and why, based on OBP/power)
2. Players showing concerning trends or opportunities for improvement
3. Matchup-specific strategy if opponent history exists
4. Any standout performers to leverage
5. One concrete adjustment for the next game

Be direct, specific, and data-driven. Reference actual player names and stats. Keep each insight to 2-3 sentences. Format with numbered points.`

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    prompt,
    maxTokens: 800,
  })

  return result.toTextStreamResponse()
}
