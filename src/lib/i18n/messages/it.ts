import type { Messages } from './en.js';

export default {
  title: 'Mappa in tempo reale della metropolitana di Londra',
  about: 'Informazioni',
  close: 'Chiudi',
  waiting: 'In attesa di TfL…',
  checkFront: 'Controlla il frontale del treno',
  due: 'In arrivo',
  minutes: (n: number) => `${n} min`,
  seconds: (n: number) => `${n} s`,
  trains: { one: '# treno', other: '# treni' },
  feed: {
    connecting: 'Connessione',
    unreachable: 'TfL non raggiungibile',
    behind: (time: string) => `${time} di ritardo`,
    catchingUp: 'Aggiornamento',
    live: 'In diretta'
  },
  where: {
    at: (station: string) => `A ${station}`,
    approaching: (station: string) => `In arrivo a ${station}`,
    between: (from: string, to: string) => `Tra ${from} e ${to}`
  },
  map: {
    label: {
      one: 'Mappa della metropolitana di Londra con # treno in movimento in tempo reale',
      other: 'Mappa della metropolitana di Londra con # treni in movimento in tempo reale'
    },
    keys: 'Le frecce spostano la mappa, più e meno cambiano lo zoom. L’elenco delle linee, la ricerca e i tabelloni delle stazioni hanno tutto ciò che mostra la mappa.',
    station: (station: string) =>
      `Mappa in tempo reale intorno a ${station}, con le sue linee e i suoi treni in evidenza`
  },
  page: {
    search: 'Cerca',
    settings: 'Impostazioni',
    aboutMap: 'Informazioni su questa mappa',
    details: 'Dettagli',
    back: 'Torna a tutte le linee',
    allLines: 'Tutte le linee',
    style: 'Mappa della metro',
    toGeographic: 'Mostra la geografia reale',
    toSchematic: 'Mostra la mappa della metro',
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    locate: 'Mostra dove sono'
  },
  notice: {
    unsupported: 'Questo browser non può condividere la tua posizione',
    noLines: 'Attiva qualche linea per trovare la stazione più vicina',
    far: (km: number) => `Sei a ${km} km dalla stazione più vicina`,
    failed: 'Impossibile ottenere la tua posizione'
  },
  board: {
    lines: 'Linee',
    checking: 'Verifica',
    onMap: 'Sulla mappa',
    none: 'Nessuna linea',
    only: (mode: string) => `Solo ${mode}`,
    every: 'Tutte le linee'
  },
  line: {
    checking: 'Verifica dello stato',
    running: { one: '# treno in servizio', other: '# treni in servizio' },
    to: (place: string) => `Per ${place}`,
    trainsTo: (place: string) => `Treni per ${place}`
  },
  station: {
    lines: 'Linee',
    platform: 'Binario',
    platformOf: (line: string, platform: string) => `Linea ${line}, ${platform}`,
    terminating: 'Nessuna partenza in elenco, solo treni che terminano qui.',
    arrivingNow: 'Il prossimo arriva adesso.',
    arrivingIn: (time: string) => `Il prossimo arriva tra ${time}.`,
    none: 'Al momento non ci sono treni in arrivo qui.',
    page: 'Pagina della stazione',
    terminatingHere: 'Termina qui',
    trail: 'Percorso di navigazione',
    liveMap: 'Mappa in tempo reale',
    departures: 'Partenze',
    notices: 'Avvisi della stazione',
    status: 'Stato delle linee',
    busy: 'Affollamento',
    day: 'Giorno',
    busiest: (time: string) => `Di solito più affollata verso le ${time}`,
    now: 'Adesso',
    around: 'Nei dintorni',
    next: 'Prossime fermate',
    nearby: 'A due passi',
    onMap: 'Apri sulla mappa in tempo reale',
    recentre: 'Torna alla stazione'
  },
  facts: {
    title: 'Servizi',
    zone: 'Zona',
    night: 'Night Tube',
    lifts: 'Ascensori',
    escalators: 'Scale mobili',
    byLift: 'Con ascensore',
    access: 'Accesso senza gradini',
    toilets: 'Bagni',
    wifi: 'Wi-Fi',
    address: 'Indirizzo',
    yes: 'Sì',
    no: 'No'
  },
  stations: {
    title: 'Stazioni',
    heading: 'Tutte le stazioni, dalla A alla Z',
    intro: (count: string) =>
      `Tutte le ${count} stazioni della mappa, ognuna con partenze in tempo reale, affollamento e treni in arrivo.`,
    letters: 'Vai a una lettera'
  },
  train: {
    gone: 'Quel treno non c’è più',
    goneWhy: 'TfL ha smesso di segnalarlo, quindi probabilmente è arrivato al capolinea.',
    to: (place: string) => `per ${place}`,
    unknown: ': controlla la destinazione sul frontale',
    follow: 'Segui questo treno',
    following: 'Stai seguendo questo treno',
    stops: 'Prossime fermate'
  },
  search: {
    line: (name: string) => `Linea ${name}`,
    kind: 'Linea',
    find: 'Trova una stazione o una linea',
    close: 'Chiudi la ricerca',
    matches: 'Risultati',
    nothing: 'Niente con quel nome nella metropolitana.'
  },
  settings: {
    title: 'Impostazioni',
    general: 'Generali',
    map: 'Mappa',
    accessibility: 'Accessibilità',
    privacy: 'Privacy',
    theme: { label: 'Tema', hint: 'Segue il tuo dispositivo finché non ne scegli uno' },
    light: 'Chiaro',
    dark: 'Scuro',
    language: { label: 'Lingua', hint: 'Segue il tuo dispositivo finché non ne scegli una' },
    layout: { label: 'Vista' },
    schematic: 'Mappa della metro',
    geographic: 'Geografica',
    zoom: { label: 'Zoom' },
    modes: { label: 'Linee sulla mappa' },
    locate: { label: 'Mostra dove sono', hint: 'La tua posizione non lascia mai il dispositivo' },
    refresh: { label: 'Aggiorna ogni', hint: 'Meno spesso consuma meno dati' },
    calm: { label: 'Riduci il movimento', hint: 'Meno animazioni e niente mappa che scorre' },
    contrast: { label: 'Più contrasto', hint: 'Testo e bordi più marcati' },
    shortcuts: { label: 'Scorciatoie da tastiera', hint: 'Premi / per cercare' },
    analytics: {
      label: 'Statistiche d’uso',
      hint: 'Plausible conta le visite, senza cookie né dati personali'
    },
    errors: {
      label: 'Segnalazioni di errore',
      hint: 'Un rapporto anonimizzato quando qualcosa si rompe, così possiamo sistemarlo'
    },
    clear: {
      label: 'Cancella tutti i dati',
      hint: 'Azzera tutto ciò che è salvato in questo browser'
    },
    clearButton: 'Cancella',
    cleared: 'Cancellato',
    clearedAll: 'È stato cancellato tutto'
  },
  error: {
    lost: 'Fuori dalla mappa',
    broken: 'Qualcosa è andato storto',
    noTrains: 'Qui non ferma nessun treno',
    outOfService: 'Fuori servizio',
    missing: 'Quella pagina non è sulla mappa.',
    back: 'Torna alla mappa in tempo reale'
  }
} satisfies Messages;
