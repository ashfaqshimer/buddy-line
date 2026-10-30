'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  UserPlus,
  Users,
  Clock,
  Check,
  CheckCheck,
  Search,
  MessageSquare,
  Shield,
  Crown,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Minus,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { IoChatbubbles, IoGameController } from 'react-icons/io5';
import { useAuth } from '@/components/auth-provider';
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
  searchPlayersAction,
  getSuggestedPlayersAction,
  getConversationAction,
  sendPrivateMessageAction,
} from '@/app/chat-actions';
import { AuthModal } from '@/components/auth-modal';

interface BottomChatWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  targetFriendId?: string | null;
  onClearTarget?: () => void;
}

type TabType = 'friends' | 'requests' | 'add';

const QUICK_REACTIONS = ['GG! 🎮', 'Ready to play? 🚀', 'Nice score! 🏆', '🕹️', '🔥', '👾'];

export function BottomChatWidget({
  isOpen,
  onToggle,
  targetFriendId,
  onClearTarget,
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

  // Search & suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>
  >([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState<
    Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // Confirm friend removal
  const [friendToRemove, setFriendToRemove] = useState<FriendSummary | null>(null);
  const [isRemovingFriend, setIsRemovingFriend] = useState(false);

  // Friends filter
  const [friendsFilter, setFriendsFilter] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // Fetch friends and requests
  const loadFriendsData = useCallback(async (silent = false) => {
    if (!currentUserId) return;
    if (!silent) setLoadingFriends(true);

    try {
      const res = await getFriendsAndRequestsAction();
      if (res.success) {
        setFriends(res.friends || []);
        setIncomingRequests(res.incomingRequests || []);
        setOutgoingRequests(res.outgoingRequests || []);

        if (selectedFriend) {
          const updated = res.friends?.find((f) => f.id === selectedFriend.id);
          if (updated) setSelectedFriend(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      if (!silent) setLoadingFriends(false);
    }
  }, [currentUserId, selectedFriend]);

  // Load conversation messages
  const loadConversation = useCallback(
    async (friendId: string, silent = false) => {
      if (!currentUserId) return;
      if (!silent) setLoadingConversation(true);
      setConversationError(null);

      try {
        const res = await getConversationAction(friendId);
        if (res.success && res.messages) {
          setMessages(res.messages);
          if (!silent) {
            setTimeout(() => scrollToBottom(false), 50);
          }
        } else if (res.error) {
          setConversationError(res.error);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setConversationError('Could not load messages.');
      } finally {
        if (!silent) setLoadingConversation(false);
      }
    },
    [currentUserId, scrollToBottom]
  );

  // Initial load when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadFriendsData(true);
      getSuggestedPlayersAction().then((res) => {
        if (res.success && res.players) {
          setSuggestedPlayers(res.players);
        }
      });
    }
  }, [isLoggedIn, loadFriendsData]);

  // Handle targetFriendId prop (e.g. clicked on an author from arcade view)
  useEffect(() => {
    if (targetFriendId) {
      onToggle(true);
      if (friends.length > 0) {
        const found = friends.find(
          (f) =>
            f.id === targetFriendId ||
            f.username.toLowerCase() === targetFriendId.toLowerCase()
        );
        if (found) {
          setSelectedFriend(found);
          loadConversation(found.id);
        } else {
          // If not friends yet, open Add Friend tab with target pre-filled
          setActiveTab('add');
          setAddFriendInput(targetFriendId);
        }
      } else {
        setActiveTab('add');
        setAddFriendInput(targetFriendId);
      }
      onClearTarget?.();
    }
  }, [targetFriendId, friends, onToggle, onClearTarget, loadConversation]);

  // Live polling for messages when conversation is active
  useEffect(() => {
    if (isOpen && selectedFriend) {
      pollingRef.current = setInterval(() => {
        loadConversation(selectedFriend.id, true);
        loadFriendsData(true);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, selectedFriend, loadConversation, loadFriendsData]);

  // Select a friend to chat
  const handleSelectFriend = (friend: FriendSummary) => {
    setSelectedFriend(friend);
    loadConversation(friend.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFriend || !inputMessage.trim() || sendingMessage) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSendingMessage(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: PrivateMessageRecord = {
      id: tempId,
      senderId: currentUserId!,
      receiverId: selectedFriend.id,
      content: textToSend,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    try {
      const res = await sendPrivateMessageAction(selectedFriend.id, textToSend);
      if (res.success && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message! : m)));
        loadFriendsData(true);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setConversationError(res.error || 'Failed to send message.');
        setInputMessage(textToSend);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setConversationError('Network error while sending message.');
      setInputMessage(textToSend);
    } finally {
      setSendingMessage(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Add friend
  const handleAddFriend = async (targetUsernameOrId: string) => {
    setAddFriendStatus({ type: 'loading' });
    try {
      const res = await sendFriendRequestAction(targetUsernameOrId);
      if (res.success) {
        setAddFriendStatus({
          type: 'success',
          message: res.message || 'Friend request sent successfully!',
        });
        setAddFriendInput('');
        loadFriendsData(true);
        setSuggestedPlayers((prev) =>
          prev.map((p) =>
            p.username.toLowerCase() === targetUsernameOrId.toLowerCase() || p.id === targetUsernameOrId
              ? { ...p, relationship: res.status === 'accepted' ? 'friend' : 'pending_outgoing' }
              : p
          )
        );
      } else {
        setAddFriendStatus({
          type: 'error',
          message: res.error || 'Failed to send friend request.',
        });
      }
    } catch (err) {
      setAddFriendStatus({
        type: 'error',
        message: 'An unexpected error occurred.',
      });
    }
  };

  // Respond to incoming request
  const handleRespondRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    try {
      const res = await respondToFriendRequestAction(friendshipId, action);
      if (res.success) {
        await loadFriendsData();
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
          setSelectedFriend(null);
          setMessages([]);
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

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchPlayersAction(searchQuery);
        if (res.success && res.players) {
          setSearchResults(res.players);
        }
      } catch (err) {
        console.error('Failed to search players:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived notification count
  const totalUnreadMessages = friends.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  const totalNotifications = totalUnreadMessages + incomingRequests.length;

  const filteredFriends = friends.filter((f) => {
    if (!friendsFilter.trim()) return true;
    const term = friendsFilter.toLowerCase();
    return f.username.toLowerCase().includes(term) || f.name.toLowerCase().includes(term);
  });

  return (
    <>
      {/* =========================================================================
          FACEBOOK-STYLE BOTTOM DOCKED BAR / PILL (ALWAYS ON BOTTOM-RIGHT)
         ========================================================================= */}
      <div className="fixed bottom-0 right-3 sm:right-6 z-40 select-none">
        {!isOpen ? (
          /* COLLAPSED BOTTOM BAR (Like Facebook chat dock) */
          <button
            onClick={() => {
              if (!isLoggedIn) {
                setIsAuthModalOpen(true);
              } else {
                onToggle(true);
                loadFriendsData();
              }
            }}
            className="flex items-center gap-2.5 rounded-t-2xl border-t border-x border-teal-400/30 bg-[#1a1f27] hover:bg-[#22272f] px-4 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(45,212,191,0.18)] transition-all duration-200 group active:translate-y-0.5"
            title="Open Player Chat & Friends"
          >
            <div className="relative">
              <IoChatbubbles className="size-4 text-teal-400 group-hover:scale-110 transition-transform" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse">
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </span>
              )}
            </div>

            <span className="text-xs font-black text-white tracking-wide">
              Friends & Chat
            </span>

            {isLoggedIn && (
              <span className="flex items-center gap-1 text-[10px] text-teal-400/90 font-bold bg-teal-400/10 border border-teal-400/20 rounded-full px-2 py-0.5">
                <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>{friends.length}</span>
              </span>
            )}

            <ChevronUp className="size-3.5 text-slate-400 group-hover:text-teal-400 transition" />
          </button>
        ) : (
          /* =========================================================================
             EXPANDED FACEBOOK-STYLE POPUP WINDOW (ANCHORED AT BOTTOM-RIGHT)
             ========================================================================= */
          <div
            className={`flex flex-col bg-[#161a22] border-t border-x sm:border border-teal-400/30 rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.7),0_0_28px_rgba(45,212,191,0.18)] transition-all duration-200 overflow-hidden ${
              isExpanded
                ? 'w-[96vw] max-w-3xl h-[88vh] max-h-[720px]'
                : 'w-[96vw] sm:w-[380px] md:w-[410px] h-[540px] max-h-[82vh]'
            }`}
          >
            {/* Top Widget Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#1a1f27] px-3.5 py-2.5 shrink-0 select-none">
              {/* Left Title / Context */}
              <div className="flex items-center gap-2 min-w-0">
                {selectedFriend ? (
                  <button
                    onClick={() => {
                      setSelectedFriend(null);
                      setMessages([]);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
                    title="Back to friends list"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-lg bg-teal-400/10 border border-teal-400/25 text-teal-400 shadow-sm shrink-0">
                    <IoChatbubbles className="size-3.5" />
                  </div>
                )}

                <div className="min-w-0">
                  {selectedFriend ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        @{selectedFriend.username}
                      </span>
                      {selectedFriend.role === 'admin' ? (
                        <span className="rounded bg-amber-400/15 border border-amber-400/30 px-1 py-0.2 text-[8px] font-black uppercase text-amber-300">
                          ADMIN
                        </span>
                      ) : selectedFriend.role === 'root' ? (
                        <span className="rounded bg-amber-400/15 border border-amber-400/30 px-1 py-0.2 text-[8px] font-black uppercase text-amber-300">
                          ROOT
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-xs text-white tracking-wide">
                        BUDDY CHAT
                      </h3>
                      <span className="rounded-full bg-teal-400/10 border border-teal-400/20 px-1.5 py-0.2 text-[9px] font-bold text-teal-300">
                        Private
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Window Controls */}
              <div className="flex items-center gap-1 shrink-0 text-slate-400">
                {selectedFriend && (
                  <button
                    onClick={() => setFriendToRemove(selectedFriend)}
                    title="Remove Friend"
                    className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}

                {/* Maximize / Normal toggle */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:inline-flex rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-white transition"
                  title={isExpanded ? 'Dock to corner' : 'Expand window'}
                >
                  {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                </button>

                {/* Minimize to bottom bar (like Facebook minus) */}
                <button
                  onClick={() => onToggle(false)}
                  className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-white transition"
                  title="Minimize chat"
                >
                  <Minus className="size-3.5" />
                </button>

                {/* Close widget */}
                <button
                  onClick={() => {
                    onToggle(false);
                    setSelectedFriend(null);
                  }}
                  className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  title="Close chat"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Unauthenticated View */}
            {!isLoggedIn ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#151920]">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-400 mb-3 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                  <Users className="size-7" />
                </div>
                <h4 className="text-base font-black text-white mb-1.5">Sign In to Chat</h4>
                <p className="text-xs text-slate-300 max-w-xs mb-5 leading-relaxed">
                  Connect with your arcade friends and chat privately in real time.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] transition active:scale-95"
                >
                  <IoGameController className="size-3.5" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            ) : selectedFriend ? (
              /* ===================================================================
                 VIEW 1: ACTIVE 1-ON-1 CONVERSATION
                 =================================================================== */
              <div className="flex-1 flex flex-col bg-[#151920] overflow-hidden">
                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {loadingConversation ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                      <Loader2 className="size-5 animate-spin text-teal-400" />
                      <span className="text-xs">Loading messages...</span>
                    </div>
                  ) : conversationError ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <AlertCircle className="size-5 text-rose-400 mb-2" />
                      <p className="text-xs text-rose-300">{conversationError}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-400 mb-2.5 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
                        <MessageSquare className="size-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">
                        Chat with @{selectedFriend.username}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mb-3">
                        Only you and @{selectedFriend.username} can see these messages.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs">
                        {QUICK_REACTIONS.map((quick) => (
                          <button
                            key={quick}
                            onClick={() => {
                              setInputMessage(quick);
                              inputRef.current?.focus();
                            }}
                            className="rounded-full border border-teal-400/20 bg-teal-400/5 px-2.5 py-1 text-[11px] text-teal-300 hover:bg-teal-400/15 transition"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center my-1">
                        <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 text-[9px] font-semibold text-slate-400">
                          End-to-End Private Channel
                        </span>
                      </div>

                      {messages.map((msg, index) => {
                        const isMine = msg.senderId === currentUserId;
                        const showTimestamp =
                          index === messages.length - 1 ||
                          new Date(messages[index + 1].createdAt).getTime() -
                            new Date(msg.createdAt).getTime() >
                            300000;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-md transition-all ${
                                isMine
                                  ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-slate-950 font-medium rounded-tr-sm shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                                  : 'bg-[#22272f] border border-white/[0.08] text-white rounded-tl-sm shadow-[2px_2px_8px_rgba(0,0,0,0.3)]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                              </p>
                            </div>

                            {showTimestamp && (
                              <div
                                className={`flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 px-1 ${
                                  isMine ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMine &&
                                  (msg.isRead ? (
                                    <CheckCheck className="size-3 text-teal-400" />
                                  ) : (
                                    <Check className="size-3 text-slate-500" />
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Bar */}
                <div className="border-t border-white/[0.08] bg-[#1a1f27] p-2.5 shrink-0">
                  {/* Quick Reactions */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none">
                    {QUICK_REACTIONS.map((quick) => (
                      <button
                        key={quick}
                        onClick={() => {
                          setInputMessage(quick);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full bg-white/[0.04] hover:bg-teal-400/10 hover:text-teal-300 border border-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400 whitespace-nowrap transition"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message @${selectedFriend.username}...`}
                      maxLength={2000}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-[#111419] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sendingMessage}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.25)] hover:shadow-[0_0_18px_rgba(45,212,191,0.4)] transition active:scale-95 disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {sendingMessage ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* ===================================================================
                 VIEW 2: MAIN LIST (FRIENDS / REQUESTS / ADD FRIEND)
                 =================================================================== */
              <div className="flex-1 flex flex-col overflow-hidden bg-[#181d25]">
                {/* Top Tabs */}
                <div className="p-2.5 border-b border-white/[0.06] bg-[#161a22]">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#111419] p-1 border border-white/[0.04]">
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`relative flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                        activeTab === 'friends'
                          ? 'bg-teal-400 text-slate-950 shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="size-3" />
                      <span>Friends</span>
                      {totalUnreadMessages > 0 && (
                        <span className="flex size-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                          {totalUnreadMessages}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('requests')}
                      className={`relative flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                        activeTab === 'requests'
                          ? 'bg-teal-400 text-slate-950 shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="size-3" />
                      <span>Requests</span>
                      {incomingRequests.length > 0 && (
                        <span className="flex size-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-slate-950 animate-pulse">
                          {incomingRequests.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('add')}
                      className={`relative flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                        activeTab === 'add'
                          ? 'bg-teal-400 text-slate-950 shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserPlus className="size-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: FRIENDS LIST */}
                {activeTab === 'friends' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-white/[0.04]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-500" />
                        <input
                          type="text"
                          value={friendsFilter}
                          onChange={(e) => setFriendsFilter(e.target.value)}
                          placeholder="Search friends..."
                          className="w-full rounded-xl border border-white/[0.06] bg-[#111419] pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-1.5 space-y-0.5">
                      {loadingFriends ? (
                        <div className="flex flex-col items-center justify-center h-36 text-slate-500 gap-1.5">
                          <Loader2 className="size-4 animate-spin text-teal-400" />
                          <span className="text-xs">Loading friends...</span>
                        </div>
                      ) : filteredFriends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-44 text-center p-4">
                          <Users className="size-6 text-slate-500 mb-2" />
                          <h5 className="text-xs font-bold text-white mb-0.5">No friends found</h5>
                          <p className="text-[11px] text-slate-400 mb-3 max-w-[180px]">
                            {friends.length === 0
                              ? 'Add fellow players to start chatting privately!'
                              : 'No matches found.'}
                          </p>
                          {friends.length === 0 && (
                            <button
                              onClick={() => setActiveTab('add')}
                              className="rounded-full bg-teal-400/10 border border-teal-400/25 px-3 py-1 text-xs font-bold text-teal-300 hover:bg-teal-400/20 transition"
                            >
                              Add Player
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredFriends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => handleSelectFriend(friend)}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-white/[0.04] transition group"
                          >
                            <div className="relative shrink-0">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-black text-white shadow-sm">
                                {friend.avatar.length <= 2
                                  ? friend.avatar
                                  : friend.username.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-[#181d25] bg-emerald-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-white truncate group-hover:text-teal-300 transition-colors">
                                  @{friend.username}
                                </span>
                                {friend.lastMessage && (
                                  <span className="text-[9px] text-slate-500 shrink-0">
                                    {new Date(friend.lastMessage.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1.5 mt-0.5">
                                <p className="text-[11px] text-slate-400 truncate">
                                  {friend.lastMessage
                                    ? friend.lastMessage.senderId === currentUserId
                                      ? `You: ${friend.lastMessage.content}`
                                      : friend.lastMessage.content
                                    : 'Click to open private chat'}
                                </p>
                                {friend.unreadCount > 0 && (
                                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-400 text-[9px] font-black text-slate-950 shadow-[0_0_8px_rgba(45,212,191,0.4)]">
                                    {friend.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: REQUESTS */}
                {activeTab === 'requests' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Received ({incomingRequests.length})
                      </span>

                      {incomingRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-1">No incoming requests.</p>
                      ) : (
                        <div className="space-y-2">
                          {incomingRequests.map((req) => (
                            <div
                              key={req.friendshipId}
                              className="rounded-xl border border-white/[0.06] bg-[#1c2028] p-2.5 shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/20 text-xs">
                                  {req.avatar.length <= 2 ? req.avatar : req.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">@{req.username}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{req.name}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleRespondRequest(req.friendshipId, 'accept')}
                                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-teal-400 py-1 text-xs font-bold text-slate-950 shadow-sm hover:shadow-[0_0_12px_rgba(45,212,191,0.3)] transition"
                                >
                                  <Check className="size-3" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRespondRequest(req.friendshipId, 'decline')}
                                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Sent ({outgoingRequests.length})
                      </span>

                      {outgoingRequests.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-1">No outgoing requests.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {outgoingRequests.map((req) => (
                            <div
                              key={req.friendshipId}
                              className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-[#141820] p-2"
                            >
                              <span className="text-xs font-bold text-slate-300 truncate">
                                @{req.username}
                              </span>
                              <button
                                onClick={() => handleCancelOutgoing(req.userId)}
                                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: ADD FRIEND */}
                {activeTab === 'add' && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
                    {/* Add Form */}
                    <div className="rounded-xl border border-teal-400/20 bg-[#1c2028] p-3 space-y-2">
                      <span className="text-xs font-black text-teal-300 flex items-center gap-1">
                        <Sparkles className="size-3 text-teal-400" />
                        <span>Add by Username</span>
                      </span>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (addFriendInput.trim()) {
                            handleAddFriend(addFriendInput.trim());
                          }
                        }}
                        className="space-y-2"
                      >
                        <input
                          type="text"
                          value={addFriendInput}
                          onChange={(e) => setAddFriendInput(e.target.value)}
                          placeholder="e.g. PixelMaster"
                          className="w-full rounded-lg border border-white/[0.08] bg-[#111419] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                        />

                        <button
                          type="submit"
                          disabled={!addFriendInput.trim() || addFriendStatus.type === 'loading'}
                          className="w-full flex items-center justify-center gap-1 rounded-lg bg-teal-400 py-1.5 text-xs font-black text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.25)] transition disabled:opacity-50"
                        >
                          {addFriendStatus.type === 'loading' ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <UserPlus className="size-3" />
                          )}
                          <span>Send Request</span>
                        </button>
                      </form>

                      {addFriendStatus.type === 'success' && (
                        <p className="text-[11px] text-emerald-400">{addFriendStatus.message}</p>
                      )}
                      {addFriendStatus.type === 'error' && (
                        <p className="text-[11px] text-rose-400">{addFriendStatus.message}</p>
                      )}
                    </div>

                    {/* Community Suggestions */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Community Players
                      </span>

                      <div className="space-y-1.5">
                        {suggestedPlayers.length === 0 ? (
                          <p className="text-xs text-slate-500 py-1">No other players found.</p>
                        ) : (
                          suggestedPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl border border-white/[0.04] bg-[#1c2028]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-white/[0.04] text-xs">
                                  {player.image?.length && player.image.length <= 2
                                    ? player.image
                                    : player.username.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-white truncate">
                                  @{player.username}
                                </span>
                              </div>

                              {player.relationship === 'friend' ? (
                                <span className="text-[10px] font-bold text-teal-400">Friends ✓</span>
                              ) : player.relationship === 'pending_outgoing' ? (
                                <span className="text-[10px] font-bold text-amber-300">Sent ⏳</span>
                              ) : (
                                <button
                                  onClick={() => handleAddFriend(player.id)}
                                  className="flex items-center gap-1 rounded-full bg-teal-400/10 border border-teal-400/25 px-2 py-0.5 text-[10px] font-bold text-teal-300 hover:bg-teal-400 hover:text-slate-950 transition"
                                >
                                  <UserPlus className="size-2.5" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove Friend Confirmation Dialog */}
      {friendToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/20 bg-[#1c2028] p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="size-5" />
              <div>
                <h4 className="font-bold text-white text-sm">Remove Friend</h4>
                <p className="text-xs text-rose-300">@{friendToRemove.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove <strong className="text-white">@{friendToRemove.username}</strong> from your friends?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFriendToRemove(null)}
                disabled={isRemovingFriend}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveFriend}
                disabled={isRemovingFriend}
                className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition disabled:opacity-50"
              >
                {isRemovingFriend ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  );
}
