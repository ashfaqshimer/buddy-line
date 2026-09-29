export type Phase = 'lobby' | 'playing' | 'voting' | 'reveal'
export type Alignment = 'Loyal' | 'Replicant'
export type Role = 'Engineer' | 'Navigator' | 'Security' | 'Scientist' | 'Captain'
export type Deduction = 'Unknown' | 'Safe' | 'Suspicious' | 'Replicant'

export type Player = { id: string; name: string; avatar: string; isBot: boolean; role: Role; alignment: Alignment; online: boolean }
export type Message = { id: string; playerId: string; text: string; timestamp: string; isBot?: boolean }
export type MatchSettings = { botCount: number; replicantCount: number; turnLimit: number }
export type GameState = { phase: Phase; roomCode: string; settings: MatchSettings; players: Player[]; messages: Message[]; turnIndex: number; round: number; roleRevealed: boolean; deductions: Record<string, Deduction>; notes: Record<string, string>; selectedEjection?: string; ejectedPlayer?: string }

export const players: Player[] = [
  { id: 'you', name: 'You', avatar: 'YO', isBot: false, role: 'Engineer', alignment: 'Loyal', online: true },
  { id: 'guest', name: 'Mara Voss', avatar: 'MV', isBot: false, role: 'Scientist', alignment: 'Loyal', online: true },
  { id: 'bot-1', name: 'Bot-1', avatar: 'B1', isBot: true, role: 'Navigator', alignment: 'Replicant', online: true },
  { id: 'bot-2', name: 'Bot-2', avatar: 'B2', isBot: true, role: 'Security', alignment: 'Loyal', online: true },
  { id: 'bot-3', name: 'Bot-3', avatar: 'B3', isBot: true, role: 'Captain', alignment: 'Loyal', online: true },
]

export const initialState: GameState = {
  phase: 'lobby', roomCode: '#SPACE-8492', settings: { botCount: 3, replicantCount: 1, turnLimit: 8 }, players, messages: [], turnIndex: 0, round: 1, roleRevealed: false, deductions: {}, notes: {},
}

export const openingMessages: Message[] = [
  { id: 'm1', playerId: 'bot-3', text: 'All stations report in. Keep your eyes open — the reactor logs show an unexplained fluctuation.', timestamp: '09:41', isBot: true },
  { id: 'm2', playerId: 'guest', text: 'I was in the hydroponics bay. The oxygen readings dipped right after.', timestamp: '09:42' },
  { id: 'm3', playerId: 'bot-2', text: 'That is a convenient timeline, Mara. Did anyone else see you there?', timestamp: '09:42', isBot: true },
]

export const botPrompts: Record<string, string> = { 'bot-1': 'You are evasive but analytical. Deflect suspicion and subtly question the Engineer.', 'bot-2': 'You are protective Security. Speak briefly and prioritize evidence over hunches.', 'bot-3': 'You are the measured Captain. Keep the crew focused and ask for concise timelines.' }

export function createInitialState(): GameState { return { ...initialState, messages: openingMessages, deductions: Object.fromEntries(players.map((p) => [p.id, 'Unknown'])) as Record<string, Deduction> } }

export function gameReducer(state: GameState, action: { type: 'launch' | 'reveal-role' | 'set-deduction'; playerId?: string; value?: Deduction }): GameState {
  if (action.type === 'launch') return { ...state, phase: 'playing', messages: openingMessages }
  if (action.type === 'reveal-role') return { ...state, roleRevealed: !state.roleRevealed }
  if (action.type === 'set-deduction' && action.playerId && action.value) return { ...state, deductions: { ...state.deductions, [action.playerId]: action.value } }
  return state
}

export function getPlayer(id: string) { return players.find((p) => p.id === id) ?? players[0] }
export function getNextBot(turnIndex: number) { return players[(turnIndex + 1) % players.length] }

export type GameAction = ReturnType<typeof gameReducer>

export const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const statusCopy = { lobby: 'Briefing room', playing: 'Mission in progress', voting: 'Emergency meeting', reveal: 'Mission report' } as const

export function addMessage(state: GameState, message: Message): GameState { return { ...state, messages: [...state.messages, message], turnIndex: state.turnIndex + 1 } }

export const initialDeductions = Object.fromEntries(players.map((p) => [p.id, 'Unknown'])) as Record<string, Deduction>

export function makeMessage(playerId: string, text: string): Message { return { id: `m-${Date.now()}`, playerId, text, timestamp: formatTime(), isBot: getPlayer(playerId).isBot } }
