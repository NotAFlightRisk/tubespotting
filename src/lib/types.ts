import type { LineId } from './lines.js';

/** One upcoming call: station index, seconds after the snapshot, platform index */
export type Stop = [station: number, eta: number, platform: number];

export interface TrainReading {
  /** TfL's vehicle id, which two trains can share, or null without one; the client keeps track */
  id: string | null;
  line: LineId;
  to: string;
  /** The destination's station, when it's one of ours */
  dest: number | null;
  where: string;
  /** Station the train last left or is sitting at, when TfL says */
  from: number | null;
  stops: Stop[];
}

export interface LineStatus {
  id: LineId;
  severity: number;
  status: string;
  reason: string | null;
  /** Tracks with no trains on, as the network's pair keys, when some or all of the line is shut */
  closed?: string[];
}

export interface Snapshot {
  /** When TfL was read, epoch ms */
  at: number;
  stale: boolean;
  trains: TrainReading[];
  platforms: string[];
  status: LineStatus[];
}
