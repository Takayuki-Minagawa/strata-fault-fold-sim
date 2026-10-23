/**
 * localStorage の安全なラッパー。
 * プライベートブラウズ等で例外が出ても動作を止めない。
 */
export function loadItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 保存できなくても学習は続けられる
  }
}
