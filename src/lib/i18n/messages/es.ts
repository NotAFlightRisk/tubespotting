import type { Messages } from './en.js';

export default {
  title: 'Mapa en directo del metro de Londres',
  about: 'Acerca de',
  close: 'Cerrar',
  waiting: 'Esperando a TfL…',
  checkFront: 'Mira el frente del tren',
  due: 'Llegando',
  minutes: (n: number) => `${n} min`,
  seconds: (n: number) => `${n} s`,
  trains: { one: '# tren', other: '# trenes' },
  feed: {
    connecting: 'Conectando',
    unreachable: 'TfL no responde',
    behind: (time: string) => `${time} de retraso`,
    catchingUp: 'Actualizando',
    live: 'En directo'
  },
  where: {
    at: (station: string) => `En ${station}`,
    approaching: (station: string) => `Llegando a ${station}`,
    between: (from: string, to: string) => `Entre ${from} y ${to}`
  },
  map: {
    label: {
      one: 'Mapa del metro de Londres con # tren circulando en directo',
      other: 'Mapa del metro de Londres con # trenes circulando en directo'
    },
    keys: 'Las flechas mueven el mapa; más y menos acercan y alejan. La lista de líneas, la búsqueda y los paneles de las estaciones tienen todo lo que muestra el mapa.',
    station: (station: string) =>
      `Mapa en directo de los alrededores de ${station}, con sus líneas y trenes destacados`
  },
  page: {
    search: 'Buscar',
    settings: 'Ajustes',
    aboutMap: 'Acerca de este mapa',
    details: 'Detalles',
    back: 'Volver a todas las líneas',
    allLines: 'Todas las líneas',
    style: 'Plano del metro',
    toGeographic: 'Ver la geografía real',
    toSchematic: 'Ver el plano del metro',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    locate: 'Mostrar dónde estoy'
  },
  notice: {
    unsupported: 'Este navegador no puede compartir tu ubicación',
    noLines: 'Activa alguna línea para encontrar tu estación más cercana',
    far: (km: number) => `Estás a ${km} km de la estación más cercana`,
    failed: 'No se pudo obtener tu ubicación'
  },
  board: {
    lines: 'Líneas',
    checking: 'Comprobando',
    onMap: 'En el mapa',
    none: 'Ninguna línea',
    only: (mode: string) => `Solo ${mode}`,
    every: 'Todas las líneas'
  },
  line: {
    checking: 'Comprobando el estado',
    running: { one: '# tren en servicio', other: '# trenes en servicio' },
    to: (place: string) => `Hacia ${place}`,
    trainsTo: (place: string) => `Trenes hacia ${place}`
  },
  station: {
    lines: 'Líneas',
    platform: 'Andén',
    platformOf: (line: string, platform: string) => `Línea ${line}, ${platform}`,
    terminating: 'No hay salidas previstas, solo trenes que terminan aquí.',
    arrivingNow: 'El próximo llega ahora.',
    arrivingIn: (time: string) => `El próximo llega en ${time}.`,
    none: 'Ahora mismo no hay trenes previstos aquí.',
    page: 'Página de la estación',
    terminatingHere: 'Finaliza aquí',
    trail: 'Ruta de navegación',
    liveMap: 'Mapa en directo',
    departures: 'Salidas',
    notices: 'Avisos de la estación',
    status: 'Estado de las líneas',
    busy: 'Afluencia',
    day: 'Día',
    busiest: (time: string) => `Suele haber más gente hacia las ${time}`,
    now: 'Ahora',
    around: 'Cómo moverse',
    next: 'Próximas paradas',
    nearby: 'A poca distancia a pie',
    onMap: 'Abrir en el mapa en directo',
    recentre: 'Volver a la estación'
  },
  facts: {
    title: 'Instalaciones',
    zone: 'Zona',
    night: 'Night Tube',
    lifts: 'Ascensores',
    escalators: 'Escaleras mecánicas',
    byLift: 'Por ascensor',
    access: 'Acceso sin escalones',
    toilets: 'Aseos',
    wifi: 'Wi-Fi',
    address: 'Dirección',
    yes: 'Sí',
    no: 'No'
  },
  stations: {
    title: 'Estaciones',
    heading: 'Todas las estaciones, de la A a la Z',
    intro: (count: string) =>
      `Las ${count} estaciones del mapa, cada una con sus salidas en directo, su afluencia y los trenes que llegan.`,
    letters: 'Ir a una letra'
  },
  train: {
    gone: 'Ese tren ya no está',
    goneWhy:
      'TfL ha dejado de informar sobre él, así que seguramente ha llegado al final de la línea.',
    to: (place: string) => `hacia ${place}`,
    unknown: ': mira el destino en el frente del tren',
    follow: 'Seguir este tren',
    following: 'Siguiendo este tren',
    stops: 'Próximas paradas'
  },
  search: {
    line: (name: string) => `Línea ${name}`,
    kind: 'Línea',
    find: 'Busca una estación o línea',
    close: 'Cerrar búsqueda',
    matches: 'Resultados',
    nothing: 'No hay nada con ese nombre en el metro.'
  },
  settings: {
    title: 'Ajustes',
    general: 'General',
    map: 'Mapa',
    accessibility: 'Accesibilidad',
    privacy: 'Privacidad',
    theme: { label: 'Tema', hint: 'Sigue a tu dispositivo hasta que elijas uno' },
    light: 'Claro',
    dark: 'Oscuro',
    language: { label: 'Idioma', hint: 'Sigue a tu dispositivo hasta que elijas uno' },
    layout: { label: 'Vista' },
    schematic: 'Plano del metro',
    geographic: 'Geográfica',
    zoom: { label: 'Zoom' },
    modes: { label: 'Líneas en el mapa' },
    locate: { label: 'Mostrar dónde estoy', hint: 'Tu ubicación nunca sale de tu dispositivo' },
    refresh: { label: 'Actualizar cada', hint: 'Con menos frecuencia se usan menos datos' },
    calm: { label: 'Reducir movimiento', hint: 'Menos animaciones y un mapa que no se desliza' },
    contrast: { label: 'Más contraste', hint: 'Texto y bordes más marcados' },
    shortcuts: { label: 'Atajos de teclado', hint: 'Pulsa / para buscar' },
    analytics: {
      label: 'Estadísticas de uso',
      hint: 'Plausible cuenta las visitas, sin cookies ni datos personales'
    },
    errors: {
      label: 'Informes de errores',
      hint: 'Un informe anonimizado cuando algo falla, para que podamos arreglarlo'
    },
    clear: {
      label: 'Borrar todos los datos',
      hint: 'Restablece todo lo guardado en este navegador'
    },
    clearButton: 'Borrar',
    cleared: 'Borrado',
    clearedAll: 'Se ha borrado todo'
  },
  error: {
    lost: 'Fuera del mapa',
    broken: 'Algo ha fallado',
    noTrains: 'Aquí no para ningún tren',
    outOfService: 'Fuera de servicio',
    missing: 'Esa página no está en el mapa.',
    back: 'Volver al mapa en directo'
  }
} satisfies Messages;
