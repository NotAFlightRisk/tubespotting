import { describe, expect, it } from 'vitest';
import { lastStation, Platforms, readStatus, readTrains } from '#lib/server/readings.js';
import { AT, call, index } from '../helpers.js';

const read = (predictions: Parameters<typeof readTrains>[0]) =>
  readTrains(predictions, AT, new Platforms());

const stopsOf = (train: { stops: [number, number, number][] }) =>
  train.stops.map(([station, eta]) => [station, eta]);

describe('readTrains', () => {
  it('turns a named train into one itinerary in arrival order', () => {
    const [train, ...rest] = read([
      call('940GZZLUVXL', 200),
      call('940GZZLUSKW', 60),
      call('940GZZLUPCO', 290)
    ]);
    expect(rest).toEqual([]);
    expect(train.id).toBe('victoria:201:Walthamstow Central');
    expect(train.to).toBe('Walthamstow Central');
    expect(train.from).toBe(index('940GZZLUBXN'));
    expect(stopsOf(train)).toEqual([
      [index('940GZZLUSKW'), 60],
      [index('940GZZLUVXL'), 200],
      [index('940GZZLUPCO'), 290]
    ]);
  });

  it('counts a call TfL repeats for each platform once', () => {
    const [train] = read([
      call('940GZZLUSKW', 60),
      call('940GZZLUSKW', 61, { platformName: 'Northbound - Platform 2' }),
      call('940GZZLUVXL', 200)
    ]);
    expect(train.stops).toHaveLength(2);
  });

  it('ignores a call at a station the line never stops at', () => {
    const [train] = read([call('940GZZLUSKW', 60), call('940GZZLUEMB', 300)]);
    expect(stopsOf(train)).toEqual([[index('940GZZLUSKW'), 60]]);
  });

  it('splits two trains that share an id but run on different branches', () => {
    const district = { lineId: 'district', vehicleId: '003', destinationName: 'Upminster' };
    const trains = read([
      call('940GZZLUWBN', 60, district),
      call('940GZZLUKOY', 90, district),
      call('940GZZLUECT', 170, district),
      call('940GZZLUFBY', 200, district)
    ]);
    expect(trains.map(stopsOf).sort((a, b) => a[0][1] - b[0][1])).toEqual([
      [
        [index('940GZZLUWBN'), 60],
        [index('940GZZLUECT'), 170]
      ],
      [[index('940GZZLUKOY'), 90]]
    ]);
  });

  it('rebuilds nameless trains from their timing', () => {
    const northern = (naptan: string, eta: number, where: string) =>
      call(naptan, eta, {
        lineId: 'northern',
        vehicleId: '000',
        destinationName: 'Morden Underground Station',
        currentLocation: where
      });
    const trains = read([
      northern('940GZZLUBOR', 60, 'Approaching Borough'),
      northern('940GZZLULNB', 90, 'Between Bank and London Bridge'),
      northern('940GZZLUEAC', 150, 'Between London Bridge and Borough'),
      northern('940GZZLUBOR', 210, 'Left Bank'),
      northern('940GZZLUKNG', 270, 'At Borough'),
      northern('940GZZLUEAC', 300, 'Between Bank and London Bridge')
    ]);
    expect(trains.map(stopsOf).sort((a, b) => a[0][1] - b[0][1])).toEqual([
      [
        [index('940GZZLUBOR'), 60],
        [index('940GZZLUEAC'), 150],
        [index('940GZZLUKNG'), 270]
      ],
      [
        [index('940GZZLULNB'), 90],
        [index('940GZZLUBOR'), 210],
        [index('940GZZLUEAC'), 300]
      ]
    ]);
    expect(trains.every((train) => train.id === null)).toBe(true);
  });

  it("drops a named train's return trip", () => {
    const back = { destinationName: 'Brixton Underground Station' };
    const trains = read([
      call('940GZZLUPCO', 60),
      call('940GZZLUVIC', 150),
      call('940GZZLUPCO', 600, back),
      call('940GZZLUVXL', 700, back)
    ]);
    expect(trains.map((train) => train.to)).toEqual(['Walthamstow Central']);
  });
});

describe('lastStation', () => {
  it.each([
    ['Between Stockwell and Vauxhall', '940GZZLUSKW'],
    ['At Vauxhall Platform 2', '940GZZLUVXL'],
    ['Left Pimlico', '940GZZLUPCO'],
    ['Departed Victoria', '940GZZLUVIC']
  ])('reads "%s"', (location, naptan) => {
    expect(lastStation(location, 'victoria')).toBe(index(naptan));
  });

  it("gives up on places that aren't stations", () => {
    expect(lastStation('Approaching Vauxhall', 'victoria')).toBeNull();
    expect(lastStation('At Platform', 'victoria')).toBeNull();
  });
});

describe('readStatus', () => {
  it('keeps the worst status per line and tidies the reason', () => {
    const [status, ...rest] = readStatus([
      {
        id: 'northern',
        lineStatuses: [
          { statusSeverity: 10, statusSeverityDescription: 'Good Service' },
          {
            statusSeverity: 6,
            statusSeverityDescription: 'Severe Delays',
            reason: ' Signal\n failure '
          }
        ]
      },
      { id: 'elizabeth', lineStatuses: [] }
    ]);
    expect(rest).toEqual([]);
    expect(status).toEqual({
      id: 'northern',
      severity: 6,
      status: 'Severe Delays',
      reason: 'Signal failure'
    });
  });
});
