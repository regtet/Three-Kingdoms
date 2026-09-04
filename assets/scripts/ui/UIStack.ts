/** 面板栈条目：关闭时执行 cleanup */
export interface UIStackEntry {
  id: string;
  close: () => void;
}

/** 轻量 UI 栈，管理模态/子面板打开顺序 */
export class UIStack {
  private stack: UIStackEntry[] = [];

  push(entry: UIStackEntry): void {
    this.remove(entry.id);
    this.stack.push(entry);
  }

  pop(): UIStackEntry | undefined {
    return this.stack.pop();
  }

  popAndClose(): void {
    this.pop()?.close();
  }

  remove(id: string): void {
    this.stack = this.stack.filter((e) => e.id !== id);
  }

  close(id: string): void {
    const idx = this.stack.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const [entry] = this.stack.splice(idx, 1);
    entry.close();
  }

  clear(closeAll = true): void {
    if (closeAll) {
      while (this.stack.length) this.stack.pop()?.close();
    } else {
      this.stack = [];
    }
  }

  get top(): UIStackEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  has(id: string): boolean {
    return this.stack.some((e) => e.id === id);
  }

  get size(): number {
    return this.stack.length;
  }
}
