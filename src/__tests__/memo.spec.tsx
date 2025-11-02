import { describe, expect, beforeEach, vi, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { serializeToCSV, parseCSV } from '../services/export';

class MockSpeechRecognition {
  public lang = 'ja-JP';
  public continuous = false;
  public interimResults = false;
  private listeners: Record<string, ((event: Event) => void)[]> = {};

  addEventListener(event: string, callback: (event: Event) => void) {
    this.listeners[event] = this.listeners[event] ?? [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: (event: Event) => void) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((listener) => listener !== callback);
  }

  start() {
    const results = [
      {
        0: { transcript: '音声メモ', confidence: 1 },
        length: 1,
        isFinal: true,
      },
    ] as unknown as SpeechRecognitionResultList;
    const event = { results } as unknown as Event;
    this.listeners['result']?.forEach((listener) => listener(event));
    this.listeners['end']?.forEach((listener) => listener(new Event('end')));
  }

  stop() {
    /* noop */
  }
}

declare global {
  interface Window {
    SpeechRecognition?: typeof MockSpeechRecognition;
  }
}

const setupEnvironment = () => {
  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    value: MockSpeechRecognition,
  });

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:mock'),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });

  HTMLAnchorElement.prototype.click = vi.fn();

  Object.defineProperty(window, 'confirm', {
    configurable: true,
    value: vi.fn(() => true),
  });
};

const addMemo = async (text: string, quickTag?: string) => {
  const textarea = screen.getByLabelText('メモ入力');
  if (quickTag) {
    const button = screen.getByRole('button', { name: quickTag });
    await userEvent.click(button);
  }
  await userEvent.type(textarea, text);
  fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
};

describe('One Tap Memo', () => {
  beforeEach(() => {
    localStorage.clear();
    setupEnvironment();
  });

  it('Enter保存でタグが自動抽出される', async () => {
    render(<App />);
    await addMemo('これはテスト #集中');

    const memoCard = await screen.findByText(/これはテスト/);
    expect(memoCard).toBeInTheDocument();
    expect(screen.getByText('#集中')).toBeInTheDocument();
  });

  it('クイックタグと音声入力がメモに反映される', async () => {
    render(<App />);
    await addMemo('手入力メモ', '仕事');

    const textarea = screen.getByLabelText('メモ入力');
    window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 's' }));
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(await screen.findByText(/音声メモ/)).toBeInTheDocument();
    expect(screen.getByText('仕事')).toBeInTheDocument();
  });

  it('テキスト・タグ・ピンでフィルタできる', async () => {
    render(<App />);
    await addMemo('朝会で決めたこと #standup', '仕事');
    await addMemo('夜ご飯のレシピ #cooking', '私事');

    const pinButtons = screen.getAllByTitle('ピン留め');
    await userEvent.click(pinButtons[0]);

    const keywordInput = screen.getByPlaceholderText('語句で検索');
    await userEvent.type(keywordInput, 'レシピ');
    expect(screen.getByText(/夜ご飯のレシピ/)).toBeInTheDocument();
    expect(screen.queryByText(/朝会で決めたこと/)).not.toBeInTheDocument();

    await userEvent.clear(keywordInput);
    const tagButton = screen.getByRole('button', { name: '#standup' });
    await userEvent.click(tagButton);
    expect(screen.getByText(/朝会で決めたこと/)).toBeInTheDocument();
    expect(screen.queryByText(/夜ご飯/)).not.toBeInTheDocument();

    const pinOnly = screen.getByLabelText('ピンのみ');
    await userEvent.click(pinOnly);
    expect(screen.queryByText(/朝会で決めたこと/)).not.toBeInTheDocument();
  });

  it('JSONとCSVを出力できる', async () => {
    render(<App />);
    await addMemo('Export test #json');

    const jsonButton = screen.getByRole('button', { name: 'JSON出力' });
    await userEvent.click(jsonButton);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    const csvButton = screen.getByRole('button', { name: 'CSV出力' });
    await userEvent.click(csvButton);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('CSVがUTF-8のBOM付きで日本語を保持する', () => {
    const memo = {
      id: 'csv-1',
      content: '日本語メモ',
      tags: ['タグ'],
      quickTags: ['仕事'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      pinned: false,
    } as const;

    const csv = serializeToCSV([memo]);
    expect(csv.startsWith('\uFEFF')).toBe(true);

    const [parsed] = parseCSV(csv);
    expect(parsed.content).toBe('日本語メモ');
    expect(parsed.tags).toEqual(['タグ']);
  });

  it('JSONインポートでメモが置き換わる', async () => {
    render(<App />);
    const data = [
      {
        id: 'import-1',
        content: 'インポート済み',
        tags: ['import'],
        quickTags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      },
    ];
    const file = new File([JSON.stringify(data)], 'import.json', { type: 'application/json' });
    const input = screen.getByLabelText('JSON入力');
    await userEvent.upload(input, file);

    expect(await screen.findByText('インポート済み')).toBeInTheDocument();
  });
});
