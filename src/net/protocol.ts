export type VersusMsg =
  | { t: 'join'; id: string; name: string }
  | { t: 'score'; id: string; delta: number }
  | { t: 'state'; scores: Record<string, number>; names: Record<string, string>; hostId: string; winnerId?: string; timeLeft: number; target: number }
  | { t: 'ping'; id: string; ts: number };

export type VersusView = {
  selfId: string;
  hostId?: string;
  names: Record<string, string>;
  scores: Record<string, number>;
  winnerId?: string;
  timeLeft: number;
  target: number;
};
