// Types de Hanko, utilisés par les annotations JSDoc et vérifiés par `npm run typecheck` (tsc, sans compilation).
// Le format de sauvegarde (State) ne peut évoluer que par ajout de champs : voir CLAUDE.md.

/** Un kana appris : boîte de Leitner (1 à 6) et prochaine révision (horodatage en ms). */
export interface Learned {
  box: number;
  due: number;
}

/** Record d'une partie : paquet (temps `ms` pour `n` cartes) ou contre la montre (`kpm` kana par minute). */
export interface Best {
  acc: number;
  ms?: number;
  n?: number;
  kpm?: number;
}

/** La progression sauvegardée (localStorage `hanko-kana-v1`, Supabase `progress.data`, compte Claude). */
export interface State {
  learned: Record<string, Learned>;
  done: Record<string, boolean>;
  tests: Record<string, number>;
  xp: number;
  streak: number;
  last: string;
  today: string;
  todayXp: number;
  unlock: boolean;
  ear: boolean;
  tab: string;
  page: string;
  rsc: string;
  rct: string;
  rdu: number;
  rfmt: string;
  best: Record<string, Best>;
  snd: boolean;
  draw: boolean;
  bsc: string;
  bn: number;
  bl: number;
  /** Horodatage de la dernière sauvegarde (absent sur un appareil qui n'a jamais rien enregistré). */
  at?: number;
  /** Champs d'une version plus récente du jeu : conservés tels quels. */
  [champ: string]: unknown;
}

/** Une sauvegarde lue ailleurs (autre appareil, ancien format) : n'importe quel champ peut manquer. */
export type SavedState = Partial<State>;

export type Script = 'h' | 'k';

export interface Item {
  c: string;
  r: string;
  al: string[];
  s: Script;
}

export interface Lesson {
  id: string;
  t: string;
  items: string[];
  u?: Unit;
  s?: Script;
  idx?: number;
}

export interface Unit {
  id: string;
  t: string;
  lessons: Lesson[];
  s?: Script;
}

export interface Word {
  j: string;
  f: string;
  t?: string[];
  r?: string;
  s?: Script;
}
