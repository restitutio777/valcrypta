import { useState, useEffect, useRef } from 'react';
import { Send, Lock, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase, Database } from '../../lib/supabase';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { encryptMessage, decryptMessage, importPublicKey } from '../../lib/crypto';
import { useUIStore } from '../../stores/ui-store';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export default function ChatArea() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { activeContact, messages, setMessages, addMessage, setLoadingMessages, isLoadingMessages } = useChatStore();
  const { user, publicKey, privateKey } = useAuthStore();
  const { setNotification } = useUIStore();

  useEffect(() => {
    if (activeContact && user) {
      loadMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [activeContact, user, privateKey]);

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
        const isSender = msg.sender_id === user.id;
        try {
          const decrypted = await decryptMessage(msg.encrypted_content, privateKey, isSender);
          return { ...msg, decrypted_content: decrypted };
        } catch {
          return {
            ...msg,
            decrypted_content: isSender ? '[Sent message]' : '[Could not decrypt]',
          };
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
          const newMessage = payload.new as MessageRow;
          if (newMessage.sender_id === activeContact.id) {
            try {
              if (!privateKey) return;
              const decrypted = await decryptMessage(
                newMessage.encrypted_content,
                privateKey,
                false
              );
              addMessage({ ...newMessage, decrypted_content: decrypted });
            } catch (error) {
              console.error('Decryption error:', error);
              addMessage({
                ...newMessage,
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
    if (!message.trim() || !activeContact || !user || !publicKey) return;

    setIsSending(true);

    try {
      const recipientPublicKey = await importPublicKey(activeContact.public_key);
      const senderPublicKey = await importPublicKey(publicKey);
      const encryptedContent = await encryptMessage(
        message,
        recipientPublicKey,
        senderPublicKey
      );

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

      addMessage({ ...data, decrypted_content: message });
      setMessage('');
    } catch {
      setNotification({ message: 'Failed to send message', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  if (!activeContact) {
    return (
      <div className="aurora-bg flex flex-1 items-center justify-center bg-warm-50 dark:bg-ink-950">
        <div className="animate-fade-in-up px-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient shadow-glow">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <h3 className="mb-2 font-display text-2xl font-bold text-warm-800 dark:text-warm-50">
            Select a contact to start chatting
          </h3>
          <p className="mb-1 text-warm-600 dark:text-warm-300">
            Search for users in the sidebar
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-warm-500 dark:text-warm-400">
            <ShieldCheck className="h-4 w-4 text-primary" />
            All messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-warm-50 dark:bg-ink-950">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
              <p className="text-sm text-warm-500 dark:text-warm-300">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-fade-in text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-100 dark:bg-ink-700">
                <Lock className="h-8 w-8 text-primary/70" />
              </div>
              <p className="text-sm text-warm-600 dark:text-warm-300">
                No messages yet. Start a secure conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex animate-pop-in ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-2.5 sm:max-w-[70%] ${
                    isOwn
                      ? 'rounded-3xl rounded-br-lg bg-brand-gradient text-white shadow-lift'
                      : 'rounded-3xl rounded-bl-lg border border-sage-100 dark:border-ink-600/60 bg-white dark:bg-ink-800 text-warm-800 dark:text-warm-100 shadow-soft'
                  }`}
                >
                  <p className="break-words text-[15px] leading-relaxed">
                    {msg.decrypted_content}
                  </p>
                  <p
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isOwn ? 'text-white/70' : 'text-warm-400 dark:text-warm-500'
                    }`}
                  >
                    <Lock className="h-2.5 w-2.5" />
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

      <div className="border-t border-sage-100 dark:border-ink-700/60 bg-white/70 dark:bg-ink-900/80 p-3 backdrop-blur-xl sm:p-4">
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
            className="input-field rounded-full px-5 py-3"
            disabled={isSending}
            autoFocus
          />
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="btn-primary flex h-12 w-12 flex-shrink-0 items-center justify-center !rounded-full"
            title="Send"
          >
            <Send className="h-5 w-5 -translate-x-px translate-y-px" />
          </button>
        </form>
      </div>
    </div>
  );
}
