export type Action = 'move_left' | 'move_right' | 'fire' | 'start';
export interface InputMessage {
    readonly type: 'input';
    readonly action: Action;
}
//# sourceMappingURL=input.d.ts.map