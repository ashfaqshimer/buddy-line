export type Phase = 'lobby' | 'playing' | 'voting' | 'reveal';
export type Alignment = 'Loyal' | 'Replicant';
export type Role = 'Engineer' | 'Navigator' | 'Medic' | 'Security' | 'Scientist' | 'Captain';
export type Deduction = 'Safe' | 'Suspicious' | 'Replicant' | 'Unknown';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  role: Role;
  alignment: Alignment;
  color: string;
  isAlive: boolean;
  systemPrompt?: string;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  text: string;
  timestamp: string;
  isBot?: boolean;
  systemPrompt?: string;
  modelPayload?: {
    model: string;
    tokens: number;
    latencyMs: number;
  };
}

export interface MatchSettings {
  botCount: number;
  replicantCount: number;
  turnLimit: number;
}

export interface GameState {
  phase: Phase;
  roomCode: string;
  settings: MatchSettings;
  players: Player[];
  messages: Message[];
  turnIndex: number;
  round: number;
  activeSpeakerId: string;
  waitingForSpeakerName: string | null;
  isProcessingTurn: boolean;
  roleRevealed: boolean;
  deductions: Record<string, Deduction>;
  notes: Record<string, string>;
  selectedEjectionId: string | null;
  ejectedPlayer: Player | null;
  shipStatus: {
    oxygen: number;
    reactor: number;
  };
  lastApiPayload: {
    model: string;
    turn: number;
    tokens: number;
    latencyMs: number;
    timestamp: string;
  } | null;
}

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-you',
    name: 'Commander Vale',
    avatar: 'CV',
    isBot: false,
    role: 'Engineer',
    alignment: 'Loyal',
    color: 'bg-cyan-400 text-slate-950',
    isAlive: true,
  },
  {
    id: 'bot-alpha',
    name: 'Crewmate Alpha',
    avatar: 'CA',
    isBot: true,
    role: 'Navigator',
    alignment: 'Replicant',
    color: 'bg-violet-400 text-slate-950',
    isAlive: true,
    systemPrompt:
      'Persona: Evasive, analytical Navigator. Deflect suspicion gently onto the Engineer or Security, feign deep concern for ship trajectory.',
  },
  {
    id: 'bot-beta',
    name: 'Crewmate Beta',
    avatar: 'CB',
    isBot: true,
    role: 'Medic',
    alignment: 'Loyal',
    color: 'bg-emerald-400 text-slate-950',
    isAlive: true,
    systemPrompt:
      'Persona: Observant Medic. Check vitals, monitor bio-signatures, and point out anomalies in corridors.',
  },
  {
    id: 'bot-gamma',
    name: 'Crewmate Gamma',
    avatar: 'CG',
    isBot: true,
    role: 'Security',
    alignment: 'Loyal',
    color: 'bg-amber-400 text-slate-950',
    isAlive: true,
    systemPrompt:
      'Persona: Tactical Security officer. Demand alibis, focus on timelines, and be suspicious of evasive answers.',
  },
  {
    id: 'bot-delta',
    name: 'Crewmate Delta',
    avatar: 'CD',
    isBot: true,
    role: 'Scientist',
    alignment: 'Loyal',
    color: 'bg-rose-400 text-slate-950',
    isAlive: true,
    systemPrompt:
      'Persona: Methodical Scientist. Query reactor core harmonics and ask precise questions about life support logs.',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-0',
    playerId: 'system',
    playerName: 'Station AI',
    playerColor: 'bg-slate-700 text-slate-200',
    text: 'Priority Alert: Subsystem failure detected in Deck C. Atmospheric seal compromise imminent.',
    timestamp: '09:41',
  },
  {
    id: 'msg-1',
    playerId: 'bot-beta',
    playerName: 'Crewmate Beta',
    playerColor: 'bg-emerald-400 text-slate-950',
    text: 'I was running diagnostic sweeps in Medbay when the pressure alarm triggered. Did anyone authorize a manual vent?',
    timestamp: '09:41',
    isBot: true,
    systemPrompt:
      'Persona: Observant Medic. Check vitals, monitor bio-signatures, and point out anomalies in corridors.',
  },
  {
    id: 'msg-2',
    playerId: 'bot-alpha',
    playerName: 'Crewmate Alpha',
    playerColor: 'bg-violet-400 text-slate-950',
    text: 'Nav logs show the thruster burst originated from manual engineering overrides. Commander Vale, were you at the terminal?',
    timestamp: '09:42',
    isBot: true,
    systemPrompt:
      'Persona: Evasive, analytical Navigator. Deflect suspicion gently onto the Engineer or Security, feign deep concern for ship trajectory.',
  },
];

