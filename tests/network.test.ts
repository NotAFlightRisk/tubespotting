import { describe, expect, it } from 'vitest';
import { lineById } from '#lib/lines.js';
import { tracks } from '#lib/network.js';

describe('tracks', () => {
  it('never shares a track between modes, so switching one off never shifts another', () => {
    const mixed = tracks.filter(
      (track) => new Set(track.lines.map((l) => lineById(l)!.mode)).size > 1
    );
    expect(mixed).toEqual([]);
  });
});
