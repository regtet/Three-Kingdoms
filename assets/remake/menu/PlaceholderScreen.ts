import { Node } from 'cc';
import { createMenuShell, makeRowLabel } from '../shared/MenuShell';

/** 占位页也走二级页标准壳，避免「还是老样子」 */
export async function buildPlaceholderScreen(
  layer: Node,
  title: string,
  onBack: () => void,
): Promise<void> {
  const shell = await createMenuShell(layer, title, onBack);
  makeRowLabel(shell.body, 'Hint', '内容页建设中 · 精致重开按屏推进', 80, {
    fontSize: 28,
  });
}
