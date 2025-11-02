import { useEffect, useMemo, useState } from 'react';
import MemoInput from './components/MemoInput';
import MemoBoard from './components/MemoBoard';
import TagFilter from './components/TagFilter';
import { Memo, MemoFilter, QuickTag } from './types';
import { collectAllTags, filterMemos, QUICK_TAGS } from './services/tagging';
import {
  createMemo,
  deleteMemo,
  loadMemos,
  replaceAll,
  togglePin,
  updateMemo,
  clearAll,
} from './services/storage';
import { defaultFileName, parseCSV, parseJSON, serializeToCSV, serializeToJSON } from './services/export';

const THEME_KEY = 'one-tap-memo:theme';

type Theme = 'light' | 'dark';

const defaultFilter: MemoFilter = {
  text: '',
  tags: [],
  quickTags: [],
  date: null,
  onlyPinned: false,
};

function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filter, setFilter] = useState<MemoFilter>(defaultFilter);
  const [theme, setTheme] = useState<Theme>('dark');
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadMemos();
    setMemos(
      stored.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
    const storedTheme = (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'dark';
    setTheme(storedTheme);
    document.documentElement.dataset.theme = storedTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const showFlash = (message: string) => {
    setFlash(message);
    setTimeout(() => setFlash(null), 2200);
  };

  const handleCreateMemo = (content: string, tags: string[], quickTags: QuickTag[]) => {
    const memo = createMemo(content, tags, quickTags);
    setMemos((prev) => [memo, ...prev]);
    showFlash('保存しました');
  };

  const handleUpdateMemo = (memoId: string, payload: Partial<Pick<Memo, 'content' | 'tags' | 'quickTags'>>) => {
    const updated = updateMemo(memoId, (memo) => ({ ...memo, ...payload }));
    if (!updated) return;
    setMemos((prev) => prev.map((memo) => (memo.id === memoId ? updated : memo)));
    showFlash('更新しました');
  };

  const handleDeleteMemo = (memoId: string) => {
    deleteMemo(memoId);
    setMemos((prev) => prev.filter((memo) => memo.id !== memoId));
    showFlash('削除しました');
  };

  const handleTogglePin = (memoId: string) => {
    const pinned = togglePin(memoId);
    setMemos((prev) =>
      prev
        .map((memo) => (memo.id === memoId ? { ...memo, pinned } : memo))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  };

  const handleExportJSON = () => {
    const blob = new Blob([serializeToJSON(memos)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultFileName('one-tap-memo')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showFlash('JSONを書き出しました');
  };

  const handleExportCSV = () => {
// 文字化け防止のため UTF-8 を明示
const blob = new Blob([serializeToCSV(memos)], { type: 'text/csv;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultFileName('one-tap-memo')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showFlash('CSVを書き出しました');
  };

  const handleImport = async (file: File, type: 'json' | 'csv') => {
    const text = await file.text();
    const imported = type === 'json' ? parseJSON(text) : parseCSV(text);
    const sorted = imported
      .slice()
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    replaceAll(sorted);
    setMemos(sorted);
    showFlash('インポートしました');
  };

  const handleClearAll = () => {
    if (!confirm('すべてのメモを削除しますか？')) return;
    clearAll();
    setMemos([]);
    showFlash('全メモを削除しました');
  };

  const filteredMemos = useMemo(() => filterMemos(memos, filter), [memos, filter]);
  const allTags = useMemo(() => collectAllTags(memos), [memos]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>One Tap Memo</h1>
          <p className="subtitle">思考の断片を、速度を落とさず記録する</p>
        </div>
        <div className="header-actions">
          <button className="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            テーマ: {theme === 'dark' ? 'ダーク' : 'ライト'}
          </button>
          <button className="ghost" onClick={handleExportJSON}>
            JSON出力
          </button>
          <button className="ghost" onClick={handleExportCSV}>
            CSV出力
          </button>
          <label className="ghost file-input">
            JSON入力
            <input
              type="file"
              accept="application/json"
              aria-label="JSON入力"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                handleImport(file, 'json');
                event.currentTarget.value = '';
              }}
            />
          </label>
          <label className="ghost file-input">
            CSV入力
            <input
              type="file"
              accept="text/csv"
              aria-label="CSV入力"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                handleImport(file, 'csv');
                event.currentTarget.value = '';
              }}
            />
          </label>
          <button className="danger ghost" onClick={handleClearAll}>
            全削除
          </button>
        </div>
      </header>

      <main>
        <MemoInput quickTags={QUICK_TAGS} onSubmit={handleCreateMemo} />
        <TagFilter
          filter={filter}
          tags={allTags}
          quickTags={QUICK_TAGS}
          onChange={setFilter}
          onReset={() => setFilter({ ...defaultFilter })}
        />
        <MemoBoard
          memos={filteredMemos}
          onDelete={handleDeleteMemo}
          onUpdate={handleUpdateMemo}
          onTogglePin={handleTogglePin}
        />
      </main>

      {flash && <div className="flash-message">{flash}</div>}
    </div>
  );
}

export default App;
