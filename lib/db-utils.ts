import { createClient } from '@/lib/supabase/client'

export async function getTeams(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }
  return data || []
}

export async function getTeamPlayers(teamId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching players:', error)
    return []
  }
  return data || []
}

export async function getTeamGames(teamId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('team_id', teamId)
    .order('game_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching games:', error)
    return []
  }
  return data || []
}

export async function getGameStats(gameId: string) {
  const supabase = createClient()
  
  const [atBatsData, defensiveData, playerStatsData, pitcherStatsData] = await Promise.all([
    supabase
      .from('at_bats')
      .select('*')
      .eq('game_id', gameId),
    supabase
      .from('defensive_plays')
      .select('*')
      .eq('game_id', gameId),
    supabase
      .from('player_game_stats')
      .select('*')
      .eq('game_id', gameId),
    supabase
      .from('pitcher_game_stats')
      .select('*')
      .eq('game_id', gameId),
  ])

  return {
    atBats: atBatsData.data || [],
    defensivePlays: defensiveData.data || [],
    playerStats: playerStatsData.data || [],
    pitcherStats: pitcherStatsData.data || [],
  }
}

export async function createTeam(userId: string, teamData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teams')
    .insert({
      ...teamData,
      user_id: userId,
    })
    .select()
  
  if (error) {
    console.error('Error creating team:', error)
    throw error
  }
  return data?.[0]
}

export async function createPlayer(teamId: string, playerData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .insert({
      ...playerData,
      team_id: teamId,
    })
    .select()
  
  if (error) {
    console.error('Error creating player:', error)
    throw error
  }
  return data?.[0]
}

export async function createGame(teamId: string, gameData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games')
    .insert({
      ...gameData,
      team_id: teamId,
    })
    .select()
  
  if (error) {
    console.error('Error creating game:', error)
    throw error
  }
  return data?.[0]
}

export async function recordAtBat(gameId: string, atBatData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('at_bats')
    .insert({
      ...atBatData,
      game_id: gameId,
    })
    .select()
  
  if (error) {
    console.error('Error recording at bat:', error)
    throw error
  }
  return data?.[0]
}

export async function recordPitch(atBatId: string, pitchData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pitches')
    .insert({
      ...pitchData,
      at_bat_id: atBatId,
    })
    .select()
  
  if (error) {
    console.error('Error recording pitch:', error)
    throw error
  }
  return data?.[0]
}

export async function updatePlayerGameStats(gameId: string, playerId: string, stats: any) {
  const supabase = createClient()
  
  // First check if stats exist
  const { data: existing } = await supabase
    .from('player_game_stats')
    .select('id')
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('player_game_stats')
      .update(stats)
      .eq('game_id', gameId)
      .eq('player_id', playerId)
    
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('player_game_stats')
      .insert({
        game_id: gameId,
        player_id: playerId,
        ...stats,
      })
    
    if (error) throw error
  }
}

export async function getPlayerGameStats(playerId: string, teamId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('player_game_stats')
    .select('*')
    .eq('player_id', playerId)
  
  if (teamId) {
    // Join with games to filter by team
    query = supabase
      .from('player_game_stats')
      .select('*')
      .eq('player_id', playerId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching player game stats:', error)
    return {}
  }

  // Aggregate stats across all games
  if (!data || data.length === 0) return {}

  return {
    at_bats: data.reduce((sum, s) => sum + (s.at_bats || 0), 0),
    hits: data.reduce((sum, s) => sum + (s.hits || 0), 0),
    runs: data.reduce((sum, s) => sum + (s.runs || 0), 0),
    rbis: data.reduce((sum, s) => sum + (s.rbis || 0), 0),
    walks: data.reduce((sum, s) => sum + (s.walks || 0), 0),
    strikeouts: data.reduce((sum, s) => sum + (s.strikeouts || 0), 0),
    home_runs: data.reduce((sum, s) => sum + (s.home_runs || 0), 0),
    doubles: data.reduce((sum, s) => sum + (s.doubles || 0), 0),
    triples: data.reduce((sum, s) => sum + (s.triples || 0), 0),
    errors: data.reduce((sum, s) => sum + (s.errors || 0), 0),
    stolen_bases: data.reduce((sum, s) => sum + (s.stolen_bases || 0), 0),
    games_played: data.length,
  }
}
