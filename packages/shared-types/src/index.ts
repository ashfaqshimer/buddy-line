/**
 * Shared contracts between the API (apps/api) and web client (apps/web).
 * Keep this package framework-agnostic: types, enums, and zod schemas only.
 */

// ---------------------------------------------------------------------------
// API response envelope (SPEC §14.2 / §15.1)
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Domain enums (mirror prisma/schema.prisma)
// ---------------------------------------------------------------------------

export type ConversationType = "direct" | "group";
export type MessageType = "text" | "image";

// ---------------------------------------------------------------------------
// Domain DTOs (what the API returns — never the raw DB row)
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  lastSeenAt: string | null; // ISO 8601
}

export interface ConversationDTO {
  id: string;
  type: ConversationType;
  participants: PublicUser[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Socket.IO event contracts (SPEC §11.2)
// ---------------------------------------------------------------------------

export interface ClientToServerEvents {
  "message:send": (
    payload: { conversationId: string; content: string; messageType?: MessageType },
    ack?: (res: ApiResponse<MessageDTO>) => void
  ) => void;
  "message:read": (payload: { conversationId: string; messageId: string }) => void;
  "typing:start": (payload: { conversationId: string }) => void;
  "typing:stop": (payload: { conversationId: string }) => void;
  "presence:update": (payload: { status: PresenceStatus }) => void;
}

export interface ServerToClientEvents {
  "message:new": (message: MessageDTO) => void;
  "message:delivered": (payload: { messageId: string; conversationId: string }) => void;
  "message:read": (payload: { messageId: string; conversationId: string; userId: string }) => void;
  "typing:update": (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  "presence:update": (payload: { userId: string; status: PresenceStatus; lastSeenAt: string | null }) => void;
}

export type PresenceStatus = "online" | "offline";

// Room name helpers (SPEC §11.3)
export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;
export const userRoom = (userId: string): string => `user:${userId}`;
