// Traduction française. Mêmes règles de ton que de.ts : des mécanismes
// concrets plutôt que des superlatifs, pas de points d'exclamation, des
// phrases déclaratives courtes. Chaque affirmation technique correspond
// au code. Pas de « nous » institutionnel — le sujet est l'app, le
// serveur, le mécanisme, ou « tu ».

import type { Copy } from './de';

const tagline = 'Chiffré par toi. Illisible sur le serveur.';

const fr: Copy = {
  brand: {
    name: 'ValCrypta',
    tagline,
  },

  landing: {
    kicker: 'Messagerie chiffrée de bout en bout',
    heroLine1: 'Des messages',
    heroLine2Pre: 'que personne ',
    heroEmphasis: 'ne lit.',
    heroSub:
      'ValCrypta chiffre chaque message sur ton appareil. ' +
      'Le serveur ne stocke que du texte chiffré.',
    ctaPrimary: 'Créer un compte',
    ctaSecondary: 'Se connecter',
    context: {
      kicker: 'Contexte',
      title: 'Le contrôle des chats est là. Une raison de repenser les choses, pas de paniquer.',
      body: [
        "Sous le nom de contrôle des chats (règlement CSAR), l'UE veut faire analyser automatiquement les messages privés. La version assouplie permet aux grands services de scanner volontairement les contenus non chiffrés. Les messages chiffrés de bout en bout ne font pas partie de ce périmètre de scan.",
        "La variante plus stricte scannerait directement sur l'appareil — avant même le chiffrement. Elle n'a pas été adoptée et reste controversée. D'ici là : ce que ton appareil chiffre avant qu'il ne le quitte reste entre toi et ton interlocuteur.",
      ],
      note:
        "Ce n'est pas une solution miracle ni un remplacement des grands services. C'est un espace de repli pour les conversations qui ne regardent vraiment que deux personnes.",
    },
    purpose: {
      kicker: 'Pourquoi ce projet existe',
      title: 'Un outil, pas un produit',
      body: [
        "ValCrypta n'est ni une entreprise, ni une organisation, ni une autorité — et ce n'est pas non plus un club auquel on adhère. C'est un outil privé, non commercial, avec un seul but : protéger la liberté d'expression. Pour quiconque veut la protéger.",
        "Une conversation doit pouvoir rester privée parce que personne ne la lit — ni serveur, ni tiers, ni même la personne qui fait tourner ValCrypta. Rien n'est vendu, il n'y a ni publicité ni pistage.",
        "Tout le code source est ouvert et publié sous licence AGPL-3.0. Vérifiable plutôt que basé sur la confiance : chaque affirmation technique de cette page peut être vérifiée dans le code.",
      ],
      responsibility:
        "ValCrypta ne fournit que l'outil. Ce que tu écris avec, et à qui, relève de ta responsabilité.",
    },
    levels: {
      kicker: 'Trois niveaux',
      title: 'Autant de protection que nécessaire',
      sub: "Sécurité et confort sont un compromis. C'est toi qui décides — et tu peux changer de niveau à tout moment dans les réglages.",
    },
    how: {
      kicker: 'Protocole',
      title: 'Comment fonctionne ValCrypta',
      steps: [
        {
          num: '01',
          claim: 'Les clés naissent sur ton appareil',
          body: "Lors de l'inscription, ton navigateur génère une paire de clés RSA-OAEP-2048. La clé privée est chiffrée avec ton mot de passe (PBKDF2, 100 000 itérations). Elle ne quitte jamais ton appareil en clair.",
        },
        {
          num: '02',
          claim: 'Le serveur ne voit que du texte chiffré',
          body: "Chaque message et chaque fichier est chiffré avec une clé AES-256-GCM nouvellement générée avant de quitter ton appareil. Seul le résultat est stocké.",
        },
        {
          num: '03',
          claim: 'Supprimer veut dire supprimer',
          body: "Tu supprimes les messages des deux côtés. Les fichiers chiffrés sont eux aussi retirés du stockage, pas seulement masqués.",
        },
      ],
    },
    specs: ['AES-256-GCM', 'RSA-OAEP-2048', 'PBKDF2 · 100.000', 'Zero-Knowledge'],
    storage: {
      kicker: 'Bilan des données',
      title: 'Ce que le serveur stocke — et ce qu\'il ne stocke pas',
      sub: "La liste complète. Il n'y en a pas de seconde.",
      weStore: {
        title: 'Sur le serveur',
        items: ['Adresse e-mail', "Nom d'utilisateur", 'Clé publique', 'Texte chiffré'],
      },
      weDont: {
        title: 'Jamais sur le serveur',
        items: ['Texte en clair de tes messages', 'Clés privées', 'Profils de métadonnées', 'Données publicitaires'],
      },
    },
    install: {
      kicker: "En tant qu'app",
      title: "Sur l'écran d'accueil, comme une app",
      body:
        "ValCrypta est une application web qui s'installe directement depuis le navigateur — pas de magasin d'applications, rien à télécharger. Les mises à jour arrivent automatiquement. Une fois installée, elle s'ouvre dans sa propre fenêtre, comme une app native.",
      button: 'Installer',
      genericHint:
        "L'installation est proposée dans le menu du navigateur — sur Chrome par exemple via « Installer » dans la barre d'adresse.",
      alreadyInstalled: 'Déjà installée.',
    },
    finalCta: {
      pre: 'Une conversation qui reste ',
      emphasis: 'privée',
      post: '.',
      button: 'Créer un compte',
    },
    footerLegal: '© 2026 ValCrypta',
    openSource: {
      label: 'Open source · AGPL-3.0',
      linkText: 'Voir le code source',
      url: 'https://github.com/restitutio777/valcrypta',
    },
  },

  common: {
    email: 'E-mail',
    emailPlaceholder: 'toi@exemple.fr',
    password: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    loading: 'Chargement …',
    languageTooltip: 'Changer de langue',
  },

  login: {
    title: 'Content de te revoir',
    subtitle: tagline,
    submit: 'Se connecter',
    submitting: 'Connexion en cours …',
    noAccount: 'Pas encore de compte ?',
    toSignup: "S'inscrire",
    footnote: 'Chiffré de bout en bout · Les clés restent sur ton appareil',
    errFailed: 'Échec de la connexion',
    errNoProfile: 'Aucun profil utilisateur trouvé',
    errNoKey:
      "Cet appareil ne possède aucune clé pour ce compte, et aucune sauvegarde cloud n'existe. Connecte-toi sur ton appareil d'origine et active une sauvegarde dans les réglages de sécurité.",
    errGeneric: 'Une erreur est survenue lors de la connexion',
  },

  signup: {
    title: 'Créer un compte',
    subtitle: tagline,
    warningTitle: 'Important :',
    warningBody:
      ' Ton mot de passe chiffre tes messages. Si tu le perds, tes messages sont irrécupérables. Conserve-le en lieu sûr.',
    username: "Nom d'utilisateur",
    usernamePlaceholder: "nom d'utilisateur",
    confirmPassword: 'Confirmer le mot de passe',
    submit: "S'inscrire",
    submitting: 'Création du compte …',
    haveAccount: 'Déjà un compte ?',
    toLogin: 'Se connecter',
    errMismatch: 'Les mots de passe ne correspondent pas',
    errWeak: "Le mot de passe est trop faible. Choisis-en un plus robuste.",
    errShort: 'Le mot de passe doit contenir au moins 12 caractères',
    errUsername: "Le nom d'utilisateur doit contenir au moins 3 caractères",
    errFailed: "Échec de l'inscription",
    errSession: 'Session non établie. Merci de te connecter.',
    errProfile: "Le profil n'a pas pu être créé",
    errGeneric: "Une erreur est survenue lors de l'inscription",
    strength: ['Très faible', 'Très faible', 'Faible', 'Correct', 'Bon', 'Fort'],
  },

  unlock: {
    title: 'Déverrouiller',
    subtitle: 'Ton mot de passe déchiffre ta clé privée',
    submit: 'Déverrouiller',
    submitting: 'Déverrouillage …',
    errWrongPassword: 'Mot de passe incorrect. Réessaie.',
    errNoKey: 'Aucune clé privée trouvée sur cet appareil. Merci de te reconnecter.',
    errNoProfile: 'Aucun profil utilisateur trouvé',
    errGeneric: 'Échec du déverrouillage',
    signOut: 'Se déconnecter et utiliser un autre compte',
  },

  security: {
    title: 'Niveau de sécurité',
    subtitle: 'Choisis ton équilibre entre protection et confort',
    active: 'Actif',
    levels: {
      maximum: {
        name: 'Maximal',
        tagline: 'Tout reste sur cet appareil',
        points: [
          'Mot de passe requis après chaque rechargement de la page',
          'Aucune sauvegarde cloud — si cet appareil est perdu, les messages sont perdus',
        ],
      },
      balanced: {
        name: 'Équilibré',
        tagline: 'Recommandé pour la plupart des gens',
        points: [
          'Reste déverrouillé tant que cet onglet est ouvert',
          "Sauvegarde chiffrée de la clé — connexion possible sur n'importe quel appareil avec ton mot de passe",
        ],
      },
      comfort: {
        name: 'Confort',
        tagline: 'Ouvrir et écrire, sans demande de mot de passe',
        points: [
          'Reste déverrouillé sur cet appareil jusqu\'à ta déconnexion',
          "Sauvegarde chiffrée de la clé — connexion possible sur n'importe quel appareil avec ton mot de passe",
        ],
      },
    },
    footnote:
      "La sauvegarde cloud est ta clé, chiffrée avec ton mot de passe sur cet appareil — le serveur ne peut jamais la lire. Tes messages restent chiffrés de bout en bout à tous les niveaux.",
    notifyMaximum: 'Sécurité maximale activée. Sauvegarde cloud supprimée.',
    notifyEnabled: (level: string) => `Niveau « ${level} » activé. Sauvegarde chiffrée enregistrée.`,
    notifyBackupFailed: "Niveau modifié, mais la sauvegarde cloud n'a pas pu être enregistrée pour le moment.",
    notifyError: "Le niveau de sécurité n'a pas pu être modifié",
    confirmPrompt: (level: string) =>
      `Confirme ton mot de passe pour passer au niveau « ${level} ». Ta clé sera rechiffrée et stockée à cette occasion.`,
    confirmSubmit: 'Activer le niveau',
    confirmCancel: 'Annuler',
    errWrongPassword: 'Mot de passe incorrect',
    errNoKey: 'Aucune clé chiffrée trouvée — merci de te reconnecter',
  },

  encryption: {
    title: 'Comment fonctionne le chiffrement',
    s1Title: 'Tes messages sont privés',
    s1Body:
      'ValCrypta chiffre de bout en bout : seuls toi et ton interlocuteur pouvez lire un message. Ni serveur, ni tiers.',
    s2Title: 'Deux clés',
    s2Body: 'Lors de l\'inscription, ton appareil génère une paire de clés :',
    s2Points: [
      ['Clé publique :', " partagée pour que d'autres puissent chiffrer des messages à ton intention"],
      ['Clé privée :', ' reste sur ton appareil, chiffrée avec ton mot de passe. Elle seule peut déchiffrer les messages.'],
    ],
    s3Title: 'Ce que cela signifie concrètement',
    s3Points: [
      "Les messages sont chiffrés sur ton appareil avant d'atteindre le serveur",
      'Le serveur ne stocke que du texte chiffré',
      'Si tu perds ton mot de passe, tes messages sont irrécupérables',
      'Ta clé privée ne quitte jamais ton appareil en clair',
    ],
    techTitle: 'Détails techniques',
    techBody:
      "Chaque message reçoit une clé AES-256-GCM nouvellement générée, encapsulée en RSA-OAEP-2048 pour le destinataire et l'expéditeur. Ta clé privée est protégée par AES-256-GCM ; la clé de protection est dérivée de ton mot de passe par PBKDF2 avec 100 000 itérations.",
  },

  chat: {
    emptyTitle: 'Choisis un contact',
    emptySub: 'Cherche un nom d\'utilisateur à gauche',
    emptyBadge: 'Tous les messages sont chiffrés de bout en bout',
    noMessages: 'Pas encore de message. Écris le premier.',
    loadingMessages: 'Chargement des messages …',
    inputPlaceholder: 'Écrire un message chiffré …',
    send: 'Envoyer',
    attach: 'Joindre un fichier',
    deleteConfirm: 'Supprimer pour les deux ?',
    delete: 'Supprimer',
    cancel: 'Annuler',
    deleteTooltip: 'Supprimer pour les deux',
    e2eBadge: 'Chiffré de bout en bout',
    backToChats: 'Retour aux discussions',
    encryptedChat: 'Discussion chiffrée',
    sentMessage: '[Message envoyé]',
    cantDecrypt: '[Impossible à déchiffrer]',
    encryptedFile: 'Fichier chiffré',
    imageError: "L'image n'a pas pu être chargée",
    downloadFile: 'Télécharger le fichier',
    openImage: "Ouvrir l'image",
    close: 'Fermer',
    errLoad: "Les messages n'ont pas pu être chargés",
    errSend: "Le message n'a pas pu être envoyé",
    errSendFile: "Le fichier n'a pas pu être envoyé",
    errDelete: "Le message n'a pas pu être supprimé",
    errFileTooLarge: 'Le fichier est trop volumineux (max. 25 Mo)',
  },

  keyVerify: {
    changedTitle: 'Attention : la clé a changé',
    changedBody: (name: string) =>
      `Le code de chiffrement de « ${name} » n'est plus le même que la dernière fois. Cela peut être anodin (nouveau compte, nouvel appareil) — ou quelqu'un tente de s'interposer. Par sécurité, l'envoi est bloqué jusqu'à ce que tu confirmes la nouvelle clé.`,
    changedHint: 'Le plus sûr : comparez la nouvelle empreinte par un autre canal (appel, en personne) avant de confirmer.',
    changedOldLabel: 'Empreinte précédente',
    changedNewLabel: 'Nouvelle empreinte',
    changedAccept: 'Faire confiance à la nouvelle clé',
    verifyTooltip: 'Vérifier le chiffrement',
    verifyTitle: 'Vérifier le chiffrement',
    verifyBody:
      "Chaque clé a une empreinte unique. Lisez-vous les empreintes à voix haute par un autre canal (appel, en personne) : si elles correspondent, personne — pas même le serveur — n'a pu s'interposer.",
    verifyMine: 'Ton empreinte',
    verifyTheirs: (name: string) => `Empreinte de « ${name} »`,
    verifyClose: 'Compris',
    errCheck: 'Échec de la vérification de la clé',
  },

  pwa: {
    title: 'Installer ValCrypta',
    body: "Ajoute ValCrypta à l'écran d'accueil — elle s'ouvre comme une app, dans sa propre fenêtre.",
    iosHintPre: 'Pour installer',
    iosHintShare: '« Partager »',
    iosHintAdd: "→ « Sur l'écran d'accueil ».",
    install: 'Installer',
    dismiss: 'Pas maintenant',
  },

  sidebar: {
    searchPlaceholder: "Trouver des personnes par nom d'utilisateur …",
    noUsers: 'Aucun utilisateur trouvé',
    alreadyContact: 'Déjà connecté — touche pour ouvrir',
    tapToChat: 'Touche pour écrire',
    contactAdded: 'Contact ajouté',
    emptyTitle: 'Ta première discussion',
    emptyBody: "Saisis un nom d'utilisateur ci-dessus — un contact suffit pour vous connecter, chiffré de bout en bout.",
    errSearch: 'Échec de la recherche',
    infoTooltip: 'Comment fonctionne le chiffrement',
    securityTooltip: 'Niveau de sécurité',
    darkModeTooltip: 'Basculer le mode sombre',
    logoutTooltip: 'Se déconnecter',
  },
};

export default fr;
