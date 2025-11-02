import { isSameDay } from 'date-fns';
import { Memo, MemoFilter, QuickTag } from '../types';

const TAG_REGEX = /#(\p{L}[\p{L}\p{N}_-]*)/gu;

export const QUICK_TAGS: QuickTag[] = ['仕事', '私事', 'アイデア', '学び', 'ToDo'];

export const extractTags = (content: string): string[] => {
  const matches = content.match(TAG_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((tag) => tag.slice(1).toLowerCase())));
};

export const toggleQuickTag = (active: QuickTag[], tag: QuickTag): QuickTag[] => {
  return active.includes(tag) ? active.filter((t) => t !== tag) : [...active, tag];
};

const normalize = (value: string) => value.toLowerCase();

export const filterMemos = (memos: Memo[], filter: MemoFilter): Memo[] => {
  return memos.filter((memo) => {
    if (filter.onlyPinned && !memo.pinned) return false;

    if (filter.text) {
      const text = normalize(filter.text);
      if (!normalize(memo.content).includes(text)) return false;
    }

    if (filter.tags.length > 0) {
      const memoTags = memo.tags.map((tag) => normalize(tag));
      const targetTags = filter.tags.map((tag) => normalize(tag));
      if (!targetTags.every((tag) => memoTags.includes(tag))) return false;
    }

    if (filter.quickTags.length > 0) {
      if (!filter.quickTags.every((tag) => memo.quickTags.includes(tag))) return false;
    }

    if (filter.date) {
      const targetDate = new Date(filter.date);
      const memoDate = new Date(memo.createdAt);
      if (!isSameDay(targetDate, memoDate)) return false;
    }

    return true;
  });
};

export const collectAllTags = (memos: Memo[]): string[] => {
  const set = new Set<string>();
  memos.forEach((memo) => memo.tags.forEach((tag) => set.add(tag)));
  return Array.from(set);
};
