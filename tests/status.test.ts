import { describe, expect, it } from 'vitest';
import type { LineId } from '#lib/lines.js';
import { finishesAt } from '#lib/status.js';
import type { TrainReading } from '#lib/types.js';
import { index } from './helpers.js';

const BRIXTON = '940GZZLUBXN';
const EDGWARE_ROAD = '940GZZLUERC';

/** A nameless train calling at each station a minute apart, heading for `to` */
const train = (line: LineId, calls: string[], to: string): TrainReading => ({
  id: null,
  line,
  to: '',
  dest: index(to),
  where: '',
  from: null,
  stops: calls.map((naptan, i) => [index(naptan), 60 * (i + 1), 0])
});

describe('finishesAt', () => {
  it('spots a train coming in to finish at the end of the line', () => {
    const terminating = train('victoria', ['940GZZLUSKW', BRIXTON], BRIXTON);
    expect(finishesAt(terminating, new Set([index(BRIXTON)]))).toBe(true);
  });

  it('keeps a Circle train that calls at its destination on the way round', () => {
    const passing = train('circle', [EDGWARE_ROAD, '940GZZLUBST'], EDGWARE_ROAD);
    expect(finishesAt(passing, new Set([index(EDGWARE_ROAD)]))).toBe(false);
  });
});