export function createInitialGameState(): GameState {
  const deductions: Record<string, Deduction> = {};
  const notes: Record<string, string> = {};

  INITIAL_PLAYERS.forEach((p) => {
    deductions[p.id] = 'Unknown';
    notes[p.id] = '';
  });

  return {
    phase: 'lobby',
    roomCode: '#SPACE-8492',
    settings: {
      botCount: 4,
      replicantCount: 1,
      turnLimit: 8,
    },
    players: INITIAL_PLAYERS,
    messages: INITIAL_MESSAGES,
    turnIndex: 1,
    round: 1,
    activeSpeakerId: 'player-you',
    waitingForSpeakerName: null,
    isProcessingTurn: false,
    roleRevealed: false,
    deductions,
    notes,
    selectedEjectionId: null,
    ejectedPlayer: null,
    shipStatus: {
      oxygen: 84,
      reactor: 78,
    },
    lastApiPayload: {
      model: 'gemini-1.5-flash-sim',
      turn: 1,
      tokens: 214,
      latencyMs: 1980,
      timestamp: '09:42:15',
    },
  };
}

export type GameAction =
  | { type: 'UPDATE_SETTINGS'; settings: Partial<MatchSettings> }
  | { type: 'LAUNCH_MISSION' }
  | { type: 'TOGGLE_ROLE_REVEAL' }
  | { type: 'SET_DEDUCTION'; playerId: string; deduction: Deduction }
  | { type: 'SET_NOTE'; playerId: string; note: string }
  | { type: 'USER_SUBMIT_MESSAGE'; message: Message; nextSpeaker: Player }
  | { type: 'BOT_START_THINKING'; botName: string }
  | {
      type: 'BOT_FINISH_MESSAGE';
      message: Message;
      nextSpeakerId: string;
      newTurnIndex: number;
      shouldTriggerVoting: boolean;
      apiPayload: {
        model: string;
        turn: number;
        tokens: number;
        latencyMs: number;
        timestamp: string;
      };
      oxygenDecay: number;
      reactorDecay: number;
    }
  | { type: 'START_VOTING' }
  | { type: 'SELECT_EJECTION'; playerId: string }
  | { type: 'CONFIRM_EJECTION' }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET_TO_LOBBY' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      };

    case 'LAUNCH_MISSION':
      return {
        ...state,
        phase: 'playing',
        turnIndex: 1,
        activeSpeakerId: 'player-you',
        waitingForSpeakerName: null,
        isProcessingTurn: false,
        roleRevealed: false,
        shipStatus: { oxygen: 92, reactor: 88 },
      };

    case 'TOGGLE_ROLE_REVEAL':
      return {
        ...state,
        roleRevealed: !state.roleRevealed,
      };

    case 'SET_DEDUCTION':
      return {
        ...state,
        deductions: {
          ...state.deductions,
          [action.playerId]: action.deduction,
        },
      };

    case 'SET_NOTE':
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.playerId]: action.note,
        },
      };

    case 'USER_SUBMIT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        isProcessingTurn: true,
        waitingForSpeakerName: action.nextSpeaker.name,
        activeSpeakerId: action.nextSpeaker.id,
      };

    case 'BOT_START_THINKING':
      return {
        ...state,
        waitingForSpeakerName: action.botName,
        isProcessingTurn: true,
      };

    case 'BOT_FINISH_MESSAGE': {
      const isVotingTriggered = action.shouldTriggerVoting;
      return {
        ...state,
        messages: [...state.messages, action.message],
        turnIndex: action.newTurnIndex,
        activeSpeakerId: isVotingTriggered ? '' : action.nextSpeakerId,
        waitingForSpeakerName: null,
        isProcessingTurn: false,
        phase: isVotingTriggered ? 'voting' : state.phase,
        lastApiPayload: action.apiPayload,
        shipStatus: {
          oxygen: Math.max(15, state.shipStatus.oxygen - action.oxygenDecay),
          reactor: Math.max(12, state.shipStatus.reactor - action.reactorDecay),
        },
      };
    }

    case 'START_VOTING':
      return {
        ...state,
        phase: 'voting',
        selectedEjectionId: null,
      };

    case 'SELECT_EJECTION':
      return {
        ...state,
        selectedEjectionId: action.playerId,
      };

    case 'CONFIRM_EJECTION': {
      if (!state.selectedEjectionId) return state;
      const ejected = state.players.find((p) => p.id === state.selectedEjectionId) || null;
      const updatedPlayers = state.players.map((p) =>
        p.id === state.selectedEjectionId ? { ...p, isAlive: false } : p
      );
      return {
        ...state,
        phase: 'reveal',
        ejectedPlayer: ejected,
        players: updatedPlayers,
      };
    }

    case 'NEXT_ROUND': {
      const surviving = state.players.filter((p) => p.isAlive);
      const nextSpeaker = surviving.find((p) => !p.isBot) || surviving[0];
      return {
        ...state,
        phase: 'playing',
        round: state.round + 1,
        turnIndex: 1,
        selectedEjectionId: null,
        ejectedPlayer: null,
        activeSpeakerId: nextSpeaker ? nextSpeaker.id : 'player-you',
        waitingForSpeakerName: null,
        isProcessingTurn: false,
        messages: [
          ...state.messages,
          {
            id: `sys-round-${Date.now()}`,
            playerId: 'system',
            playerName: 'Station AI',
            playerColor: 'bg-slate-700 text-slate-200',
            text: `Cycle #${state.round + 1} initiated. Atmospheric purge completed. Life support remains compromised.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
    }

    case 'RESET_TO_LOBBY':
      return createInitialGameState();

    default:
      return state;
  }
}
