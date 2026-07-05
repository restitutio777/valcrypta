// Alle sichtbaren Texte. Eine spätere EN-Fassung ersetzt ausschließlich diese Datei.
//
// Stimmregeln: konkrete Mechanismen statt Superlative, keine Ausrufezeichen,
// kurze Aussagesätze. Jede technische Behauptung entspricht dem Code.
//
// Kein institutionelles "wir": ValCrypta ist keine Firma, NGO oder Behörde,
// sondern ein privates, nicht kommerzielles Projekt. Subjekt ist die App,
// der Server, der Mechanismus oder du — nie ein Betreiber-"wir".

export const brand = {
  name: 'ValCrypta',
  tagline: 'Von dir verschlüsselt. Auf dem Server unlesbar.',
} as const;

export const landing = {
  kicker: 'Ende-zu-Ende-verschlüsselter Messenger',
  heroLine1: 'Nachrichten,',
  heroLine2Pre: 'die niemand ',
  heroEmphasis: 'mitliest.', // set in gradient display ink
  heroSub:
    'ValCrypta verschlüsselt jede Nachricht auf deinem Gerät. ' +
    'Der Server speichert nur Chiffretext.',
  ctaPrimary: 'Konto erstellen',
  ctaSecondary: 'Anmelden',
  // Zweck des Projekts: kein Produkt, keine Firma. Warum es das gibt.
  purpose: {
    kicker: 'Warum es das gibt',
    title: 'Ein privates Projekt, kein Produkt',
    body: [
      'ValCrypta ist keine Firma, keine Organisation und keine Behörde. Es ist ein privates, nicht kommerzielles Projekt mit einem Ziel: Redefreiheit schützen.',
      'Ein Gespräch soll privat bleiben können, weil niemand mitliest — kein Server, kein Dritter und auch nicht die Person, die ValCrypta betreibt. Nichts wird verkauft, es gibt keine Werbung und kein Tracking.',
    ],
    responsibility:
      'ValCrypta stellt nur das Werkzeug bereit. Was du damit schreibst und mit wem, verantwortest du selbst.',
  },
  // Drei Stufen auf der Landingpage — dieselbe Quelle wie im Einstellungs-Modal.
  levels: {
    kicker: 'Drei Stufen',
    title: 'So viel Schutz, wie du brauchst',
    sub: 'Sicherheit und Komfort sind ein Abwägen. Du entscheidest — und kannst die Stufe jederzeit in den Einstellungen ändern.',
  },
  how: {
    title: 'Wie ValCrypta funktioniert',
    steps: [
      {
        num: '01',
        claim: 'Schlüssel entstehen auf deinem Gerät',
        body: 'Beim Registrieren erzeugt dein Browser ein RSA-OAEP-2048-Schlüsselpaar. Der private Schlüssel wird mit deinem Passwort verschlüsselt (PBKDF2, 100.000 Iterationen). Im Klartext verlässt er dein Gerät nie.',
      },
      {
        num: '02',
        claim: 'Der Server sieht nur Chiffretext',
        body: 'Jede Nachricht und jede Datei wird mit einem frischen AES-256-GCM-Schlüssel verschlüsselt, bevor sie dein Gerät verlässt. Gespeichert wird ausschließlich das Ergebnis.',
      },
      {
        num: '03',
        claim: 'Löschen heißt löschen',
        body: 'Du löschst Nachrichten für beide Seiten. Auch verschlüsselte Dateien werden vom Speicher entfernt, nicht nur ausgeblendet.',
      },
    ],
  },
  specs: ['AES-256-GCM', 'RSA-OAEP-2048', 'PBKDF2 · 100.000', 'Zero-Knowledge'],
  storage: {
    kicker: 'Datenbilanz',
    title: 'Was der Server speichert — und was nicht',
    sub: 'Die vollständige Liste. Es gibt keine zweite.',
    weStore: {
      title: 'Auf dem Server',
      items: ['E-Mail-Adresse', 'Nutzername', 'Öffentlicher Schlüssel', 'Chiffretext'],
    },
    weDont: {
      title: 'Niemals auf dem Server',
      items: ['Klartext deiner Nachrichten', 'Private Schlüssel', 'Metadaten-Profile', 'Werbedaten'],
    },
  },
  finalCta: {
    pre: 'Ein Gespräch, das ',
    emphasis: 'privat',
    post: ' bleibt.',
    button: 'Konto erstellen',
  },
  footerLegal: '© 2026 ValCrypta',
} as const;

export const common = {
  email: 'E-Mail',
  emailPlaceholder: 'du@beispiel.de',
  password: 'Passwort',
  passwordPlaceholder: '••••••••',
  loading: 'Lädt …',
} as const;

