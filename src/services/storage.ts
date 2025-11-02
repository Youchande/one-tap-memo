import { Memo } from '../types';

const STORAGE_KEY = 'one-tap-memo:data';

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const loadMemos = (): Memo[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map((memo) => ({
        ...memo,
        tags: memo.tags ?? [],
        quickTags: memo.quickTags ?? [],
        pinned: memo.pinned ?? false,
      }));
    }
  } catch (error) {
    console.error('Failed to parse memo data', error);
  }
  return [];
};

const persist = (memos: Memo[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
};

export const createMemo = (content: string, tags: string[], quickTags: Memo['quickTags']): Memo => {
  const timestamp = new Date().toISOString();
  const memo: Memo = {
    id: generateId(),
    content,
    tags,
    quickTags,
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false,
  };
  const memos = loadMemos();
  memos.unshift(memo);
  persist(memos);
  return memo;
};

export const updateMemo = (memoId: string, updater: (memo: Memo) => Memo): Memo | null => {
  const memos = loadMemos();
  const index = memos.findIndex((memo) => memo.id === memoId);
  if (index === -1) return null;
  const updated = updater({ ...memos[index] });
  updated.updatedAt = new Date().toISOString();
  memos[index] = updated;
  persist(memos);
  return updated;
};

export const deleteMemo = (memoId: string) => {
  const memos = loadMemos();
  const filtered = memos.filter((memo) => memo.id !== memoId);
  persist(filtered);
};

export const togglePin = (memoId: string) => {
  return updateMemo(memoId, (memo) => ({ ...memo, pinned: !memo.pinned }))?.pinned ?? false;
};

export const replaceAll = (memos: Memo[]) => {
  persist(memos);
};

export const clearAll = () => {
  localStorage.removeItem(STORAGE_KEY);
};
