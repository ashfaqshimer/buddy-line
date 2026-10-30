'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getFriendsAndRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  cancelFriendRequest,
  searchPlayers,
  getSuggestedPlayers,
  getConversation,
  sendPrivateMessage,
  getChatNotificationSummary,
  FriendSummary,
  FriendRequestItem,
  PrivateMessageRecord,
  PlayerProfile,
  ChatNotificationSummary,
} from '@/lib/chat-db';

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function getFriendsAndRequestsAction(): Promise<{
  success: boolean;
  friends?: FriendSummary[];
  incomingRequests?: FriendRequestItem[];
  outgoingRequests?: FriendRequestItem[];
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to access friends and chats.' };
    }

    const data = await getFriendsAndRequests(user.id);
    return {
      success: true,
      ...data,
    };
  } catch (err: unknown) {
    console.error('Failed to get friends and requests:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not fetch friends list.',
    };
  }
}

export async function sendFriendRequestAction(targetUsernameOrId: string): Promise<{
  success: boolean;
  status?: 'pending' | 'accepted';
  message?: string;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to add friends.' };
    }

    return await sendFriendRequest(user.id, targetUsernameOrId);
  } catch (err: unknown) {
    console.error('Failed to send friend request:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send friend request.',
    };
  }
}

export async function respondToFriendRequestAction(
  friendshipId: string,
  action: 'accept' | 'decline'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    return await respondToFriendRequest(friendshipId, user.id, action);
  } catch (err: unknown) {
    console.error('Failed to respond to friend request:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to respond to friend request.',
    };
  }
}

export async function removeFriendAction(friendId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    return await removeFriend(user.id, friendId);
  } catch (err: unknown) {
    console.error('Failed to remove friend:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove friend.',
    };
  }
}

export async function cancelFriendRequestAction(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    return await cancelFriendRequest(user.id, targetUserId);
  } catch (err: unknown) {
    console.error('Failed to cancel friend request:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel friend request.',
    };
  }
}

export async function searchPlayersAction(
  query: string
): Promise<{
  success: boolean;
  players?: Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const players = await searchPlayers(user.id, query);
    return { success: true, players };
  } catch (err: unknown) {
    console.error('Failed to search players:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to search players.',
    };
  }
}

export async function getSuggestedPlayersAction(): Promise<{
  success: boolean;
  players?: Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const players = await getSuggestedPlayers(user.id);
    return { success: true, players };
  } catch (err: unknown) {
    console.error('Failed to fetch suggested players:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch suggested players.',
    };
  }
}

export async function getConversationAction(
  friendId: string
): Promise<{
  success: boolean;
  messages?: PrivateMessageRecord[];
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    return await getConversation(user.id, friendId);
  } catch (err: unknown) {
    console.error('Failed to fetch conversation:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch conversation.',
    };
  }
}

export async function sendPrivateMessageAction(
  friendId: string,
  content: string
): Promise<{
  success: boolean;
  message?: PrivateMessageRecord;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    return await sendPrivateMessage(user.id, friendId, content);
  } catch (err: unknown) {
    console.error('Failed to send private message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send message.',
    };
  }
}

export async function getChatNotificationSummaryAction(): Promise<{
  success: boolean;
  summary?: ChatNotificationSummary;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: true,
        summary: {
          totalUnreadMessages: 0,
          unreadBySender: {},
          incomingRequestsCount: 0,
        },
      };
    }

    const summary = await getChatNotificationSummary(user.id);
    return { success: true, summary };
  } catch (err: unknown) {
    console.error('Failed to get chat notification summary:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get notification summary.',
    };
  }
}