export const login = {
  title: 'Willkommen zurück',
  subtitle: brand.tagline,
  submit: 'Anmelden',
  submitting: 'Anmeldung läuft …',
  noAccount: 'Noch kein Konto?',
  toSignup: 'Registrieren',
  footnote: 'Ende-zu-Ende verschlüsselt · Schlüssel bleiben auf deinem Gerät',
  errFailed: 'Anmeldung fehlgeschlagen',
  errNoProfile: 'Kein Nutzerprofil gefunden',
  errNoKey:
    'Auf diesem Gerät liegt kein Schlüssel für dieses Konto, und es existiert kein Cloud-Backup. Melde dich auf deinem ursprünglichen Gerät an und aktiviere dort ein Backup in den Sicherheitseinstellungen.',
  errGeneric: 'Bei der Anmeldung ist ein Fehler aufgetreten',
} as const;

export const signup = {
  title: 'Konto erstellen',
  subtitle: brand.tagline,
  warningTitle: 'Wichtig:',
  warningBody:
    ' Dein Passwort verschlüsselt deine Nachrichten. Geht es verloren, sind deine Nachrichten nicht wiederherstellbar. Bewahre es sicher auf.',
  username: 'Nutzername',
  usernamePlaceholder: 'nutzername',
  confirmPassword: 'Passwort bestätigen',
  submit: 'Registrieren',
  submitting: 'Konto wird erstellt …',
  haveAccount: 'Schon ein Konto?',
  toLogin: 'Anmelden',
  errMismatch: 'Die Passwörter stimmen nicht überein',
  errWeak: 'Das Passwort ist zu schwach. Bitte wähle ein stärkeres.',
  errShort: 'Das Passwort braucht mindestens 12 Zeichen',
  errUsername: 'Der Nutzername braucht mindestens 3 Zeichen',
  errFailed: 'Registrierung fehlgeschlagen',
  errSession: 'Sitzung nicht hergestellt. Bitte melde dich an.',
  errProfile: 'Profil konnte nicht erstellt werden',
  errGeneric: 'Bei der Registrierung ist ein Fehler aufgetreten',
  // Ersetzt das englische Feedback aus crypto.ts: Index = min(score, 5)
  strength: ['Sehr schwach', 'Sehr schwach', 'Schwach', 'Okay', 'Gut', 'Stark'],
} as const;

export const unlock = {
  title: 'Entsperren',
  subtitle: 'Dein Passwort entschlüsselt deinen privaten Schlüssel',
  submit: 'Entsperren',
  submitting: 'Entsperren …',
  errWrongPassword: 'Falsches Passwort. Bitte versuche es erneut.',
  errNoKey: 'Kein privater Schlüssel auf diesem Gerät gefunden. Bitte melde dich neu an.',
  errNoProfile: 'Kein Nutzerprofil gefunden',
  errGeneric: 'Entsperren fehlgeschlagen',
  signOut: 'Abmelden und anderes Konto verwenden',
} as const;

export const security = {
  title: 'Sicherheitsstufe',
  subtitle: 'Wähle dein Verhältnis von Schutz und Komfort',
  active: 'Aktiv',
  levels: {
    maximum: {
      name: 'Maximal',
      tagline: 'Alles bleibt auf diesem Gerät',
      points: [
        'Passwort nach jedem Neuladen der Seite erforderlich',
        'Kein Cloud-Backup — geht dieses Gerät verloren, gehen die Nachrichten verloren',
      ],
    },
    balanced: {
      name: 'Ausgewogen',
      tagline: 'Empfohlen für die meisten',
      points: [
        'Bleibt entsperrt, solange dieser Tab offen ist',
        'Verschlüsseltes Schlüssel-Backup — Anmeldung auf jedem Gerät mit deinem Passwort',
      ],
    },
    comfort: {
      name: 'Komfort',
      tagline: 'Öffnen und schreiben, ohne Passwortabfrage',
      points: [
        'Bleibt auf diesem Gerät entsperrt, bis du dich abmeldest',
        'Verschlüsseltes Schlüssel-Backup — Anmeldung auf jedem Gerät mit deinem Passwort',
      ],
    },
  },
  footnote:
    'Das Cloud-Backup ist dein Schlüssel, verschlüsselt mit deinem Passwort auf diesem Gerät — der Server kann es nie lesen. Deine Nachrichten bleiben auf jeder Stufe Ende-zu-Ende verschlüsselt.',
  notifyMaximum: 'Maximale Sicherheit aktiviert. Cloud-Backup entfernt.',
  notifyEnabled: (level: string) => `Stufe „${level}" aktiviert. Verschlüsseltes Backup gespeichert.`,
  notifyBackupFailed: 'Stufe geändert, aber das Cloud-Backup konnte gerade nicht gespeichert werden.',
  notifyError: 'Die Sicherheitsstufe konnte nicht geändert werden',
  confirmPrompt: (level: string) =>
    `Bestätige dein Passwort, um auf „${level}" zu wechseln. Dein Schlüssel wird dafür neu verschlüsselt abgelegt.`,
  confirmSubmit: 'Stufe aktivieren',
  confirmCancel: 'Abbrechen',
  errWrongPassword: 'Falsches Passwort',
  errNoKey: 'Kein verschlüsselter Schlüssel gefunden — bitte neu anmelden',
} as const;

