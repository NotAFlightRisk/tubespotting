import type { Place } from '#lib/network.js';
import type { Busy, Facts, TrainTimes } from '#lib/types.js';
import stations from './stations.json' with { type: 'json' };

const facts: Record<string, Facts> = stations.facts;
const busy: Record<string, Busy> = stations.busy;
const trains: Record<string, TrainTimes> = stations.trains;

// TfL files a hub's facts under the hub, and the rest under the station
const keyOf = ({ members: [{ hub, id }] }: Place) => hub ?? id;

export const factsOf = (place: Place) => facts[keyOf(place)] ?? null;
export const busyOf = (place: Place) => busy[keyOf(place)] ?? null;
export const trainsOf = (place: Place) => trains[keyOf(place)] ?? null;
