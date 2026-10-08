export const LINE_IDS = [
  'bakerloo',
  'central',
  'circle',
  'district',
  'hammersmith-city',
  'jubilee',
  'metropolitan',
  'northern',
  'piccadilly',
  'victoria',
  'waterloo-city'
] as const;

export type LineId = (typeof LINE_IDS)[number];

export interface Line {
  id: LineId;
  name: string;
  colour: string;
  ink: string;
}

// TfL's own line palette, with whatever reads on top of it
export const LINES: Line[] = [
  { id: 'bakerloo', name: 'Bakerloo', colour: '#b36305', ink: '#ffffff' },
  { id: 'central', name: 'Central', colour: '#e32017', ink: '#ffffff' },
  { id: 'circle', name: 'Circle', colour: '#ffd300', ink: '#0019a8' },
  { id: 'district', name: 'District', colour: '#00782a', ink: '#ffffff' },
  { id: 'hammersmith-city', name: 'Hammersmith & City', colour: '#f3a9bb', ink: '#0019a8' },
  { id: 'jubilee', name: 'Jubilee', colour: '#a0a5a9', ink: '#0019a8' },
  { id: 'metropolitan', name: 'Metropolitan', colour: '#9b0056', ink: '#ffffff' },
  { id: 'northern', name: 'Northern', colour: '#000000', ink: '#ffffff' },
  { id: 'piccadilly', name: 'Piccadilly', colour: '#003688', ink: '#ffffff' },
  { id: 'victoria', name: 'Victoria', colour: '#0098d4', ink: '#ffffff' },
  { id: 'waterloo-city', name: 'Waterloo & City', colour: '#95cdba', ink: '#0019a8' }
];

const BY_ID = new Map(LINES.map((line) => [line.id, line]));

export const lineById = (id: string): Line | undefined => BY_ID.get(id as LineId);

export const isLineId = (id: string): id is LineId => BY_ID.has(id as LineId);
