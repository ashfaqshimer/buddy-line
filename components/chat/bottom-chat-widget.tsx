'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  UserPlus,
  UserMinus,
  Check,
  CheckCheck,
  Search,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { UserAvatar } from '@/components/user-avatar';
import {
  FriendSummary,
  FriendRequestItem,
  PrivateMessageRecord,
  PlayerProfile,
} from '@/lib/chat-db';
import {
  getFriendsAndRequestsAction,
  sendFriendRequestAction,
  respondToFriendRequestAction,
  removeFriendAction,
  cancelFriendRequestAction,
  getSuggestedPlayersAction,
  getPlayerProfileAction,
  getConversationAction,
  sendPrivateMessageAction,
} from '@/app/chat-actions';
import { AuthModal } from '@/components/auth-modal';

interface BottomChatWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  targetFriendId?: string | null;
  onClearTarget?: () => void;
  /** Shared unread + request count from the app shell (used for the collapsed bar badge). */
  notificationCount?: number;
  /** Ask the app shell to refresh its shared notification count (after reading / responding). */
  onNotificationsChanged?: () => void;
}

type TabType = 'friends' | 'requests' | 'add';
type PlayerWithRelationship = PlayerProfile & {
  relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend';
};

const QUICK_REACTIONS = ['GG! 🎮', 'Ready to play? 🚀', 'Nice score! 🏆', '🕹️', '🔥', '👾'];

const CONVERSATION_POLL_MS = 3000;
const FRIENDS_POLL_MS = 10000;
const NEAR_BOTTOM_PX = 80;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
/** Consecutive messages from the same sender within this window are grouped together. */
const GROUP_GAP_MS = 5 * MINUTE_MS;
const INPUT_MAX_HEIGHT_PX = 120;

// ── Date helpers ────────────────────────────────────────────────────────────
function startOfDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/** Whole calendar days between two dates (a - b). */
function calendarDayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(a) - startOfDay(b)) / DAY_MS);
}

function isSameDay(a: string, b: string): boolean {
  return calendarDayDiff(new Date(a), new Date(b)) === 0;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(date: Date, now: Date): string {
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

/** Separator label inside a conversation: Today, Yesterday, Monday, 12 Nov. */
function formatDayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diff = calendarDayDiff(now, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return formatShortDate(date, now);
}

/** Compact time for the friends list: now, 5m, 14:32, Yesterday, Mon, 12 Nov. */
function formatListTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE_MS) return 'now';
  if (elapsed < 60 * MINUTE_MS) return `${Math.floor(elapsed / MINUTE_MS)}m`;
  const diff = calendarDayDiff(now, date);
  if (diff === 0) return formatTime(iso);
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return formatShortDate(date, now);
}

function isGroupedWith(a: PrivateMessageRecord | undefined, b: PrivateMessageRecord | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.senderId === b.senderId &&
    isSameDay(a.createdAt, b.createdAt) &&
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_GAP_MS
  );
}

