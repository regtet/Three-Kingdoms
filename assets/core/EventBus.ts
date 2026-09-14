/** 游戏内事件总线：core 与（日后）界面通过字符串事件解耦通知。禁止依赖 Cocos。 */

export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly listeners = new Map<string, Set<EventHandler>>();

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler as EventHandler);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      (handler as EventHandler<T>)(payload as T);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** 全局默认可选总线（单测可 new 独立实例） */
export const gameEvents = new EventBus();
