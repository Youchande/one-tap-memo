import { useState } from 'react';
import { format } from 'date-fns';
import { Memo } from '../types';
import { extractTags } from '../services/tagging';

interface MemoBoardProps {
  memos: Memo[];
  onDelete: (memoId: string) => void;
  onUpdate: (memoId: string, payload: Partial<Pick<Memo, 'content' | 'tags' | 'quickTags'>>) => void;
  onTogglePin: (memoId: string) => void;
}

const formatDate = (iso: string) => format(new Date(iso), 'yyyy/MM/dd HH:mm');

const MemoBoard = ({ memos, onDelete, onTogglePin, onUpdate }: MemoBoardProps) => {
  if (memos.length === 0) {
    return (
      <section className="memo-board empty">
        <p>まだメモがありません。Enterで最初のメモを残しましょう。</p>
      </section>
    );
  }

  return (
    <section className="memo-board">
      {memos.map((memo) => (
        <MemoCard key={memo.id} memo={memo} onDelete={onDelete} onTogglePin={onTogglePin} onUpdate={onUpdate} />
      ))}
    </section>
  );
};

interface MemoCardProps {
  memo: Memo;
  onDelete: (memoId: string) => void;
  onUpdate: (memoId: string, payload: Partial<Pick<Memo, 'content' | 'tags' | 'quickTags'>>) => void;
  onTogglePin: (memoId: string) => void;
}

const MemoCard = ({ memo, onDelete, onTogglePin, onUpdate }: MemoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(memo.content);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onUpdate(memo.id, { content: trimmed, tags: extractTags(trimmed) });
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(memo.content);
    } catch (error) {
      console.error('コピーに失敗しました', error);
    }
  };

  return (
    <article className={`memo-card ${memo.pinned ? 'pinned' : ''}`}>
      <div className="card-header">
        <div>
          <span className="timestamp" title={`更新: ${formatDate(memo.updatedAt)}`}>
            {formatDate(memo.createdAt)}
          </span>
          {memo.pinned && <span className="pin-badge">PIN</span>}
        </div>
        <div className="card-actions">
          <button className="icon" onClick={() => onTogglePin(memo.id)} title="ピン留め">
            📌
          </button>
          <button className="icon" onClick={handleCopy} title="コピー">
            📋
          </button>
          <button className="icon" onClick={() => setIsEditing((prev) => !prev)} title="編集">
            ✏️
          </button>
          <button className="icon" onClick={() => onDelete(memo.id)} title="削除">
            🗑
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="editor">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} />
          <div className="editor-actions">
            <button className="ghost" onClick={() => setIsEditing(false)}>
              キャンセル
            </button>
            <button className="primary" onClick={handleSave}>
              更新
            </button>
          </div>
        </div>
      ) : (
        <p className="memo-content">{memo.content}</p>
      )}

      <footer className="memo-footer">
        <div className="tag-list">
          {memo.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              #{tag}
            </span>
          ))}
        </div>
        <div className="quick-tag-list">
          {memo.quickTags.map((tag) => (
            <span key={tag} className="quick-tag-chip">
              {tag}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
};

export default MemoBoard;
