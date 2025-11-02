import { format } from 'date-fns';
import { Memo } from '../types';

const CSV_HEADER = ['id', 'content', 'tags', 'quickTags', 'createdAt', 'updatedAt', 'pinned'];

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `csv-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

export const serializeToJSON = (memos: Memo[]): string => {
  return JSON.stringify(memos, null, 2);
};

export const serializeToCSV = (memos: Memo[]): string => {
  const rows = memos.map((memo) => [
    memo.id,
    memo.content,
    memo.tags.join('|'),
    memo.quickTags.join('|'),
    memo.createdAt,
    memo.updatedAt,
    memo.pinned ? '1' : '0',
  ]);
  const escaped = rows.map((row) => row.map((value) => escapeCsv(value ?? '')).join(','));
  return [CSV_HEADER.join(','), ...escaped].join('\n');
};

export const parseJSON = (payload: string): Memo[] => {
  const data = JSON.parse(payload);
  if (!Array.isArray(data)) throw new Error('JSON形式が不正です');
  return data as Memo[];
};

export const parseCSV = (payload: string): Memo[] => {
  const [headerLine, ...lines] = payload.trim().split(/\r?\n/);
  if (!headerLine) return [];
  const header = headerLine.split(',');
  if (header.length < CSV_HEADER.length) throw new Error('CSVヘッダーが不正です');
  return lines.filter(Boolean).map((line) => {
    const [id, content, tagsRaw, quickTagsRaw, createdAt, updatedAt, pinnedRaw] = parseCsvLine(line);
    return {
      id: id || randomId(),
      content: content ? content : '',
      tags: tagsRaw ? tagsRaw.split('|').filter(Boolean) : [],
      quickTags: quickTagsRaw ? (quickTagsRaw.split('|').filter(Boolean) as Memo['quickTags']) : [],
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      pinned: pinnedRaw === '1',
    } satisfies Memo;
  });
};

export const defaultFileName = (prefix: string) => {
  const now = new Date();
  return `${prefix}-${format(now, 'yyyyMMdd-HHmmss')}`;
};
