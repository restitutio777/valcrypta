import { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
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
    <div className="h-full bg-warm-50 dark:bg-slate-800 border-r border-warm-200 dark:border-slate-700 flex flex-col">
      <div className="p-4 border-b border-warm-200 dark:border-slate-700 relative">
        <div className="mb-4">
          <ValCryptaLogo size="md" showText={true} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users to start chatting..."
            className="w-full pl-10 pr-4 py-2 border border-warm-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-700 text-warm-800 dark:text-slate-100 text-sm"
          />
          {isSearching && searchQuery.length >= 2 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className="absolute left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-700 border border-warm-200 dark:border-slate-600 rounded-lg shadow-lg p-4">
            <p className="text-sm text-warm-500 dark:text-warm-300 text-center">No users found</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-700 border border-warm-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((result) => {
              const isAlreadyContact = contacts.find((c) => c.id === result.id);
              return (
                <button
                  key={result.id}
                  onClick={() => handleAddContact(result)}
                  className="w-full p-3 hover:bg-warm-100 dark:hover:bg-slate-600 flex items-center gap-3 border-b border-warm-100 dark:border-slate-600 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <span className="text-primary dark:text-primary-light font-semibold">
                      {result.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-warm-800 dark:text-warm-50">
                      {result.username}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-300">
                      {isAlreadyContact ? 'Already connected' : result.email}
                    </p>
                  </div>
                  <UserPlus className="w-4 h-4 text-warm-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-warm-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-warm-600 dark:text-warm-200 text-sm font-medium mb-2">
              Add your first contact
            </p>
            <p className="text-warm-500 dark:text-warm-300 text-xs">
              Search by username above to start chatting securely
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                setActiveContact(contact);
                if (window.innerWidth < 1024) {
                  toggleSidebar();
                }
              }}
              className={`w-full p-4 flex items-center gap-3 hover:bg-warm-100 dark:hover:bg-slate-700 transition-colors border-b border-warm-100 dark:border-slate-700 ${
                activeContact?.id === contact.id
                  ? 'bg-primary/10 dark:bg-slate-700/50'
                  : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary dark:text-primary-light font-semibold text-lg">
                  {contact.username[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-warm-800 dark:text-warm-50 truncate">
                  {contact.username}
                </p>
                <p className="text-sm text-warm-500 dark:text-warm-300 truncate">
                  Encrypted chat
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
