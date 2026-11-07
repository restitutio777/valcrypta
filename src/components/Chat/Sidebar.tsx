import { useState, useEffect } from 'react';
import { Search, UserPlus, Lock, Info, Moon, Sun, LogOut, Settings2, X } from 'lucide-react';
import { supabase, Database } from '../../lib/supabase';
import { useChatStore } from '../../stores/chat-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { clearUnlockedKey } from '../../lib/key-session';
import ValCryptaLogo from '../ValCryptaLogo';
import LanguageSwitcher from '../LanguageSwitcher';
import Avatar from './Avatar';
import { useCopy } from '../../lib/use-copy';

type UserRow = Database['public']['Tables']['users']['Row'];

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ownUsername, setOwnUsername] = useState<string | null>(null);
  const { sidebar, chat } = useCopy();

  const { contacts, activeContact, setContacts, setActiveContact, addContact, clearChat } =
    useChatStore();
  const { user, clearAuth } = useAuthStore();
  const {
    setNotification,
    darkMode,
    toggleDarkMode,
    setShowEncryptionInfo,
    setShowSecuritySettings,
  } = useUIStore();

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  // Own profile name for the account row at the bottom of the sidebar.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setOwnUsername(data.username);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

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
        .select('id, username, public_key, created_at')
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
        .select('id, username, public_key, created_at')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id || '')
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        setNotification({ message: sidebar.errSearch, type: 'error' });
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (err) {
      console.error('Search exception:', err);
      setNotification({ message: sidebar.errSearch, type: 'error' });
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
      return;
    }

    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      contact_id: contact.id,
    });

    if (!error) {
      addContact(contact);
      setActiveContact(contact);
      setNotification({ message: sidebar.contactAdded, type: 'success' });
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogout = async () => {
    // The encrypted private key stays in IndexedDB on purpose — it may be
    // the only copy in existence and is protected by the user's password.
    // Only the *unlocked* session copy is wiped.
    if (user) {
      await clearUnlockedKey(user.id);
    }
    await supabase.auth.signOut();
    clearChat();
    clearAuth();
  };

  const showNoResults = searchQuery.length >= 2 && !isSearching && searchResults.length === 0;

  return (
    <div className="flex h-full flex-col border-r border-porcelain-200/80 bg-porcelain-100/80 dark:border-ink-700/60 dark:bg-ink-900">
      {/* Header: brand + the two global view toggles */}
      <div className="relative px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-4 flex items-center justify-between">
          <ValCryptaLogo size="md" showText={true} />
          <div className="-mr-1 flex items-center">
            <button
              onClick={() => setShowEncryptionInfo(true)}
              className="btn-ghost-icon"
              title={sidebar.infoTooltip}
              aria-label={sidebar.infoTooltip}
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="btn-ghost-icon"
              title={sidebar.darkModeTooltip}
              aria-label={sidebar.darkModeTooltip}
            >
              {darkMode ? <Sun className="h-5 w-5 text-brass-300" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="group relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-porcelain-500 transition-colors group-focus-within:text-brass-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSearch();
            }}
            placeholder={sidebar.searchPlaceholder}
            aria-label={sidebar.searchPlaceholder}
            className="input-field rounded-full py-2.5 pl-10 pr-10 shadow-soft dark:shadow-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isSearching && searchQuery.length >= 2 ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brass-400 border-t-transparent" />
            ) : searchQuery.length > 0 ? (
              <button
                type="button"
                onClick={clearSearch}
                className="flex h-6 w-6 items-center justify-center rounded-full text-porcelain-500 transition-colors hover:bg-porcelain-200 hover:text-ink-900 dark:hover:bg-ink-700 dark:hover:text-porcelain-50"
                aria-label={chat.cancel}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {showNoResults && (
          <div className="glass-card animate-pop-in absolute left-4 right-4 z-50 mt-2 rounded-2xl p-4 shadow-lift">
            <p className="text-center text-sm text-porcelain-600 dark:text-porcelain-300">{sidebar.noUsers}</p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="glass-card animate-pop-in absolute left-4 right-4 z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl p-1.5 shadow-lift">
            {searchResults.map((result) => {
              const isAlreadyContact = contacts.find((c) => c.id === result.id);
              return (
                <button
                  key={result.id}
                  onClick={() => handleAddContact(result)}
                  className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-porcelain-100 focus-visible:bg-porcelain-100 focus-visible:outline-none dark:hover:bg-ink-700/60 dark:focus-visible:bg-ink-700/60"
                >
                  <Avatar name={result.username} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900 dark:text-porcelain-50">
                      {result.username}
                    </p>
                    <p className="truncate text-xs text-porcelain-600 dark:text-porcelain-400">
                      {isAlreadyContact ? sidebar.alreadyContact : sidebar.tapToChat}
                    </p>
                  </div>
                  <UserPlus className="h-5 w-5 flex-shrink-0 text-porcelain-500 transition-colors duration-200 group-hover:text-brass-500" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {contacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
            <span className="owl-mark mb-5 w-24 opacity-40" aria-hidden="true" />
            <p className="mb-1.5 font-semibold text-ink-900 dark:text-porcelain-100">
              {sidebar.emptyTitle}
            </p>
            <p className="max-w-[16rem] text-sm leading-relaxed text-porcelain-600 dark:text-porcelain-400">
              {sidebar.emptyBody}
            </p>
          </div>
        ) : (
          <>
            <p className="spec-label flex items-center justify-between px-3 pb-2 pt-3">
              <span>{sidebar.chatsLabel}</span>
              <span className="tabular-nums">{contacts.length}</span>
            </p>
            <ul className="space-y-0.5">
              {contacts.map((contact) => {
                const isActive = activeContact?.id === contact.id;
                return (
                  <li key={contact.id}>
                    <button
                      onClick={() => setActiveContact(contact)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/60 ${
                        isActive
                          ? 'bg-porcelain-50 shadow-soft ring-1 ring-porcelain-200 dark:bg-ink-800 dark:shadow-none dark:ring-ink-700'
                          : 'hover:bg-porcelain-200/50 active:bg-porcelain-200/80 dark:hover:bg-ink-800/60 dark:active:bg-ink-800'
                      }`}
                    >
                      <Avatar name={contact.username} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink-900 dark:text-porcelain-50">
                          {contact.username}
                        </p>
                        <p className="flex items-center gap-1 truncate text-[13px] text-porcelain-600 dark:text-porcelain-400">
                          <Lock className="h-3 w-3 flex-shrink-0 text-brass-500 dark:text-brass-400" />
                          {chat.encryptedChat}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Account row: who is signed in, language, security, sign-out */}
      <div className="flex items-center gap-3 border-t border-porcelain-200/80 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-ink-700/60">
        {ownUsername && <Avatar name={ownUsername} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-ink-900 dark:text-porcelain-100">
            {ownUsername ?? ' '}
          </p>
          <LanguageSwitcher className="-ml-1.5 [&_button]:py-0 [&_button]:text-[11px]" />
        </div>
        <button
          onClick={() => setShowSecuritySettings(true)}
          className="btn-ghost-icon"
          title={sidebar.securityTooltip}
          aria-label={sidebar.securityTooltip}
        >
          <Settings2 className="h-5 w-5" />
        </button>
        <button
          onClick={handleLogout}
          className="btn-ghost-icon -ml-2"
          title={sidebar.logoutTooltip}
          aria-label={sidebar.logoutTooltip}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
