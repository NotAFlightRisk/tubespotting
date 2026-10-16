import type { Messages } from './en.js';

export default {
  title: 'Live-Karte der Londoner U-Bahn',
  about: 'Über',
  close: 'Schließen',
  waiting: 'Warte auf TfL…',
  checkFront: 'Ziel am Zug ablesen',
  due: 'Sofort',
  minutes: (n: number) => `${n} Min.`,
  seconds: (n: number) => `${n} Sek.`,
  trains: { one: '# Zug', other: '# Züge' },
  feed: {
    connecting: 'Verbinden',
    unreachable: 'TfL nicht erreichbar',
    behind: (time: string) => `${time} verzögert`,
    catchingUp: 'Wird aktualisiert',
    live: 'Live'
  },
  where: {
    at: (station: string) => `In ${station}`,
    approaching: (station: string) => `Kurz vor ${station}`,
    between: (from: string, to: string) => `Zwischen ${from} und ${to}`
  },
  map: {
    label: {
      one: 'Karte der Londoner U-Bahn mit # Zug live in Bewegung',
      other: 'Karte der Londoner U-Bahn mit # Zügen live in Bewegung'
    },
    keys: 'Pfeiltasten verschieben die Karte, Plus und Minus zoomen. Linienliste, Suche und Stationstafeln zeigen alles, was auch die Karte zeigt.'
  },
  page: {
    search: 'Suchen',
    settings: 'Einstellungen',
    aboutMap: 'Über diese Karte',
    details: 'Details',
    back: 'Zurück zu allen Linien',
    allLines: 'Alle Linien',
    style: 'Netzplan',
    toGeographic: 'Echte Geografie zeigen',
    toSchematic: 'Netzplan zeigen',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    locate: 'Meinen Standort zeigen'
  },
  notice: {
    unsupported: 'Dieser Browser kann deinen Standort nicht teilen',
    noLines: 'Schalte Linien ein, um die nächste Station zu finden',
    far: (km: number) => `Du bist ${km} km von der nächsten Station entfernt`,
    failed: 'Standort konnte nicht ermittelt werden'
  },
  board: {
    lines: 'Linien',
    checking: 'Wird geprüft',
    onMap: 'Auf der Karte',
    none: 'Keine Linien',
    only: (mode: string) => `Nur ${mode}`,
    every: 'Alle Linien'
  },
  line: {
    checking: 'Status wird geprüft',
    running: { one: '# Zug unterwegs', other: '# Züge unterwegs' },
    to: (place: string) => `Nach ${place}`,
    trainsTo: (place: string) => `Züge nach ${place}`
  },
  station: {
    lines: 'Linien',
    platform: 'Bahnsteig',
    platformOf: (line: string, platform: string) => `${line}-Linie, ${platform}`,
    terminating: 'Keine Abfahrten, nur Züge, die hier enden.',
    arrivingNow: 'Der nächste kommt jetzt an.',
    arrivingIn: (time: string) => `Der nächste kommt in ${time} an.`,
    none: 'Gerade sind hier keine Züge angekündigt.'
  },
  train: {
    gone: 'Dieser Zug ist weg',
    goneWhy: 'TfL meldet ihn nicht mehr, er hat also wohl die Endstation erreicht.',
    to: (place: string) => `nach ${place}`,
    unknown: '– Ziel am Zug ablesen',
    follow: 'Diesem Zug folgen',
    following: 'Du folgst diesem Zug',
    stops: 'Nächste Halte'
  },
  search: {
    line: (name: string) => `${name}-Linie`,
    kind: 'Linie',
    find: 'Station oder Linie finden',
    close: 'Suche schließen',
    matches: 'Treffer',
    nothing: 'In der U-Bahn heißt nichts so.'
  },
  settings: {
    title: 'Einstellungen',
    general: 'Allgemein',
    map: 'Karte',
    accessibility: 'Barrierefreiheit',
    privacy: 'Datenschutz',
    theme: { label: 'Design', hint: 'Folgt deinem Gerät, bis du eins wählst' },
    light: 'Hell',
    dark: 'Dunkel',
    language: { label: 'Sprache', hint: 'Folgt deinem Gerät, bis du eine wählst' },
    layout: { label: 'Ansicht' },
    schematic: 'Netzplan',
    geographic: 'Geografisch',
    zoom: { label: 'Zoom' },
    modes: { label: 'Linien auf der Karte' },
    locate: { label: 'Meinen Standort zeigen', hint: 'Dein Standort verlässt nie dein Gerät' },
    refresh: { label: 'Aktualisieren alle', hint: 'Seltener braucht weniger Daten' },
    calm: { label: 'Weniger Bewegung', hint: 'Weniger Animationen und keine gleitende Karte' },
    contrast: { label: 'Mehr Kontrast', hint: 'Kräftigere Schrift und Ränder' },
    shortcuts: { label: 'Tastenkürzel', hint: 'Drücke / zum Suchen' },
    analytics: {
      label: 'Nutzungsstatistik',
      hint: 'Plausible zählt Besuche, ohne Cookies oder persönliche Daten'
    },
    errors: {
      label: 'Fehlerberichte',
      hint: 'Ein bereinigter Bericht, wenn etwas kaputtgeht, damit wir es beheben können'
    },
    clear: {
      label: 'Alle Daten löschen',
      hint: 'Setzt alles zurück, was dieser Browser gespeichert hat'
    },
    clearButton: 'Löschen',
    cleared: 'Gelöscht',
    clearedAll: 'Alles wurde gelöscht'
  },
  error: {
    lost: 'Nicht auf der Karte',
    broken: 'Etwas ist schiefgelaufen',
    noTrains: 'Hier hält kein Zug',
    outOfService: 'Nicht in Betrieb',
    missing: 'Diese Seite ist nicht auf der Karte.',
    back: 'Zurück zur Live-Karte'
  }
} satisfies Messages;
