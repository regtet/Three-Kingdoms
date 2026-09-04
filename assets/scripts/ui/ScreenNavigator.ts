/** 与 GameRoot.Screen 一致的全屏 Layer 标识 */
export type GameScreen =
  | 'menu'
  | 'saveList'
  | 'scenario'
  | 'scenarioDetail'
  | 'faction'
  | 'generalGallery'
  | 'backgroundGallery'
  | 'map'
  | 'end'
  | 'settings';

/**
 * 全屏 Layer 导航：互斥显隐 + 切换回调。
 * 不负责模态面板（由 UIManager 栈管理）。
 */
export class ScreenNavigator {
  private _current: GameScreen = 'menu';

  constructor(
    private readonly layers: Record<GameScreen, Node>,
    private readonly onShow: (screen: GameScreen, prev: GameScreen) => void,
  ) {}

  get current(): GameScreen {
    return this._current;
  }

  show(screen: GameScreen): void {
    const prev = this._current;
    this._current = screen;
    for (const key of Object.keys(this.layers) as GameScreen[]) {
      this.layers[key].active = key === screen;
    }
    this.onShow(screen, prev);
  }
}
