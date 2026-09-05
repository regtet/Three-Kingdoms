/** 全屏 Layer 互斥导航（复刻用，无引擎硬依赖） */
export type LayerLike = { active: boolean };

export class RemakeNav {
  private layers = new Map<string, LayerLike>();
  private current: string | null = null;
  private onShow: ((id: string) => void) | null = null;

  register(id: string, layer: LayerLike): void {
    this.layers.set(id, layer);
    layer.active = false;
  }

  setOnShow(cb: (id: string) => void): void {
    this.onShow = cb;
  }

  show(id: string): void {
    if (!this.layers.has(id)) return;
    for (const [key, layer] of this.layers) {
      layer.active = key === id;
    }
    this.current = id;
    this.onShow?.(id);
  }

  getCurrent(): string | null {
    return this.current;
  }
}

export type MenuScreenId =
  | 'title'
  | 'scenario'
  | 'faction'
  | 'saveList'
  | 'settings'
  | 'mapStub'
  | 'end';
