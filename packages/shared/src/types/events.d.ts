import type { GameState } from './state.js';
export type EventName = 'invader_killed' | 'player_hit' | 'gameover' | 'level_clear' | 'ufo_killed';
export interface GameEvent {
    readonly type: 'event';
    readonly name: EventName;
    readonly data: Record<string, unknown>;
}
export type ServerMessage = GameState | GameEvent;
//# sourceMappingURL=events.d.ts.map