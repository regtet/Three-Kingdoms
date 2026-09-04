/** 游戏状态变更通知（UI 订阅后刷新，避免 GameRoot 紧耦合） */
type StateListener = () => void;

const listeners = new Set<StateListener>();

export function onGameStateChange(fn: StateListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitGameStateChange(): void {
  for (const fn of listeners) fn();
}
