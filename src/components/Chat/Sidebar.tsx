import { useState, useEffect } from 'react';
import { Search, UserPlus, Lock } from 'lucide-react';
import { supabase, Database } from '../../lib/supabase';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import ValCryptaLogo from '../ValCryptaLogo';

type UserRow = Database['public']['Tables']['users']['Row'];

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { contacts, activeContact, setContacts, setActiveContact, addContact } = useChatStore();
  const { user } = useAuthStore();
  const { setNotification, toggleSidebar } = useUIStore();

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    const { data: contactData } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', user.id);

    if (contactData) {
      const contactIds = contactData.map((c) => c.contact_id);

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .in('id', contactIds);

      if (usersData) {
        setContacts(usersData);
      }
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id || '')
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        setNotification({ message: 'Failed to search users', type: 'error' });
        setSearchResults([]);
      } else {
        console.log('Search results:', data);
        setSearchResults(data || []);
      }
    } catch (err) {
      console.error('Search exception:', err);
      setNotification({ message: 'Search failed', type: 'error' });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (contact: UserRow) => {
    if (!user) return;

    const exists = contacts.find((c) => c.id === contact.id);
    if (exists) {
      setActiveContact(contact);
      setSearchQuery('');
      setSearchResults([]);
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
      return;
    }

    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      contact_id: contact.id,
    });

    if (!error) {
      addContact(contact);
      setActiveContact(contact);
      setNotification({ message: 'Contact added successfully', type: 'success' });
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex h-full flex-col border-r border-sage-100 dark:border-ink-700/60 bg-white/70 dark:bg-ink-900/80 backdrop-blur-xl">
      <div className="relative border-b border-sage-100 dark:border-ink-700/60 p-4">
        <div className="mb-4">
          <ValCryptaLogo size="md" showText={true} />
        </div>

        <div className="group relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users to start chatting..."
            className="input-field py-2.5 pl-10 pr-9 text-sm"
          />
          {isSearching && searchQuery.length >= 2 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className="glass-card animate-pop-in absolute left-4 right-4 z-50 mt-2 rounded-2xl p-4 shadow-lift">
            <p className="text-center text-sm text-warm-500 dark:text-warm-300">No users found</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="glass-card animate-pop-in absolute left-4 right-4 z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl shadow-lift">
            {searchResults.map((result) => {
              const isAlreadyContact = contacts.find((c) => c.id === result.id);
              return (
                <button
                  key={result.id}
                  onClick={() => handleAddContact(result)}
                  className="group flex w-full items-center gap-3 border-b border-sage-100/80 dark:border-ink-700/60 p-3 transition-colors last:border-0 hover:bg-sage-50 dark:hover:bg-ink-700/60"
                >
                  <div className="avatar-disc h-10 w-10 text-sm">
                    {result.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-warm-800 dark:text-warm-50">
                      {result.username}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-300">
                      {isAlreadyContact ? 'Already connected' : result.email}
                    </p>
                  </div>
                  <UserPlus className="h-4 w-4 text-warm-400 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {contacts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-100 dark:bg-ink-700">
              <UserPlus className="h-8 w-8 text-primary/70" />
            </div>
            <p className="mb-2 text-sm font-semibold text-warm-700 dark:text-warm-100">
              Add your first contact
            </p>
            <p className="text-xs leading-relaxed text-warm-500 dark:text-warm-300">
              Search by username above to start chatting securely
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {contacts.map((contact) => {
              const isActive = activeContact?.id === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    setActiveContact(contact);
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={`relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-sage-100/90 dark:bg-ink-700 shadow-soft'
                      : 'hover:bg-sage-50 dark:hover:bg-ink-800'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient" />
                  )}
                  <div className="avatar-disc h-12 w-12 flex-shrink-0 text-lg">
                    {contact.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-semibold ${
                        isActive
                          ? 'text-primary-dark dark:text-primary-light'
                          : 'text-warm-800 dark:text-warm-50'
                      }`}
                    >
                      {contact.username}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-warm-500 dark:text-warm-300">
                      <Lock className="h-3 w-3 text-primary/60" />
                      Encrypted chat
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
