export type GameStatus = 'waiting' | 'playing' | 'gameover'

export interface Player {
  readonly x:     number
  readonly y:     number
  readonly lives: number
  readonly vx:    number
}

export interface Invader {
  readonly id:    number
  readonly x:     number
  readonly y:     number
  readonly row:   number
  readonly col:   number
  readonly alive: boolean
}

export interface Bullet {
  readonly id:    number
  readonly x:     number
  readonly y:     number
  readonly owner: 'player' | 'invader'
}

export interface ShieldBlock {
  readonly hp: number
}

export interface Shield {
  readonly id:     number
  readonly x:      number
  readonly y:      number
  readonly blocks: readonly (readonly ShieldBlock[])[]
}

export interface UFO {
  readonly active: boolean
  readonly x:      number
  readonly points: number
}

export interface GameState {
  readonly type:        'state'
  readonly tick:        number
  readonly status:      GameStatus
  readonly score:       number
  readonly level:       number
  readonly player:      Player
  readonly invaders:    readonly Invader[]
  readonly bullets:     readonly Bullet[]
  readonly shields:     readonly Shield[]
  readonly ufo:         UFO
  readonly attractMode: boolean
}
