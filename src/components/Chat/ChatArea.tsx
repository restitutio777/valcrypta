import { useState, useEffect, useRef } from 'react';
import { Send, Lock, MessageSquare, ShieldCheck, Paperclip, Trash2 } from 'lucide-react';
import { supabase, Database } from '../../lib/supabase';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { encryptMessage, decryptMessage, importPublicKey } from '../../lib/crypto';
import { sendFile, deleteMessage, MAX_FILE_SIZE, FileTooLargeError, FileMeta } from '../../lib/files';
import { useUIStore } from '../../stores/ui-store';
import FileMessage from './FileMessage';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export default function ChatArea() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeContact,
    messages,
    setMessages,
    addMessage,
    removeMessage,
    setLoadingMessages,
    isLoadingMessages,
  } = useChatStore();
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

  // Decrypt a row for display. File messages carry their real filename/MIME as
  // an encrypted JSON body inside encrypted_content; unpack it into the
  // decrypted_file_* fields the UI reads.
  const decryptRow = async (msg: MessageRow, isSender: boolean) => {
    if (!privateKey) {
      return { ...msg, decrypted_content: isSender ? '[Sent message]' : '[Locked]' };
    }
    try {
      const decrypted = await decryptMessage(msg.encrypted_content, privateKey, isSender);
      if (msg.file_url) {
        try {
          const meta = JSON.parse(decrypted) as FileMeta;
          return {
            ...msg,
            decrypted_content: meta.note ?? '',
            decrypted_file_name: meta.name,
            decrypted_file_type: meta.mime,
          };
        } catch {
          return {
            ...msg,
            decrypted_content: '',
            decrypted_file_name: 'Encrypted file',
            decrypted_file_type: 'application/octet-stream',
          };
        }
      }
      return { ...msg, decrypted_content: decrypted };
    } catch {
      return {
        ...msg,
        decrypted_content: isSender ? '[Sent message]' : '[Could not decrypt]',
      };
    }
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
      (data || []).map((msg) => decryptRow(msg, msg.sender_id === user.id))
    );

    setMessages(decryptedMessages);
    setLoadingMessages(false);
  };

  const subscribeToMessages = () => {
    if (!activeContact || !user) return () => {};

    const channelName = `messages-${user.id}-${activeContact.id}`;

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
          const newMessage = payload.new as MessageRow;
          if (newMessage.sender_id === activeContact.id) {
            const decrypted = await decryptRow(newMessage, false);
            addMessage(decrypted);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          // DELETE events carry only the old primary key (default replica
          // identity), so there is nothing to filter on — match the id against
          // loaded messages and drop the bubble if present. This powers
          // "delete for everyone" on the receiving side.
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) removeMessage(oldId);
        }
      )
      .subscribe();

    return () => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file || !activeContact || !user || !publicKey) return;

    if (file.size > MAX_FILE_SIZE) {
      setNotification({ message: 'File is too large (max 25 MB)', type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      const recipientPublicKey = await importPublicKey(activeContact.public_key);
      const senderPublicKey = await importPublicKey(publicKey);
      const row = await sendFile({
        file,
        senderId: user.id,
        recipientId: activeContact.id,
        recipientPublicKey,
        senderPublicKey,
      });
      addMessage({
        ...row,
        decrypted_content: '',
        decrypted_file_name: file.name,
        decrypted_file_type: file.type || 'application/octet-stream',
      });
    } catch (err) {
      const msg =
        err instanceof FileTooLargeError
          ? 'File is too large (max 25 MB)'
          : 'Failed to send file';
      setNotification({ message: msg, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = async (msg: MessageRow) => {
    setConfirmDeleteId(null);
    try {
      await deleteMessage({ id: msg.id, file_url: msg.file_url });
      removeMessage(msg.id);
    } catch {
      setNotification({ message: 'Failed to delete message', type: 'error' });
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
            const isFile = !!msg.file_url;
            const timeLabel = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={msg.id}
                className={`group flex animate-pop-in items-center gap-1.5 ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}
              >
                {isOwn &&
                  (confirmDeleteId === msg.id ? (
                    <div className="flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow-lift dark:bg-ink-800">
                      <span className="px-1 text-xs text-warm-500 dark:text-warm-400">
                        Delete for both?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full px-2 py-0.5 text-xs text-warm-500 transition hover:bg-sage-100 dark:text-warm-400 dark:hover:bg-ink-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(msg.id)}
                      className="btn-ghost-icon flex-shrink-0 opacity-0 transition group-hover:opacity-100"
                      title="Delete for everyone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ))}

                {isFile ? (
                  <div
                    className={`flex max-w-[78%] flex-col gap-1 sm:max-w-[70%] ${
                      isOwn ? 'items-end' : 'items-start'
                    }`}
                  >
                    <FileMessage
                      fileUrl={msg.file_url as string}
                      keyPayload={msg.encrypted_file_key || ''}
                      isImage={msg.extension === 'image'}
                      fileSize={msg.file_size}
                      fileName={msg.decrypted_file_name || 'Encrypted file'}
                      fileType={msg.decrypted_file_type || 'application/octet-stream'}
                      isOwn={isOwn}
                    />
                    <span className="flex items-center gap-1 px-1 text-[10px] text-warm-400 dark:text-warm-500">
                      <Lock className="h-2.5 w-2.5" />
                      {timeLabel}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[78%] px-4 py-2.5 sm:max-w-[70%] ${
                      isOwn
                        ? 'rounded-3xl rounded-br-lg bg-brand-gradient text-white shadow-lift'
                        : 'rounded-3xl rounded-bl-lg border border-sage-100 bg-white text-warm-800 shadow-soft dark:border-ink-600/60 dark:bg-ink-800 dark:text-warm-100'
                    }`}
                  >
                    <p className="break-words text-base leading-relaxed">
                      {msg.decrypted_content}
                    </p>
                    <p
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        isOwn ? 'text-white/70' : 'text-warm-400 dark:text-warm-500'
                      }`}
                    >
                      <Lock className="h-2.5 w-2.5" />
                      {timeLabel}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="safe-bottom border-t border-sage-100 bg-white/70 p-3 backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-900/80 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-ghost-icon flex-shrink-0 disabled:opacity-50"
            title="Attach a file"
          >
            {isUploading ? (
              <span className="block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>
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
