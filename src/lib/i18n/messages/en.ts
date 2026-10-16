import type { Plural } from '../locales.js';

const en = {
  title: 'Live London Underground map',
  about: 'About',
  close: 'Close',
  waiting: 'Waiting for TfL…',
  checkFront: 'Check front of train',
  due: 'Due',
  minutes: (n: number) => `${n} min`,
  seconds: (n: number) => `${n} sec`,
  trains: { one: '# train', other: '# trains' } as Plural,
  feed: {
    connecting: 'Connecting',
    unreachable: "Can't reach TfL",
    behind: (time: string) => `${time} behind`,
    catchingUp: 'Catching up',
    live: 'Live'
  },
  where: {
    at: (station: string) => `At ${station}`,
    approaching: (station: string) => `Approaching ${station}`,
    between: (from: string, to: string) => `Between ${from} and ${to}`
  },
  map: {
    label: {
      one: 'Map of the London Underground with # train moving live',
      other: 'Map of the London Underground with # trains moving live'
    } as Plural,
    keys: 'Arrow keys move the map, plus and minus zoom. The line list, search and station boards have everything the map shows.'
  },
  page: {
    search: 'Search',
    settings: 'Settings',
    aboutMap: 'About this map',
    details: 'Details',
    back: 'Back to all lines',
    allLines: 'All lines',
    style: 'Tube map',
    toGeographic: 'Show the real geography',
    toSchematic: 'Show the tube map',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    locate: 'Show where I am'
  },
  notice: {
    unsupported: "This browser can't share your location",
    noLines: 'Switch some lines on to find your nearest station',
    far: (km: number) => `You're ${km} km from the nearest station`,
    failed: "Couldn't get your location"
  },
  board: {
    lines: 'Lines',
    checking: 'Checking',
    onMap: 'On the map',
    none: 'No lines',
    only: (mode: string) => `${mode} only`,
    every: 'Every line'
  },
  line: {
    checking: 'Checking the status',
    running: { one: '# train running', other: '# trains running' } as Plural,
    to: (place: string) => `To ${place}`,
    trainsTo: (place: string) => `Trains to ${place}`
  },
  station: {
    lines: 'Lines',
    platform: 'Platform',
    platformOf: (line: string, platform: string) => `${line} line, ${platform}`,
    terminating: 'No departures listed, only trains finishing here.',
    arrivingNow: 'The next one arrives now.',
    arrivingIn: (time: string) => `The next one arrives in ${time}.`,
    none: 'No trains due here at the moment.'
  },
  train: {
    gone: "That train's gone",
    goneWhy: "TfL has stopped reporting it, so it's probably reached the end of the line.",
    to: (place: string) => `to ${place}`,
    unknown: 'train, check the front for where to',
    follow: 'Follow this train',
    following: 'Following this train',
    stops: 'Next stops'
  },
  search: {
    line: (name: string) => `${name} line`,
    kind: 'Line',
    find: 'Find a station or line',
    close: 'Close search',
    matches: 'Matches',
    nothing: 'Nothing on the Underground called that.'
  },
  settings: {
    title: 'Settings',
    general: 'General',
    map: 'Map',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    theme: { label: 'Theme', hint: 'Matches your device until you pick one' },
    light: 'Light',
    dark: 'Dark',
    language: { label: 'Language', hint: 'Matches your device until you pick one' },
    layout: { label: 'Layout' },
    schematic: 'Tube map',
    geographic: 'Geographic',
    zoom: { label: 'Zoom' },
    modes: { label: 'Lines on the map' },
    locate: { label: 'Show where I am', hint: 'Your location never leaves your device' },
    refresh: { label: 'Update every', hint: 'Less often uses less data' },
    calm: { label: 'Reduce motion', hint: 'Fewer animations, and no gliding map' },
    contrast: { label: 'More contrast', hint: 'Stronger text and borders' },
    shortcuts: { label: 'Keyboard shortcuts', hint: 'Press / to search' },
    analytics: {
      label: 'Usage analytics',
      hint: 'Plausible counts visits, with no cookies or personal data'
    },
    errors: {
      label: 'Error reports',
      hint: 'A redacted report when something breaks, so we can fix it'
    },
    clear: { label: 'Clear all data', hint: 'Resets everything saved in this browser' },
    clearButton: 'Clear',
    cleared: 'Cleared',
    clearedAll: 'Everything has been cleared'
  },
  error: {
    lost: 'Not on the map',
    broken: 'Something went wrong',
    noTrains: 'No trains call here',
    outOfService: 'Not in service',
    missing: "That page isn't on the map.",
    back: 'Back to the live map'
  }
};

export type Messages = typeof en;
export default en;
