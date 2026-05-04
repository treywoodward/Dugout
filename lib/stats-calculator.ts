export function calculateBattingStats(stats: any) {
  const avg = stats.at_bats > 0 ? (stats.hits / stats.at_bats).toFixed(3) : '.000'
  const onBaseHits = stats.hits + stats.walks + stats.hbp
  const obp = (stats.at_bats + stats.walks + stats.hbp) > 0 
    ? (onBaseHits / (stats.at_bats + stats.walks + stats.hbp)).toFixed(3) 
    : '.000'
  const totalBases = stats.hits + stats.doubles + (stats.triples * 2) + (stats.home_runs * 3)
  const slg = stats.at_bats > 0 ? (totalBases / stats.at_bats).toFixed(3) : '.000'
  const ops = parseFloat(obp as string) + parseFloat(slg as string)

  return {
    avg,
    obp,
    slg,
    ops: ops.toFixed(3),
    strikeoutRate: stats.at_bats > 0 ? ((stats.strikeouts / stats.at_bats) * 100).toFixed(1) : '0.0',
  }
}

export function calculatePitchingStats(stats: any) {
  const innings = stats.innings_pitched || 0
  const era = innings > 0 ? ((stats.earned_runs / innings) * 9).toFixed(2) : '0.00'
  const whip = innings > 0 ? (((stats.hits_allowed + stats.walks) / innings)).toFixed(2) : '0.00'
  const kPer9 = innings > 0 ? ((stats.strikeouts / innings) * 9).toFixed(2) : '0.00'
  const strikePercentage = stats.pitches_thrown > 0 
    ? ((stats.strikes / stats.pitches_thrown) * 100).toFixed(1) 
    : '0.0'

  return {
    era,
    whip,
    kPer9,
    strikePercentage,
    recordString: stats.wins && stats.losses ? `${stats.wins}-${stats.losses}` : '0-0',
  }
}

export function calculateTeamStats(games: any[], players: any[]) {
  let wins = 0
  let losses = 0
  let totalRuns = 0
  let totalHits = 0

  games.forEach(game => {
    if (game.status === 'completed') {
      if (game.final_score_us > game.final_score_them) wins++
      else if (game.final_score_us < game.final_score_them) losses++
      totalRuns += game.final_score_us || 0
      totalHits += game.total_hits || 0
    }
  })

  const gamesPlayed = wins + losses
  const winPercentage = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0'

  return {
    wins,
    losses,
    gamesPlayed,
    winPercentage,
    runsPerGame: gamesPlayed > 0 ? (totalRuns / gamesPlayed).toFixed(2) : '0.00',
  }
}

export function formatStatistic(value: string | number, format: 'avg' | 'percentage' | 'era' | 'number' = 'number') {
  switch (format) {
    case 'avg':
      return String(value)
    case 'percentage':
      return `${value}%`
    case 'era':
      return `${value}`
    case 'number':
    default:
      return String(value)
  }
}