export function BottomChatWidget({
  isOpen,
  onToggle,
  targetFriendId,
  onClearTarget,
  notificationCount,
  onNotificationsChanged,
}: BottomChatWidgetProps) {
  const { session, isLoggedIn } = useAuth();
  const currentUserId = session?.user?.id;

  // View & sizing state
  const [isExpanded, setIsExpanded] = useState(false); // full screen / wide mode toggle
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [selectedFriend, setSelectedFriend] = useState<FriendSummary | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Friends & Requests data
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Suggestions & targeted player (e.g. "message creator" from a game card)
  const [suggestedPlayers, setSuggestedPlayers] = useState<PlayerWithRelationship[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<PlayerWithRelationship | null>(null);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Conversation data
  const [messages, setMessages] = useState<PrivateMessageRecord[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  // Optimistic messages whose send failed (kept in the feed with Retry / Delete)
  const [failedMessageIds, setFailedMessageIds] = useState<Set<string>>(() => new Set());
  // First message that was unread when the conversation was opened ("New" divider)
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const [isConversationMenuOpen, setIsConversationMenuOpen] = useState(false);

  // Confirm friend removal
  const [friendToRemove, setFriendToRemove] = useState<FriendSummary | null>(null);
  const [isRemovingFriend, setIsRemovingFriend] = useState(false);

  // Friends filter
  const [friendsFilter, setFriendsFilter] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectedFriendIdRef = useRef<string | null>(null);
  // Unread count of the conversation at the moment it was opened
  const unreadOnOpenRef = useRef(0);
  // Local ids for optimistic messages
  const tempMessageSeqRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const lastRenderedMessageIdRef = useRef<string | null>(null);
  const lastServerMessageIdRef = useRef<string | null>(null);
  // Bumped whenever conversation state changes locally (friend switch, message sent) so
  // responses from requests started before that change are discarded instead of
  // overwriting newer state.
  const conversationSeqRef = useRef(0);
  const friendsSeqRef = useRef(0);

  /** Change the open conversation. Updates the ref synchronously so in-flight responses can be checked against it. */
  const selectFriend = useCallback((friend: FriendSummary | null) => {
    if (selectedFriendIdRef.current !== (friend?.id ?? null)) {
      conversationSeqRef.current++;
      lastRenderedMessageIdRef.current = null;
      lastServerMessageIdRef.current = null;
      isNearBottomRef.current = true;
      unreadOnOpenRef.current = friend?.unreadCount ?? 0;
      setMessages([]);
      setHasNewBelow(false);
      setConversationError(null);
      setFailedMessageIds(new Set());
      setFirstUnreadId(null);
      setIsConversationMenuOpen(false);
    }
    selectedFriendIdRef.current = friend?.id ?? null;
    setSelectedFriend(friend);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  }, []);

  const handleMessagesScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) setHasNewBelow(false);
  };

  // Fetch friends and requests (returns the fresh friends list, or null if discarded/failed)
  const loadFriendsData = useCallback(async (silent = false): Promise<FriendSummary[] | null> => {
    if (!currentUserId) return null;
    const seq = ++friendsSeqRef.current;
    if (!silent) setLoadingFriends(true);

    try {
      const res = await getFriendsAndRequestsAction();
      // A newer request was started meanwhile; its result wins
      if (seq !== friendsSeqRef.current) return null;
      if (!res.success) return null;

      const freshFriends = res.friends || [];
      setFriends(freshFriends);
      setIncomingRequests(res.incomingRequests || []);
      setOutgoingRequests(res.outgoingRequests || []);

      const activeId = selectedFriendIdRef.current;
      if (activeId) {
        const updated = freshFriends.find((f) => f.id === activeId);
        if (updated) {
          setSelectedFriend((prev) =>
            prev &&
            prev.id === updated.id &&
            prev.unreadCount === updated.unreadCount &&
            prev.username === updated.username &&
            prev.avatar === updated.avatar &&
            prev.lastMessage?.id === updated.lastMessage?.id
              ? prev
              : updated
          );
        }
      }
      return freshFriends;
    } catch (err) {
      console.error('Failed to load friends data:', err);
      return null;
    } finally {
      if (!silent && seq === friendsSeqRef.current) setLoadingFriends(false);
    }
  }, [currentUserId]);

  // Load conversation messages
  const loadConversation = useCallback(
    async (friendId: string, silent = false) => {
      if (!currentUserId) return;
      const seq = ++conversationSeqRef.current;
      if (!silent) setLoadingConversation(true);

      try {
        const res = await getConversationAction(friendId);
        // Discard responses for a different conversation, or ones overtaken by newer local changes
        if (seq !== conversationSeqRef.current || selectedFriendIdRef.current !== friendId) return;

        if (res.success && res.messages) {
          const serverMessages = res.messages;
          setConversationError(null);
          setMessages((prev) => {
            // Keep any pending optimistic messages that haven't been resolved yet
            const pendingOptimistic = prev.filter((m) => m.id.startsWith('temp-'));
            if (pendingOptimistic.length === 0) return serverMessages;
            const stillPending = pendingOptimistic.filter(
              (p) =>
                !serverMessages.some(
                  (s) =>
                    s.senderId === p.senderId &&
                    s.content === p.content &&
                    Math.abs(new Date(s.createdAt).getTime() - new Date(p.createdAt).getTime()) < 15000
                )
            );
            return [...serverMessages, ...stillPending];
          });

          // On the first load of a conversation, remember where the unread messages start
          if (!silent && unreadOnOpenRef.current > 0) {
            const incoming = serverMessages.filter((m) => m.senderId !== currentUserId);
            const anchor = incoming[Math.max(0, incoming.length - unreadOnOpenRef.current)];
            setFirstUnreadId(anchor?.id ?? null);
            unreadOnOpenRef.current = 0;
          }

          // Flag new incoming messages that arrived while the user is scrolled up
          const latest = serverMessages[serverMessages.length - 1];
          const previousLatestId = lastServerMessageIdRef.current;
          lastServerMessageIdRef.current = latest?.id ?? null;
          const hasNewIncoming =
            !!latest && previousLatestId !== null && latest.id !== previousLatestId && latest.senderId !== currentUserId;
          if (hasNewIncoming && !isNearBottomRef.current) setHasNewBelow(true);

          // Opening a conversation (or receiving new messages in it) marks messages read; refresh the shared badge
          if (!silent || hasNewIncoming) onNotificationsChanged?.();
        } else if (res.error) {
          setConversationError(res.error);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
        if (seq === conversationSeqRef.current) setConversationError('Could not load messages.');
      } finally {
        if (!silent && seq === conversationSeqRef.current) setLoadingConversation(false);
      }
    },
    [currentUserId, onNotificationsChanged]
  );

  // Keep the feed pinned to the bottom when a new message arrives and the user is already
  // at the bottom (or sent it themselves). DOM-only: no state updates here.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastRenderedMessageIdRef.current) return;
    const isFirstRender = lastRenderedMessageIdRef.current === null;
    lastRenderedMessageIdRef.current = last.id;
    if (isFirstRender || last.senderId === currentUserId || isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(!isFirstRender));
    }
  }, [messages, currentUserId, scrollToBottom]);

  // Initial load when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    loadFriendsData(true);
    getSuggestedPlayersAction().then((res) => {
      if (res.success && res.players) setSuggestedPlayers(res.players);
    });
  }, [isLoggedIn, loadFriendsData]);

  // Open the widget on a specific player (e.g. "message creator" on a game card)
  const openTargetPlayer = useCallback(
    async (target: string) => {
      const res = await getPlayerProfileAction(target);
      setTargetPlayer(null);
      setAddFriendStatus({ type: 'idle' });

      // Clicked on your own game: just show your friends list
      if (target === currentUserId || res.player?.id === currentUserId) {
        selectFriend(null);
        setActiveTab('friends');
        return;
      }

      if (!res.success || !res.player) {
        selectFriend(null);
        setActiveTab('add');
        setAddFriendStatus({ type: 'error', message: res.error || 'Player not found.' });
        return;
      }

      const player = res.player;
      if (player.relationship === 'friend') {
        const fresh = (await loadFriendsData(true)) ?? friends;
        const found = fresh.find((f) => f.id === player.id);
        if (found) {
          selectFriend(found);
          loadConversation(found.id);
          return;
        }
      }

      selectFriend(null);
      setTargetPlayer(player);
      setActiveTab('add');
    },
    [currentUserId, friends, loadConversation, loadFriendsData, selectFriend]
  );

  useEffect(() => {
    if (!targetFriendId) return;
    // The app shell opens the widget when it sets a target
    openTargetPlayer(targetFriendId);
    onClearTarget?.();
    // Only react to a new target; the callbacks change identity on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFriendId]);

  // Poll the open conversation. A setTimeout chain (not setInterval) so a new request only
  // starts after the previous one finished, which keeps responses in order.
  useEffect(() => {
    if (!isOpen || !selectedFriend?.id) return;
    const friendId = selectedFriend.id;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') await loadConversation(friendId, true);
      if (!cancelled) timer = setTimeout(tick, CONVERSATION_POLL_MS);
    };
    timer = setTimeout(tick, CONVERSATION_POLL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedFriend?.id, loadConversation]);

  // Poll friends, unread counts and requests whenever the widget is open (any view)
  useEffect(() => {
    if (!isOpen || !isLoggedIn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') await loadFriendsData(true);
      if (!cancelled) timer = setTimeout(tick, FRIENDS_POLL_MS);
    };
    timer = setTimeout(tick, FRIENDS_POLL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, isLoggedIn, loadFriendsData]);

  // Select a friend to chat
  const handleSelectFriend = (friend: FriendSummary) => {
    selectFriend(friend);
    loadConversation(friend.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Send message
  /** Grow the message box with its content, up to a few lines. */
  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT_PX)}px`;
  }, []);

  const setFailed = (id: string, failed: boolean) => {
    setFailedMessageIds((prev) => {
      if (prev.has(id) === failed) return prev;
      const next = new Set(prev);
      if (failed) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  /** Send (or resend) an optimistic message already shown in the feed under `tempId`. */
  const deliverMessage = async (friendId: string, text: string, tempId: string) => {
    setSendingMessage(true);
    setFailed(tempId, false);
    try {
      const res = await sendPrivateMessageAction(friendId, text);
      if (selectedFriendIdRef.current !== friendId) return; // user switched conversations

      if (res.success && res.message) {
        // Invalidate polls started before the server had this message
        conversationSeqRef.current++;
        const sent = res.message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev.filter((m) => m.id !== tempId);
          if (prev.some((m) => m.id === tempId)) return prev.map((m) => (m.id === tempId ? sent : m));
          return [...prev, sent];
        });
        loadFriendsData(true);
      } else {
        setFailed(tempId, true);
      }
    } catch {
      if (selectedFriendIdRef.current === friendId) setFailed(tempId, true);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFriend || !inputMessage.trim() || sendingMessage) return;

    const friendId = selectedFriend.id;
    const textToSend = inputMessage.trim();
    setInputMessage('');
    requestAnimationFrame(resizeInput);

    const tempId = `temp-${++tempMessageSeqRef.current}`;
    const optimisticMsg: PrivateMessageRecord = {
      id: tempId,
      senderId: currentUserId!,
      receiverId: friendId,
      content: textToSend,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    await deliverMessage(friendId, textToSend, tempId);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRetryMessage = (message: PrivateMessageRecord) => {
    if (!selectedFriend || sendingMessage) return;
    deliverMessage(selectedFriend.id, message.content, message.id);
  };

  const handleDiscardMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setFailed(messageId, false);
  };

  const fillQuickReply = (text: string) => {
    setInputMessage(text);
    inputRef.current?.focus();
    requestAnimationFrame(resizeInput);
  };

  // Add friend (or accept, if the other player already sent a request)
  const handleAddFriend = async (targetUsernameOrId: string) => {
    setAddFriendStatus({ type: 'loading' });
    try {
      const res = await sendFriendRequestAction(targetUsernameOrId);
      if (res.success) {
        const relationship: PlayerWithRelationship['relationship'] =
          res.status === 'accepted' ? 'friend' : 'pending_outgoing';
        const matches = (p: PlayerWithRelationship) =>
          p.id === targetUsernameOrId || p.username.toLowerCase() === targetUsernameOrId.toLowerCase();

        setAddFriendStatus({
          type: 'success',
          message: res.message || 'Friend request sent successfully!',
        });
        setAddFriendInput('');
        setSuggestedPlayers((prev) => prev.map((p) => (matches(p) ? { ...p, relationship } : p)));
        setTargetPlayer((prev) => (prev && matches(prev) ? { ...prev, relationship } : prev));
        await loadFriendsData(true);
        if (res.status === 'accepted') onNotificationsChanged?.();
      } else {
        setAddFriendStatus({
          type: 'error',
          message: res.error || 'Failed to send friend request.',
        });
      }
    } catch {
      setAddFriendStatus({
        type: 'error',
        message: 'An unexpected error occurred.',
      });
    }
  };

  // Jump from the targeted player card into the conversation once you're friends
  const handleMessageTargetPlayer = async () => {
    if (!targetPlayer) return;
    const fresh = (await loadFriendsData(true)) ?? friends;
    const found = fresh.find((f) => f.id === targetPlayer.id);
    if (found) {
      setTargetPlayer(null);
      handleSelectFriend(found);
    }
  };

  // Respond to incoming request
  const handleRespondRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    try {
      const res = await respondToFriendRequestAction(friendshipId, action);
      if (res.success) {
        await loadFriendsData();
        onNotificationsChanged?.();
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
    }
  };

  // Cancel outgoing request
  const handleCancelOutgoing = async (targetUserId: string) => {
    try {
      const res = await cancelFriendRequestAction(targetUserId);
      if (res.success) {
        await loadFriendsData();
        setSuggestedPlayers((prev) =>
          prev.map((p) => (p.id === targetUserId ? { ...p, relationship: 'none' } : p))
        );
        setTargetPlayer((prev) => (prev?.id === targetUserId ? { ...prev, relationship: 'none' } : prev));
      }
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  // Remove friend
  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    setIsRemovingFriend(true);
    try {
      const res = await removeFriendAction(friendToRemove.id);
      if (res.success) {
        if (selectedFriend?.id === friendToRemove.id) {
          selectFriend(null);
        }
        setFriendToRemove(null);
        await loadFriendsData();
      }
    } catch (err) {
      console.error('Failed to remove friend:', err);
    } finally {
      setIsRemovingFriend(false);
    }
  };

  // Derived notification counts
  const totalUnreadMessages = friends.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  const collapsedBadgeCount = notificationCount ?? totalUnreadMessages + incomingRequests.length;

  // Most recent conversation first; friends you haven't messaged go last, alphabetically
  const sortedFriends = [...friends].sort((a, b) => {
    const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta || a.username.localeCompare(b.username);
  });

  const filteredFriends = sortedFriends.filter((f) => {
    if (!friendsFilter.trim()) return true;
    const term = friendsFilter.toLowerCase();
    return f.username.toLowerCase().includes(term) || f.name.toLowerCase().includes(term);
  });

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'friends', label: 'Friends', count: totalUnreadMessages },
    { id: 'requests', label: 'Requests', count: incomingRequests.length },
    { id: 'add', label: 'Add', count: 0 },
  ];

  const roleBadge = (role?: string | null) =>
    role === 'admin' || role === 'root' ? (
      <span className="shrink-0 rounded border border-amber-400/30 px-1 py-px font-mono text-[10px] uppercase text-amber-300">
        {role}
      </span>
    ) : null;

  const outlineButton =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.05] disabled:opacity-50';
  const primaryButton =
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-teal-300 disabled:opacity-50';
  const sectionLabel = 'mb-2 block font-mono text-[11px] uppercase tracking-[0.1em] text-subtle-foreground';
  const iconButton =
    'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground';

  return (
    <>
      {/* Backdrop for mobile bottom sheet */}
      {isOpen && (
        <div
          onClick={() => onToggle(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 sm:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={
          isOpen
            ? 'fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-4 sm:right-6'
            : 'fixed bottom-0 right-3 z-40 sm:right-6'
        }
      >
        {!isOpen ? (
          /* Collapsed bar (desktop only; the mobile bottom nav has its own chat button) */
          <button
            onClick={() => {
              if (!isLoggedIn) {
                setIsAuthModalOpen(true);
              } else {
                onToggle(true);
                loadFriendsData();
              }
            }}
            className="hidden items-center gap-2.5 rounded-t-lg border-x border-t border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-raised sm:flex"
            title="Open messages"
          >
            <MessageSquare className="size-4 text-muted-foreground" />
            <span>Messages</span>
            {collapsedBadgeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                {collapsedBadgeCount > 9 ? '9+' : collapsedBadgeCount}
              </span>
            )}
            <ChevronUp className="size-3.5 text-subtle-foreground" />
          </button>
        ) : (
          /* Open window: bottom sheet on phones, floating panel on desktop */
          <div
            role="dialog"
            aria-label="Messages"
            className={cn(
              'flex flex-col overflow-hidden rounded-t-xl border-x border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-2xl shadow-black/60 sm:rounded-xl sm:border',
              isExpanded
                ? 'h-[88dvh] w-full sm:h-[88vh] sm:max-h-[720px] sm:w-[96vw] sm:max-w-3xl'
                : 'h-[82dvh] max-h-[85dvh] w-full sm:h-[540px] sm:max-h-[82vh] sm:w-[380px] md:w-[400px]'
            )}
          >
            {/* Mobile drag handle */}
            <div className="mx-auto my-1.5 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />

            {/* Title bar */}
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-2 sm:px-3">
              <div className="flex min-w-0 items-center gap-2">
                {selectedFriend ? (
                  <>
                    <button onClick={() => selectFriend(null)} className={iconButton} title="Back to friends" aria-label="Back to friends">
                      <ChevronLeft className="size-4" />
                    </button>
                    <UserAvatar
                      avatar={selectedFriend.avatar}
                      name={selectedFriend.username}
                      className="size-7 shrink-0 rounded-full bg-surface-raised text-xs font-semibold text-foreground"
                    />
                    <span className="truncate text-sm font-semibold text-foreground">{selectedFriend.username}</span>
                    {roleBadge(selectedFriend.role)}
                  </>
                ) : (
                  <h3 className="pl-2 text-sm font-semibold text-foreground">Messages</h3>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {selectedFriend && (
                  <div className="relative">
                    <button
                      onClick={() => setIsConversationMenuOpen((open) => !open)}
                      className={iconButton}
                      title="Conversation options"
                      aria-label="Conversation options"
                      aria-expanded={isConversationMenuOpen}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    {isConversationMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsConversationMenuOpen(false)} aria-hidden="true" />
                        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-2xl shadow-black/50">
                          <button
                            onClick={() => {
                              setIsConversationMenuOpen(false);
                              setFriendToRemove(selectedFriend);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
                          >
                            <UserMinus className="size-4" />
                            <span>Remove friend</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(iconButton, 'hidden sm:flex')}
                  title={isExpanded ? 'Make smaller' : 'Make larger'}
                  aria-label={isExpanded ? 'Make smaller' : 'Make larger'}
                >
                  {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                </button>

                <button onClick={() => onToggle(false)} className={iconButton} title="Close" aria-label="Close messages">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {!isLoggedIn ? (
              /* Signed out */
              <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 text-center">
                <MessageSquare className="mb-3 size-6 text-subtle-foreground" />
                <h4 className="text-sm font-semibold text-foreground">Sign in to send messages</h4>
                <p className="mb-5 mt-1 max-w-xs text-sm text-muted-foreground">
                  Add other players as friends and chat with them privately.
                </p>
                <button onClick={() => setIsAuthModalOpen(true)} className={primaryButton}>
                  Sign in
                </button>
              </div>
            ) : selectedFriend ? (
              /* ── Conversation ─────────────────────────────────────────── */
              <div className="flex flex-1 flex-col overflow-hidden bg-background">
                <div
                  ref={scrollContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto px-3 pb-3 sm:px-4"
                >
                  {loadingConversation && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading messages…</span>
                    </div>
                  ) : conversationError && messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                      <AlertCircle className="mb-2 size-5 text-rose-400" />
                      <p className="text-sm text-rose-300">{conversationError}</p>
                      <button onClick={() => loadConversation(selectedFriend.id)} className={cn(outlineButton, 'mt-4')}>
                        Try again
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                      <UserAvatar
                        avatar={selectedFriend.avatar}
                        name={selectedFriend.username}
                        className="mb-3 size-14 rounded-full bg-surface-raised text-2xl font-semibold text-foreground"
                      />
                      <h4 className="text-sm font-semibold text-foreground">Start a conversation with {selectedFriend.username}</h4>
                      <p className="mb-4 mt-1 max-w-xs text-sm text-muted-foreground">
                        Only the two of you can see these messages.
                      </p>
                      <div className="flex max-w-xs flex-wrap items-center justify-center gap-1.5">
                        {QUICK_REACTIONS.map((quick) => (
                          <button
                            key={quick}
                            onClick={() => fillQuickReply(quick)}
                            className="rounded-full border border-border-strong px-3 py-1 text-xs text-foreground transition hover:bg-white/[0.05]"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="pt-4 text-center font-mono text-[10px] text-subtle-foreground">
                        Only you and {selectedFriend.username} can see these messages.
                      </p>

                      {messages.map((msg, index) => {
                        const prev = messages[index - 1];
                        const next = messages[index + 1];
                        const isMine = msg.senderId === currentUserId;
                        const isPending = msg.id.startsWith('temp-');
                        const isFailed = failedMessageIds.has(msg.id);
                        const startsDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
                        const joinsPrev = isGroupedWith(prev, msg) && msg.id !== firstUnreadId;
                        const joinsNext = isGroupedWith(msg, next) && next?.id !== firstUnreadId;

                        return (
                          <React.Fragment key={msg.id}>
                            {startsDay && (
                              <div className="flex items-center gap-3 pb-1 pt-5" role="separator">
                                <span className="h-px flex-1 bg-border" />
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-subtle-foreground">
                                  {formatDayLabel(msg.createdAt)}
                                </span>
                                <span className="h-px flex-1 bg-border" />
                              </div>
                            )}

                            {msg.id === firstUnreadId && (
                              <div className="flex items-center gap-3 pb-1 pt-4" role="separator">
                                <span className="h-px flex-1 bg-primary/40" />
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">New</span>
                                <span className="h-px flex-1 bg-primary/40" />
                              </div>
                            )}

                            <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start', joinsPrev ? 'mt-0.5' : 'mt-3')}>
                              <div
                                className={cn(
                                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                                  isMine ? 'bg-zinc-100 text-zinc-950' : 'bg-surface-raised text-foreground',
                                  isMine
                                    ? cn(joinsPrev && 'rounded-tr-md', joinsNext && 'rounded-br-md')
                                    : cn(joinsPrev && 'rounded-tl-md', joinsNext && 'rounded-bl-md'),
                                  isPending && !isFailed && 'opacity-70',
                                  isFailed && 'opacity-80 ring-1 ring-rose-500/70'
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>

                              {isFailed ? (
                                <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-rose-300">
                                  <AlertCircle className="size-3" />
                                  <span>Not sent</span>
                                  <button
                                    onClick={() => handleRetryMessage(msg)}
                                    disabled={sendingMessage}
                                    className="font-medium underline underline-offset-2 hover:text-rose-200 disabled:opacity-50"
                                  >
                                    Retry
                                  </button>
                                  <button
                                    onClick={() => handleDiscardMessage(msg.id)}
                                    className="text-subtle-foreground hover:text-foreground"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                !joinsNext && (
                                  <div className="mt-1 flex items-center gap-1 px-1 font-mono text-[10px] text-subtle-foreground tabular-nums">
                                    <span>{isPending ? 'Sending…' : formatTime(msg.createdAt)}</span>
                                    {isMine && !isPending &&
                                      (msg.isRead ? (
                                        <CheckCheck className="size-3 text-primary" aria-label="Read" />
                                      ) : (
                                        <Check className="size-3" aria-label="Delivered" />
                                      ))}
                                  </div>
                                )
                              )}
                            </div>
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {conversationError && messages.length > 0 && (
                  <div className="shrink-0 border-t border-border bg-surface px-3 py-1.5 text-center text-[11px] text-muted-foreground">
                    Couldn&apos;t refresh messages. Trying again…
                  </div>
                )}

                {hasNewBelow && (
                  <div className="relative h-0">
                    <button
                      type="button"
                      onClick={() => {
                        setHasNewBelow(false);
                        scrollToBottom(true);
                      }}
                      className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border-strong bg-surface-raised px-3 py-1 text-xs font-medium text-foreground shadow-lg shadow-black/40 transition hover:bg-surface"
                    >
                      <span>New messages</span>
                      <ChevronDown className="size-3" />
                    </button>
                  </div>
                )}

                {/* Composer */}
                <form onSubmit={handleSendMessage} className="flex shrink-0 items-end gap-2 border-t border-border bg-surface p-2.5">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      resizeInput();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedFriend.username}`}
                    aria-label={`Message ${selectedFriend.username}`}
                    maxLength={2000}
                    className="max-h-[120px] min-h-10 flex-1 resize-none rounded-lg border border-border bg-surface-sunken px-3 py-2 text-base leading-snug text-foreground placeholder:text-subtle-foreground transition focus:border-border-strong focus:outline-none sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendingMessage}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-teal-300 active:scale-95 disabled:opacity-40"
                    aria-label="Send message"
                    title="Send (Enter). Shift+Enter for a new line"
                  >
                    {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </form>
              </div>
            ) : (
              /* ── Friends / Requests / Add ─────────────────────────────── */
              <div className="flex flex-1 flex-col overflow-hidden">
                <div role="tablist" aria-label="Messages sections" className="flex shrink-0 gap-5 border-b border-border px-4">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          '-mb-px flex items-baseline gap-1.5 border-b-2 py-2.5 text-sm transition',
                          isActive
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span className="font-mono text-[11px] text-primary tabular-nums">{tab.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Friends */}
                {activeTab === 'friends' && (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {friends.length > 0 && (
                      <div className="shrink-0 px-3 pt-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground" />
                          <input
                            type="search"
                            value={friendsFilter}
                            onChange={(e) => setFriendsFilter(e.target.value)}
                            placeholder="Search friends"
                            aria-label="Search friends"
                            className="h-9 w-full rounded-lg border border-border bg-surface-sunken pl-8 pr-3 text-base text-foreground placeholder:text-subtle-foreground transition focus:border-border-strong focus:outline-none sm:text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-1.5 sm:p-2">
                      {loadingFriends && friends.length === 0 ? (
                        <div className="flex h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Loading friends…</span>
                        </div>
                      ) : filteredFriends.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center p-4 text-center">
                          <h5 className="text-sm font-semibold text-foreground">
                            {friends.length === 0 ? 'No friends yet' : 'No matches'}
                          </h5>
                          <p className="mb-4 mt-1 max-w-[220px] text-sm text-muted-foreground">
                            {friends.length === 0
                              ? 'Add players by username, or message a creator from their game.'
                              : `No friend matches "${friendsFilter}".`}
                          </p>
                          {friends.length === 0 && (
                            <button onClick={() => setActiveTab('add')} className={outlineButton}>
                              <UserPlus className="size-3.5" />
                              <span>Add a friend</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredFriends.map((friend) => {
                          const hasUnread = friend.unreadCount > 0;
                          return (
                            <button
                              key={friend.id}
                              onClick={() => handleSelectFriend(friend)}
                              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/[0.04]"
                            >
                              <UserAvatar
                                avatar={friend.avatar}
                                name={friend.username}
                                className="size-9 shrink-0 rounded-full bg-surface-raised text-sm font-semibold text-foreground"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className={cn('truncate text-sm text-foreground', hasUnread ? 'font-semibold' : 'font-medium')}>
                                    {friend.username}
                                  </span>
                                  {friend.lastMessage && (
                                    <span
                                      className={cn(
                                        'shrink-0 font-mono text-[11px] tabular-nums',
                                        hasUnread ? 'text-primary' : 'text-subtle-foreground'
                                      )}
                                    >
                                      {formatListTime(friend.lastMessage.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                  <p className={cn('truncate text-[13px]', hasUnread ? 'text-foreground' : 'text-muted-foreground')}>
                                    {friend.lastMessage
                                      ? friend.lastMessage.senderId === currentUserId
                                        ? `You: ${friend.lastMessage.content}`
                                        : friend.lastMessage.content
                                      : 'No messages yet'}
                                  </p>
                                  {hasUnread && (
                                    <span
                                      className="size-2 shrink-0 rounded-full bg-primary"
                                      aria-label={`${friend.unreadCount} unread`}
                                    />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Requests */}
                {activeTab === 'requests' && (
                  <div className="flex-1 space-y-6 overflow-y-auto p-4">
                    <section>
                      <span className={sectionLabel}>Received · {incomingRequests.length}</span>
                      {incomingRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No friend requests right now.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {incomingRequests.map((req) => (
                            <div key={req.friendshipId} className="flex items-center gap-3 py-2.5">
                              <UserAvatar
                                avatar={req.avatar}
                                name={req.username}
                                className="size-8 shrink-0 rounded-full bg-surface-raised text-xs font-semibold text-foreground"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-foreground">{req.username}</div>
                                {req.name && req.name !== req.username && (
                                  <div className="truncate text-xs text-muted-foreground">{req.name}</div>
                                )}
                              </div>
                              <button onClick={() => handleRespondRequest(req.friendshipId, 'accept')} className={primaryButton}>
                                Accept
                              </button>
                              <button onClick={() => handleRespondRequest(req.friendshipId, 'decline')} className={outlineButton}>
                                Decline
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section>
                      <span className={sectionLabel}>Sent · {outgoingRequests.length}</span>
                      {outgoingRequests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">You have no pending requests.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {outgoingRequests.map((req) => (
                            <div key={req.friendshipId} className="flex items-center gap-3 py-2.5">
                              <UserAvatar
                                avatar={req.avatar}
                                name={req.username}
                                className="size-8 shrink-0 rounded-full bg-surface-raised text-xs font-semibold text-foreground"
                              />
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{req.username}</span>
                              <span className="font-mono text-[11px] text-subtle-foreground">Pending</span>
                              <button
                                onClick={() => handleCancelOutgoing(req.userId)}
                                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {/* Add friend */}
                {activeTab === 'add' && (
                  <div className="flex-1 space-y-6 overflow-y-auto p-4">
                    {/* Player opened from "message creator" */}
                    {targetPlayer && (
                      <div className="rounded-lg border border-border-strong bg-surface-raised p-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatar={targetPlayer.image}
                            name={targetPlayer.username}
                            className="size-10 shrink-0 rounded-full bg-surface text-base font-semibold text-foreground"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground">{targetPlayer.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {targetPlayer.relationship === 'friend'
                                ? "You're friends."
                                : targetPlayer.relationship === 'pending_outgoing'
                                  ? 'Request sent. You can chat once they accept.'
                                  : targetPlayer.relationship === 'pending_incoming'
                                    ? 'They sent you a friend request.'
                                    : 'Add them as a friend to start chatting.'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTargetPlayer(null)}
                            className={iconButton}
                            aria-label="Dismiss"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>

                        <div className="mt-3">
                          {targetPlayer.relationship === 'friend' ? (
                            <button type="button" onClick={handleMessageTargetPlayer} className={cn(primaryButton, 'w-full py-2')}>
                              <MessageSquare className="size-3.5" />
                              <span>Send a message</span>
                            </button>
                          ) : targetPlayer.relationship === 'pending_outgoing' ? (
                            <button
                              type="button"
                              onClick={() => handleCancelOutgoing(targetPlayer.id)}
                              className={cn(outlineButton, 'w-full py-2')}
                            >
                              Cancel request
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddFriend(targetPlayer.id)}
                              disabled={addFriendStatus.type === 'loading'}
                              className={cn(primaryButton, 'w-full py-2')}
                            >
                              {addFriendStatus.type === 'loading' ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : targetPlayer.relationship === 'pending_incoming' ? (
                                <Check className="size-3.5" />
                              ) : (
                                <UserPlus className="size-3.5" />
                              )}
                              <span>{targetPlayer.relationship === 'pending_incoming' ? 'Accept request' : 'Add friend'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add by username */}
                    <section>
                      <label htmlFor="add-friend-username" className={sectionLabel}>
                        Add by username
                      </label>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (addFriendInput.trim()) handleAddFriend(addFriendInput.trim());
                        }}
                        className="flex gap-2"
                      >
                        <input
                          id="add-friend-username"
                          type="text"
                          value={addFriendInput}
                          onChange={(e) => setAddFriendInput(e.target.value)}
                          placeholder="e.g. PixelMaster"
                          autoComplete="off"
                          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-sunken px-3 text-base text-foreground placeholder:text-subtle-foreground transition focus:border-border-strong focus:outline-none sm:text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!addFriendInput.trim() || addFriendStatus.type === 'loading'}
                          className={cn(primaryButton, 'h-9')}
                        >
                          {addFriendStatus.type === 'loading' ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                          <span>Send request</span>
                        </button>
                      </form>
                      {addFriendStatus.type === 'success' && (
                        <p className="mt-2 text-xs text-teal-300">{addFriendStatus.message}</p>
                      )}
                      {addFriendStatus.type === 'error' && (
                        <p className="mt-2 text-xs text-rose-300">{addFriendStatus.message}</p>
                      )}
                    </section>

                    {/* Other players */}
                    <section>
                      <span className={sectionLabel}>Players</span>
                      {suggestedPlayers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No other players yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {suggestedPlayers.map((player) => (
                            <div key={player.id} className="flex items-center gap-3 py-2.5">
                              <UserAvatar
                                avatar={player.image}
                                name={player.username}
                                className="size-8 shrink-0 rounded-full bg-surface-raised text-xs font-semibold text-foreground"
                              />
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{player.username}</span>
                              {player.relationship === 'friend' ? (
                                <span className="font-mono text-[11px] text-subtle-foreground">Friend</span>
                              ) : player.relationship === 'pending_outgoing' ? (
                                <span className="font-mono text-[11px] text-subtle-foreground">Requested</span>
                              ) : (
                                <button onClick={() => handleAddFriend(player.id)} className={outlineButton}>
                                  <UserPlus className="size-3" />
                                  <span>{player.relationship === 'pending_incoming' ? 'Accept' : 'Add'}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove friend confirmation */}
      {friendToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div role="alertdialog" aria-labelledby="remove-friend-title" className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-2xl shadow-black/50">
            <h4 id="remove-friend-title" className="text-base font-semibold text-foreground">
              Remove {friendToRemove.username}?
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll need to send a new friend request to message each other again.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setFriendToRemove(null)}
                disabled={isRemovingFriend}
                className="rounded-lg border border-border-strong px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveFriend}
                disabled={isRemovingFriend}
                className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                {isRemovingFriend ? 'Removing…' : 'Remove friend'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  );
}
