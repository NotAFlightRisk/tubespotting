import type { Messages } from './en.js';

export default {
  title: 'Mapa ao vivo do metrô de Londres',
  about: 'Sobre',
  close: 'Fechar',
  waiting: 'Aguardando a TfL…',
  checkFront: 'Veja a frente do trem',
  due: 'Chegando',
  minutes: (n: number) => `${n} min`,
  seconds: (n: number) => `${n} s`,
  trains: { one: '# trem', other: '# trens' },
  feed: {
    connecting: 'Conectando',
    unreachable: 'Sem acesso à TfL',
    behind: (time: string) => `${time} de atraso`,
    catchingUp: 'Atualizando',
    live: 'Ao vivo'
  },
  where: {
    at: (station: string) => `Em ${station}`,
    approaching: (station: string) => `Chegando a ${station}`,
    between: (from: string, to: string) => `Entre ${from} e ${to}`
  },
  map: {
    label: {
      one: 'Mapa do metrô de Londres com # trem circulando ao vivo',
      other: 'Mapa do metrô de Londres com # trens circulando ao vivo'
    },
    keys: 'As setas movem o mapa, mais e menos mudam o zoom. A lista de linhas, a busca e os painéis das estações têm tudo o que o mapa mostra.',
    station: (station: string) =>
      `Mapa ao vivo em torno de ${station}, com suas linhas e trens em destaque`
  },
  page: {
    search: 'Buscar',
    settings: 'Configurações',
    aboutMap: 'Sobre este mapa',
    details: 'Detalhes',
    back: 'Voltar para todas as linhas',
    allLines: 'Todas as linhas',
    style: 'Mapa do metrô',
    toGeographic: 'Mostrar a geografia real',
    toSchematic: 'Mostrar o mapa do metrô',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    locate: 'Mostrar onde estou'
  },
  notice: {
    unsupported: 'Este navegador não consegue compartilhar sua localização',
    noLines: 'Ative algumas linhas para encontrar a estação mais próxima',
    far: (km: number) => `Você está a ${km} km da estação mais próxima`,
    failed: 'Não foi possível obter sua localização'
  },
  board: {
    lines: 'Linhas',
    checking: 'Verificando',
    onMap: 'No mapa',
    none: 'Nenhuma linha',
    only: (mode: string) => `Só ${mode}`,
    every: 'Todas as linhas'
  },
  line: {
    checking: 'Verificando a situação',
    running: { one: '# trem circulando', other: '# trens circulando' },
    to: (place: string) => `Para ${place}`,
    trainsTo: (place: string) => `Trens para ${place}`
  },
  station: {
    lines: 'Linhas',
    platform: 'Plataforma',
    platformOf: (line: string, platform: string) => `Linha ${line}, ${platform}`,
    terminating: 'Nenhuma partida listada, só trens que terminam aqui.',
    arrivingNow: 'O próximo chega agora.',
    arrivingIn: (time: string) => `O próximo chega em ${time}.`,
    none: 'Nenhum trem previsto aqui no momento.',
    page: 'Página da estação',
    terminatingHere: 'Termina aqui',
    trail: 'Navegação estrutural',
    liveMap: 'Mapa ao vivo',
    departures: 'Partidas',
    notices: 'Avisos da estação',
    status: 'Situação das linhas',
    busy: 'Movimento',
    day: 'Dia',
    busiest: (time: string) => `Geralmente mais cheia por volta das ${time}`,
    now: 'Agora',
    around: 'Arredores',
    next: 'Próximas paradas',
    nearby: 'A uma curta caminhada',
    onMap: 'Abrir no mapa ao vivo',
    recentre: 'Voltar para a estação'
  },
  facts: {
    title: 'Instalações',
    zone: 'Zona',
    night: 'Night Tube',
    lifts: 'Elevadores',
    escalators: 'Escadas rolantes',
    byLift: 'Por elevador',
    access: 'Acesso sem degraus',
    toilets: 'Banheiros',
    wifi: 'Wi-Fi',
    address: 'Endereço',
    yes: 'Sim',
    no: 'Não'
  },
  stations: {
    title: 'Estações',
    heading: 'Todas as estações, de A a Z',
    intro: (count: string) =>
      `Todas as ${count} estações do mapa, cada uma com partidas ao vivo, movimento e os trens a caminho.`,
    letters: 'Ir para uma letra'
  },
  train: {
    gone: 'Esse trem sumiu',
    goneWhy: 'A TfL parou de informar sobre ele, então ele provavelmente chegou ao fim da linha.',
    to: (place: string) => `para ${place}`,
    unknown: ': veja o destino na frente do trem',
    follow: 'Seguir este trem',
    following: 'Seguindo este trem',
    stops: 'Próximas paradas'
  },
  search: {
    line: (name: string) => `Linha ${name}`,
    kind: 'Linha',
    find: 'Encontre uma estação ou linha',
    close: 'Fechar busca',
    matches: 'Resultados',
    nothing: 'Nada com esse nome no metrô.'
  },
  settings: {
    title: 'Configurações',
    general: 'Geral',
    map: 'Mapa',
    accessibility: 'Acessibilidade',
    privacy: 'Privacidade',
    theme: { label: 'Tema', hint: 'Segue o seu dispositivo até você escolher um' },
    light: 'Claro',
    dark: 'Escuro',
    language: { label: 'Idioma', hint: 'Segue o seu dispositivo até você escolher um' },
    layout: { label: 'Visualização' },
    schematic: 'Mapa do metrô',
    geographic: 'Geográfico',
    zoom: { label: 'Zoom' },
    modes: { label: 'Linhas no mapa' },
    locate: { label: 'Mostrar onde estou', hint: 'Sua localização nunca sai do seu dispositivo' },
    refresh: { label: 'Atualizar a cada', hint: 'Com menos frequência, usa menos dados' },
    calm: { label: 'Reduzir movimento', hint: 'Menos animações e um mapa que não desliza' },
    contrast: { label: 'Mais contraste', hint: 'Texto e bordas mais fortes' },
    shortcuts: { label: 'Atalhos de teclado', hint: 'Pressione / para buscar' },
    analytics: {
      label: 'Estatísticas de uso',
      hint: 'O Plausible conta visitas, sem cookies nem dados pessoais'
    },
    errors: {
      label: 'Relatórios de erro',
      hint: 'Um relatório anonimizado quando algo quebra, para podermos corrigir'
    },
    clear: {
      label: 'Apagar todos os dados',
      hint: 'Redefine tudo o que está salvo neste navegador'
    },
    clearButton: 'Apagar',
    cleared: 'Apagado',
    clearedAll: 'Tudo foi apagado'
  },
  error: {
    lost: 'Fora do mapa',
    broken: 'Algo deu errado',
    noTrains: 'Nenhum trem para aqui',
    outOfService: 'Fora de serviço',
    missing: 'Essa página não está no mapa.',
    back: 'Voltar ao mapa ao vivo'
  }
} satisfies Messages;
