import { create } from 'zustand';
import { Database } from '../lib/supabase';

type Message = Database['public']['Tables']['messages']['Row'] & {
  decrypted_content?: string;
  sender?: {
    username: string;
    email: string;
  };
  recipient?: {
    username: string;
    email: string;
  };
};

type Contact = Database['public']['Tables']['users']['Row'];

interface ChatState {
  messages: Message[];
  contacts: Contact[];
  activeContact: Contact | null;
  isLoadingMessages: boolean;
  isLoadingContacts: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  setActiveContact: (contact: Contact | null) => void;
  setLoadingMessages: (loading: boolean) => void;
  setLoadingContacts: (loading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  contacts: [],
  activeContact: null,
  isLoadingMessages: false,
  isLoadingContacts: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) =>
    set((state) => ({
      contacts: [...state.contacts, contact],
    })),
  setActiveContact: (activeContact) => set({ activeContact }),
  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setLoadingContacts: (isLoadingContacts) => set({ isLoadingContacts }),
  clearChat: () =>
    set({
      messages: [],
      contacts: [],
      activeContact: null,
    }),
}));