export const encryption = {
  title: 'So funktioniert die Verschlüsselung',
  s1Title: 'Deine Nachrichten sind privat',
  s1Body:
    'ValCrypta verschlüsselt Ende-zu-Ende: Lesen können eine Nachricht nur du und dein Gegenüber. Kein Server und kein Dritter.',
  s2Title: 'Zwei Schlüssel',
  s2Body: 'Bei der Registrierung erzeugt dein Gerät ein Schlüsselpaar:',
  s2Points: [
    ['Öffentlicher Schlüssel:', ' wird geteilt, damit andere Nachrichten an dich verschlüsseln können'],
    ['Privater Schlüssel:', ' bleibt auf deinem Gerät, verschlüsselt mit deinem Passwort. Nur er kann Nachrichten entschlüsseln.'],
  ],
  s3Title: 'Was das konkret bedeutet',
  s3Points: [
    'Nachrichten werden auf deinem Gerät verschlüsselt, bevor sie den Server erreichen',
    'Der Server speichert ausschließlich Chiffretext',
    'Geht dein Passwort verloren, sind deine Nachrichten nicht wiederherstellbar',
    'Dein privater Schlüssel verlässt dein Gerät nie im Klartext',
  ],
  techTitle: 'Technische Details',
  techBody:
    'Jede Nachricht erhält einen frischen AES-256-GCM-Schlüssel, der per RSA-OAEP-2048 für Empfänger und Absender verpackt wird. Dein privater Schlüssel ist mit AES-256-GCM geschützt; der Schutzschlüssel wird per PBKDF2 mit 100.000 Iterationen aus deinem Passwort abgeleitet.',
} as const;

export const chat = {
  emptyTitle: 'Wähle einen Kontakt',
  emptySub: 'Suche links nach Nutzernamen',
  emptyBadge: 'Alle Nachrichten sind Ende-zu-Ende verschlüsselt',
  noMessages: 'Noch keine Nachrichten. Schreib die erste.',
  loadingMessages: 'Nachrichten werden geladen …',
  inputPlaceholder: 'Verschlüsselte Nachricht schreiben …',
  send: 'Senden',
  attach: 'Datei anhängen',
  deleteConfirm: 'Für beide löschen?',
  delete: 'Löschen',
  cancel: 'Abbrechen',
  deleteTooltip: 'Für beide Seiten löschen',
  e2eBadge: 'Ende-zu-Ende verschlüsselt',
  backToChats: 'Zurück zu den Chats',
  encryptedChat: 'Verschlüsselter Chat',
  sentMessage: '[Gesendete Nachricht]',
  cantDecrypt: '[Konnte nicht entschlüsselt werden]',
  encryptedFile: 'Verschlüsselte Datei',
  imageError: 'Bild konnte nicht geladen werden',
  downloadFile: 'Datei herunterladen',
  openImage: 'Bild öffnen',
  close: 'Schließen',
  errLoad: 'Nachrichten konnten nicht geladen werden',
  errSend: 'Nachricht konnte nicht gesendet werden',
  errSendFile: 'Datei konnte nicht gesendet werden',
  errDelete: 'Nachricht konnte nicht gelöscht werden',
  errFileTooLarge: 'Datei ist zu groß (max. 25 MB)',
} as const;

export const sidebar = {
  searchPlaceholder: 'Personen per Nutzername finden …',
  noUsers: 'Keine Nutzer gefunden',
  alreadyContact: 'Bereits verbunden — tippen zum Öffnen',
  tapToChat: 'Tippen, um zu schreiben',
  contactAdded: 'Kontakt hinzugefügt',
  emptyTitle: 'Dein erster Chat',
  emptyBody: 'Gib oben einen Nutzernamen ein — ein Tipp verbindet euch, Ende-zu-Ende verschlüsselt.',
  errSearch: 'Suche fehlgeschlagen',
  infoTooltip: 'So funktioniert die Verschlüsselung',
  securityTooltip: 'Sicherheitsstufe',
  darkModeTooltip: 'Dunkelmodus umschalten',
  logoutTooltip: 'Abmelden',
} as const;
