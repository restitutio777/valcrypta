import { useState, useEffect, useRef } from 'react';
import { Send, Lock, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { encryptMessage, decryptMessage, importPublicKey } from '../../lib/crypto';
import { useUIStore } from '../../stores/ui-store';

export default function ChatArea() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { activeContact, messages, setMessages, addMessage, setLoadingMessages, loadingMessages } = useChatStore();
  const { user, privateKey } = useAuthStore();
  const { setNotification } = useUIStore();

  useEffect(() => {
    if (activeContact && user) {
      loadMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [activeContact, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!activeContact || !user || !privateKey) return;

    setLoadingMessages(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      setNotification({ message: 'Failed to load messages', type: 'error' });
      setLoadingMessages(false);
      return;
    }

    const decryptedMessages = await Promise.all(
      (data || []).map(async (msg) => {
        try {
          if (msg.recipient_id === user.id) {
            const decrypted = await decryptMessage(msg.encrypted_content, privateKey);
            return { ...msg, decrypted_content: decrypted };
          }
          return { ...msg, decrypted_content: '[Sent message]' };
        } catch (error) {
          return { ...msg, decrypted_content: '[Could not decrypt]' };
        }
      })
    );

    setMessages(decryptedMessages);
    setLoadingMessages(false);
  };

  const subscribeToMessages = () => {
    if (!activeContact || !user) return () => {};

    const channelName = `messages-${user.id}-${activeContact.id}`;
    console.log('Subscribing to channel:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          if (payload.new.sender_id === activeContact.id) {
            try {
              if (!privateKey) return;
              const decrypted = await decryptMessage(
                payload.new.encrypted_content,
                privateKey
              );
              addMessage({ ...payload.new, decrypted_content: decrypted });
            } catch (error) {
              console.error('Decryption error:', error);
              addMessage({
                ...payload.new,
                decrypted_content: '[Could not decrypt]',
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from channel:', channelName);
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeContact || !user) return;

    setIsSending(true);

    try {
      const recipientPublicKey = await importPublicKey(activeContact.public_key);
      const encryptedContent = await encryptMessage(message, recipientPublicKey);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: activeContact.id,
          encrypted_content: encryptedContent,
        })
        .select()
        .single();

      if (error) throw error;

      addMessage({ ...data, decrypted_content: '[Sent message]' });
      setMessage('');
    } catch (error) {
      setNotification({ message: 'Failed to send message', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  if (!activeContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-warm-50 dark:bg-slate-900">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-warm-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-warm-700 dark:text-slate-200 mb-2">
            Select a contact to start chatting
          </h3>
          <p className="text-warm-600 dark:text-slate-300 mb-1">
            Search for users in the sidebar
          </p>
          <p className="text-sm text-warm-500 dark:text-slate-400">
            All messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-warm-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-warm-500 dark:text-slate-300 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Lock className="w-12 h-12 text-warm-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-warm-600 dark:text-slate-300 text-sm">
                No messages yet. Start a secure conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] ${
                    isOwn
                      ? 'bg-primary dark:bg-amber-500 text-white'
                      : 'bg-white dark:bg-slate-700 text-warm-800 dark:text-slate-100'
                  } rounded-2xl px-4 py-3 shadow-sm`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <Lock className="w-3 h-3 mt-1 opacity-50 flex-shrink-0" />
                    <p className="text-sm break-words">{msg.decrypted_content}</p>
                  </div>
                  <p
                    className={`text-xs ${
                      isOwn ? 'text-white/80' : 'text-warm-500 dark:text-slate-300'
                    } text-right`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-warm-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && message.trim() && !isSending) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type an encrypted message..."
            className="flex-1 px-4 py-3 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-warm-50 dark:bg-slate-700 text-warm-800 dark:text-slate-100"
            disabled={isSending}
            autoFocus
          />
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary-dark dark:bg-amber-500 dark:hover:bg-amber-600 disabled:bg-warm-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
