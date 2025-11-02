import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { extractTags, toggleQuickTag } from '../services/tagging';
import { QuickTag } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface MemoInputProps {
  quickTags: QuickTag[];
  onSubmit: (content: string, tags: string[], quickTags: QuickTag[]) => void;
}

const MemoInput = ({ quickTags, onSubmit }: MemoInputProps) => {
  const [content, setContent] = useState('');
  const [selectedQuickTags, setSelectedQuickTags] = useState<QuickTag[]>([]);
  const { isSupported, isListening, listen } = useSpeechToText();
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setContent('');
    setSelectedQuickTags([]);
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed, extractTags(trimmed), selectedQuickTags);
    reset();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleSubmit();
  };

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!isSupported) {
          setError('このブラウザは音声入力に対応していません');
          return;
        }
        listen(
          (text) => {
            setContent((prev) => (prev ? `${prev}\n${text}` : text));
            setError(null);
          },
          (message) => setError(`音声入力エラー: ${message}`)
        );
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSupported, listen]);

  return (
    <section className="memo-input">
      <header>
        <h2>いまの思考を一瞬で固定</h2>
        <p>Enterで保存・Shift+Enterで改行・Alt+Sで音声入力</p>
      </header>
      <form onSubmit={handleFormSubmit}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="いま浮かんだことをメモ..."
          aria-label="メモ入力"
          rows={4}
        />
        <div className="quick-tag-container">
          {quickTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={selectedQuickTags.includes(tag) ? 'quick-tag active' : 'quick-tag'}
              onClick={() => setSelectedQuickTags((prev) => toggleQuickTag(prev, tag))}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="submit" className="primary">
            ワンタップ保存
          </button>
          {isSupported ? (
            <span className={`voice-indicator ${isListening ? 'active' : ''}`}>
              🎙 Alt+S
            </span>
          ) : (
            <span className="voice-indicator disabled">音声入力非対応</span>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
};

export default MemoInput;
