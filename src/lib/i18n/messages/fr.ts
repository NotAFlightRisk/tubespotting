import type { Messages } from './en.js';

export default {
  title: 'Carte en direct du métro de Londres',
  about: 'À propos',
  close: 'Fermer',
  waiting: 'En attente de TfL…',
  checkFront: 'Voir l’avant du train',
  due: 'À l’approche',
  minutes: (n: number) => `${n} min`,
  seconds: (n: number) => `${n} s`,
  trains: { one: '# train', other: '# trains' },
  feed: {
    connecting: 'Connexion',
    unreachable: 'TfL injoignable',
    behind: (time: string) => `${time} de retard`,
    catchingUp: 'Mise à jour',
    live: 'En direct'
  },
  where: {
    at: (station: string) => `À ${station}`,
    approaching: (station: string) => `Arrive à ${station}`,
    between: (from: string, to: string) => `Entre ${from} et ${to}`
  },
  map: {
    label: {
      one: 'Carte du métro de Londres avec # train qui circule en direct',
      other: 'Carte du métro de Londres avec # trains qui circulent en direct'
    },
    keys: 'Les flèches déplacent la carte, plus et moins zooment. La liste des lignes, la recherche et les tableaux des stations reprennent tout ce que montre la carte.'
  },
  page: {
    search: 'Rechercher',
    settings: 'Paramètres',
    aboutMap: 'À propos de cette carte',
    details: 'Détails',
    back: 'Retour à toutes les lignes',
    allLines: 'Toutes les lignes',
    style: 'Plan du métro',
    toGeographic: 'Afficher la vraie géographie',
    toSchematic: 'Afficher le plan du métro',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    locate: 'Afficher ma position'
  },
  notice: {
    unsupported: 'Ce navigateur ne peut pas partager votre position',
    noLines: 'Activez des lignes pour trouver la station la plus proche',
    far: (km: number) => `Vous êtes à ${km} km de la station la plus proche`,
    failed: 'Impossible d’obtenir votre position'
  },
  board: {
    lines: 'Lignes',
    checking: 'Vérification',
    onMap: 'Sur la carte',
    none: 'Aucune ligne',
    only: (mode: string) => `${mode} uniquement`,
    every: 'Toutes les lignes'
  },
  line: {
    checking: 'Vérification de l’état du trafic',
    running: { one: '# train en circulation', other: '# trains en circulation' },
    to: (place: string) => `Vers ${place}`,
    trainsTo: (place: string) => `Trains vers ${place}`
  },
  station: {
    lines: 'Lignes',
    platform: 'Quai',
    platformOf: (line: string, platform: string) => `Ligne ${line}, ${platform}`,
    terminating: 'Aucun départ annoncé, seulement des trains qui terminent ici.',
    arrivingNow: 'Le prochain arrive maintenant.',
    arrivingIn: (time: string) => `Le prochain arrive dans ${time}.`,
    none: 'Aucun train attendu ici pour le moment.'
  },
  train: {
    gone: 'Ce train a disparu',
    goneWhy: 'TfL ne le signale plus, il a sans doute atteint le terminus.',
    to: (place: string) => `vers ${place}`,
    unknown: ': destination affichée à l’avant du train',
    follow: 'Suivre ce train',
    following: 'Train suivi',
    stops: 'Prochains arrêts'
  },
  search: {
    line: (name: string) => `Ligne ${name}`,
    kind: 'Ligne',
    find: 'Trouver une station ou une ligne',
    close: 'Fermer la recherche',
    matches: 'Résultats',
    nothing: 'Rien de ce nom dans le métro.'
  },
  settings: {
    title: 'Paramètres',
    general: 'Général',
    map: 'Carte',
    accessibility: 'Accessibilité',
    privacy: 'Confidentialité',
    theme: { label: 'Thème', hint: 'Suit votre appareil tant que vous n’en choisissez pas un' },
    light: 'Clair',
    dark: 'Sombre',
    language: {
      label: 'Langue',
      hint: 'Suit votre appareil tant que vous n’en choisissez pas une'
    },
    layout: { label: 'Affichage' },
    schematic: 'Plan du métro',
    geographic: 'Géographique',
    zoom: { label: 'Zoom' },
    modes: { label: 'Lignes sur la carte' },
    locate: {
      label: 'Afficher ma position',
      hint: 'Votre position ne quitte jamais votre appareil'
    },
    refresh: { label: 'Fréquence d’actualisation', hint: 'Moins souvent, c’est moins de données' },
    calm: {
      label: 'Réduire les animations',
      hint: 'Moins d’animations, et une carte qui ne glisse plus'
    },
    contrast: { label: 'Plus de contraste', hint: 'Texte et bordures plus marqués' },
    shortcuts: { label: 'Raccourcis clavier', hint: 'Appuyez sur / pour rechercher' },
    analytics: {
      label: 'Statistiques de visite',
      hint: 'Plausible compte les visites, sans cookies ni données personnelles'
    },
    errors: {
      label: 'Rapports d’erreur',
      hint: 'Un rapport anonymisé quand quelque chose plante, pour qu’on puisse le corriger'
    },
    clear: {
      label: 'Effacer toutes les données',
      hint: 'Réinitialise tout ce qui est enregistré dans ce navigateur'
    },
    clearButton: 'Effacer',
    cleared: 'Effacé',
    clearedAll: 'Tout a été effacé'
  },
  error: {
    lost: 'Hors de la carte',
    broken: 'Une erreur est survenue',
    noTrains: 'Aucun train ne s’arrête ici',
    outOfService: 'Hors service',
    missing: 'Cette page n’est pas sur la carte.',
    back: 'Retour à la carte en direct'
  }
} satisfies Messages;
