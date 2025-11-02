export type QuickTag = '仕事' | '私事' | 'アイデア' | '学び' | 'ToDo';

export interface Memo {
  id: string;
  content: string;
  tags: string[];
  quickTags: QuickTag[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface MemoFilter {
  text: string;
  tags: string[];
  quickTags: QuickTag[];
  date: string | null;
  onlyPinned: boolean;
}
