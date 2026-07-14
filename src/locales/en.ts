// English translation. Same voice rules as de.ts: concrete mechanisms
// instead of superlatives, no exclamation marks, short declarative
// sentences. Every technical claim matches the code. No institutional
// "we" — the subject is the app, the server, the mechanism, or "you".

import type { Copy } from './de';

const tagline = 'Encrypted by you. Unreadable on the server.';

const en: Copy = {
  brand: {
    name: 'ValCrypta',
    tagline,
  },

  landing: {
    kicker: 'End-to-end encrypted messenger',
    heroLine1: 'Messages',
    heroLine2Pre: 'no one ',
    heroEmphasis: 'reads.',
    heroSub:
      'ValCrypta encrypts every message on your device. ' +
      'The server stores only ciphertext.',
    ctaPrimary: 'Create account',
    ctaSecondary: 'Sign in',
    context: {
      kicker: 'Context',
      title: 'Chat control is here. A reason to rethink, not to panic.',
      body: [
        'Under the banner of chat control, the EU wants private messages scanned automatically. The watered-down version lets large services voluntarily scan unencrypted content. End-to-end encrypted messages fall outside that scanning surface.',
        "The stricter variant would scan directly on the device — before anything is even encrypted. It hasn't been adopted and remains contested. Until then: what your device encrypts before it leaves stays between you and the other person.",
      ],
      note:
        "This is not a miracle cure and not a replacement for the big services. It's a retreat for the conversations that really only concern two people.",
    },
    purpose: {
      kicker: 'Why this exists',
      title: 'A tool, not a product',
      body: [
        "ValCrypta is not a company, an organization, or an authority — and not a club you join either. It's a private, non-commercial tool with one goal: protecting free speech. For anyone who wants to protect it.",
        'A conversation should be able to stay private because no one reads along — no server, no third party, and not the person who runs ValCrypta either. Nothing is sold, there is no advertising and no tracking.',
        'The entire source code is open and licensed under AGPL-3.0. Verifiable instead of taken on faith: every technical claim on this page can be checked in the code.',
      ],
      responsibility:
        'ValCrypta only provides the tool. What you write with it, and to whom, is your responsibility.',
    },
    levels: {
      kicker: 'Three levels',
      title: 'As much protection as you need',
      sub: 'Security and convenience are a trade-off. You decide — and can change the level in settings at any time.',
    },
    how: {
      kicker: 'Protocol',
      title: 'How ValCrypta works',
      steps: [
        {
          num: '01',
          claim: 'Keys are generated on your device',
          body: 'When you register, your browser generates an RSA-OAEP-2048 key pair. The private key is encrypted with your password (PBKDF2, 100,000 iterations). It never leaves your device in plain text.',
        },
        {
          num: '02',
          claim: 'The server only sees ciphertext',
          body: 'Every message and every file is encrypted with a fresh AES-256-GCM key before it leaves your device. Only the result is stored.',
        },
        {
          num: '03',
          claim: 'Deleting means deleting',
          body: 'You delete messages for both sides. Encrypted files are removed from storage too, not just hidden.',
        },
      ],
    },
    specs: ['AES-256-GCM', 'RSA-OAEP-2048', 'PBKDF2 · 100.000', 'Zero-Knowledge'],
    storage: {
      kicker: 'Data balance',
      title: "What the server stores — and what it doesn't",
      sub: 'The complete list. There is no second one.',
      weStore: {
        title: 'On the server',
        items: ['Email address', 'Username', 'Public key', 'Ciphertext'],
      },
      weDont: {
        title: 'Never on the server',
        items: ['Plaintext of your messages', 'Private keys', 'Metadata profiles', 'Advertising data'],
      },
    },
    install: {
      kicker: 'As an app',
      title: 'On your home screen, like an app',
      body:
        'ValCrypta is a web app and installs straight from the browser — no app store, nothing to download. Updates arrive automatically. Installed, it opens in its own window, like a native app.',
      button: 'Install',
      genericHint:
        'Installation is offered in the browser menu — in Chrome, for example, via “Install” in the address bar.',
      alreadyInstalled: 'Already installed.',
    },
    finalCta: {
      pre: 'A conversation that stays ',
      emphasis: 'private',
      post: '.',
      button: 'Create account',
    },
    footerLegal: '© 2026 ValCrypta',
    openSource: {
      label: 'Open source · AGPL-3.0',
      linkText: 'View source code',
      url: 'https://github.com/restitutio777/valcrypta',
    },
  },

  common: {
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    loading: 'Loading …',
    languageTooltip: 'Switch language',
  },

  login: {
    title: 'Welcome back',
    subtitle: tagline,
    submit: 'Sign in',
    submitting: 'Signing in …',
    noAccount: "Don't have an account?",
    toSignup: 'Sign up',
    footnote: 'End-to-end encrypted · Keys stay on your device',
    errFailed: 'Sign-in failed',
    errNoProfile: 'No user profile found',
    errNoKey:
      'This device has no key for this account, and no cloud backup exists. Sign in on your original device and enable a backup there in the security settings.',
    errGeneric: 'An error occurred while signing in',
  },

  signup: {
    title: 'Create account',
    subtitle: tagline,
    warningTitle: 'Important:',
    warningBody:
      ' Your password encrypts your messages. If you lose it, your messages cannot be recovered. Keep it safe.',
    username: 'Username',
    usernamePlaceholder: 'username',
    confirmPassword: 'Confirm password',
    submit: 'Sign up',
    submitting: 'Creating account …',
    haveAccount: 'Already have an account?',
    toLogin: 'Sign in',
    errMismatch: "The passwords don't match",
    errWeak: 'The password is too weak. Please choose a stronger one.',
    errShort: 'The password needs at least 12 characters',
    errUsername: 'The username needs at least 3 characters',
    errFailed: 'Sign-up failed',
    errSession: 'Session not established. Please sign in.',
    errProfile: 'Profile could not be created',
    errGeneric: 'An error occurred during sign-up',
    strength: ['Very weak', 'Very weak', 'Weak', 'Okay', 'Good', 'Strong'],
  },

  unlock: {
    title: 'Unlock',
    subtitle: 'Your password decrypts your private key',
    submit: 'Unlock',
    submitting: 'Unlocking …',
    errWrongPassword: 'Wrong password. Please try again.',
    errNoKey: 'No private key found on this device. Please sign in again.',
    errNoProfile: 'No user profile found',
    errGeneric: 'Unlock failed',
    signOut: 'Sign out and use another account',
  },

  security: {
    title: 'Security level',
    subtitle: 'Choose your balance of protection and convenience',
    active: 'Active',
    levels: {
      maximum: {
        name: 'Maximum',
        tagline: 'Everything stays on this device',
        points: [
          'Password required after every page reload',
          'No cloud backup — if this device is lost, the messages are lost',
        ],
      },
      balanced: {
        name: 'Balanced',
        tagline: 'Recommended for most people',
        points: [
          'Stays unlocked as long as this tab is open',
          'Encrypted key backup — sign in on any device with your password',
        ],
      },
      comfort: {
        name: 'Comfort',
        tagline: 'Open and write, no password prompt',
        points: [
          'Stays unlocked on this device until you sign out',
          'Encrypted key backup — sign in on any device with your password',
        ],
      },
    },
    footnote:
      'The cloud backup is your key, encrypted with your password on this device — the server can never read it. Your messages stay end-to-end encrypted at every level.',
    notifyMaximum: 'Maximum security enabled. Cloud backup removed.',
    notifyEnabled: (level: string) => `Level "${level}" enabled. Encrypted backup saved.`,
    notifyBackupFailed: 'Level changed, but the cloud backup could not be saved right now.',
    notifyError: 'The security level could not be changed',
    confirmPrompt: (level: string) =>
      `Confirm your password to switch to "${level}". Your key will be re-encrypted and stored for this.`,
    confirmSubmit: 'Activate level',
    confirmCancel: 'Cancel',
    errWrongPassword: 'Wrong password',
    errNoKey: 'No encrypted key found — please sign in again',
  },

  encryption: {
    title: 'How the encryption works',
    s1Title: 'Your messages are private',
    s1Body:
      'ValCrypta encrypts end-to-end: only you and the other person can read a message. No server and no third party.',
    s2Title: 'Two keys',
    s2Body: 'When you register, your device generates a key pair:',
    s2Points: [
      ['Public key:', ' shared so others can encrypt messages to you'],
      ['Private key:', ' stays on your device, encrypted with your password. Only it can decrypt messages.'],
    ],
    s3Title: 'What this means in practice',
    s3Points: [
      'Messages are encrypted on your device before they reach the server',
      'The server stores only ciphertext',
      'If you lose your password, your messages cannot be recovered',
      'Your private key never leaves your device in plain text',
    ],
    techTitle: 'Technical details',
    techBody:
      'Every message gets a fresh AES-256-GCM key, wrapped with RSA-OAEP-2048 for both recipient and sender. Your private key is protected with AES-256-GCM; the wrapping key is derived from your password via PBKDF2 with 100,000 iterations.',
  },

  chat: {
    emptyTitle: 'Choose a contact',
    emptySub: 'Search for a username on the left',
    emptyBadge: 'All messages are end-to-end encrypted',
    noMessages: 'No messages yet. Write the first one.',
    loadingMessages: 'Loading messages …',
    inputPlaceholder: 'Write an encrypted message …',
    send: 'Send',
    attach: 'Attach file',
    deleteConfirm: 'Delete for both?',
    delete: 'Delete',
    cancel: 'Cancel',
    deleteTooltip: 'Delete for both sides',
    e2eBadge: 'End-to-end encrypted',
    backToChats: 'Back to chats',
    encryptedChat: 'Encrypted chat',
    sentMessage: '[Sent message]',
    cantDecrypt: '[Could not be decrypted]',
    encryptedFile: 'Encrypted file',
    imageError: 'Image could not be loaded',
    downloadFile: 'Download file',
    openImage: 'Open image',
    close: 'Close',
    errLoad: 'Messages could not be loaded',
    errSend: 'Message could not be sent',
    errSendFile: 'File could not be sent',
    errDelete: 'Message could not be deleted',
    errFileTooLarge: 'File is too large (max. 25 MB)',
  },

  keyVerify: {
    changedTitle: 'Warning: key has changed',
    changedBody: (name: string) =>
      `The encryption code for "${name}" is no longer the same as last time. This can be harmless (new account, new device) — or someone is trying to intercept the conversation. Sending is blocked as a precaution until you confirm the new key.`,
    changedHint: 'Safest: compare the new fingerprint over another channel (call, in person) before confirming.',
    changedOldLabel: 'Previous fingerprint',
    changedNewLabel: 'New fingerprint',
    changedAccept: 'Trust new key',
    verifyTooltip: 'Verify encryption',
    verifyTitle: 'Verify encryption',
    verifyBody:
      'Every key has a unique fingerprint. Read the fingerprints to each other over another channel (call, in person): if both match, no one — not even the server — could have intercepted the connection.',
    verifyMine: 'Your fingerprint',
    verifyTheirs: (name: string) => `Fingerprint of "${name}"`,
    verifyClose: 'Got it',
    errCheck: 'Key verification failed',
  },

  pwa: {
    title: 'Install ValCrypta',
    body: 'Add ValCrypta to your home screen — it opens like an app, in its own window.',
    iosHintPre: 'To install',
    iosHintShare: '“Share”',
    iosHintAdd: '→ “Add to Home Screen”.',
    install: 'Install',
    dismiss: 'Not now',
  },

  sidebar: {
    searchPlaceholder: 'Find people by username …',
    noUsers: 'No users found',
    alreadyContact: 'Already connected — tap to open',
    tapToChat: 'Tap to start writing',
    contactAdded: 'Contact added',
    emptyTitle: 'Your first chat',
    emptyBody: 'Enter a username above — one tap connects you, end-to-end encrypted.',
    errSearch: 'Search failed',
    infoTooltip: 'How the encryption works',
    securityTooltip: 'Security level',
    darkModeTooltip: 'Toggle dark mode',
    logoutTooltip: 'Sign out',
  },
};

export default en;
