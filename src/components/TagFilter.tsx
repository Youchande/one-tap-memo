import { ChangeEvent } from 'react';
import { MemoFilter, QuickTag } from '../types';
import { toggleQuickTag } from '../services/tagging';

interface TagFilterProps {
  filter: MemoFilter;
  tags: string[];
  quickTags: QuickTag[];
  onChange: (next: MemoFilter) => void;
  onReset: () => void;
}

const TagFilter = ({ filter, tags, quickTags, onChange, onReset }: TagFilterProps) => {
  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filter, text: event.target.value });
  };

  const handleTagToggle = (tag: string) => {
    const exists = filter.tags.includes(tag);
    onChange({
      ...filter,
      tags: exists ? filter.tags.filter((t) => t !== tag) : [...filter.tags, tag],
    });
  };

  const handleQuickTagToggle = (tag: QuickTag) => {
    onChange({
      ...filter,
      quickTags: toggleQuickTag(filter.quickTags, tag),
    });
  };

  return (
    <section className="filter-panel">
      <header>
        <h3>フィルタ</h3>
        <button className="ghost" onClick={onReset}>
          リセット
        </button>
      </header>
      <div className="filter-grid">
        <label>
          キーワード
          <input type="text" value={filter.text} onChange={handleTextChange} placeholder="語句で検索" />
        </label>
        <label>
          日付
          <input
            type="date"
            value={filter.date ?? ''}
            onChange={(event) => onChange({ ...filter, date: event.target.value || null })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filter.onlyPinned}
            aria-label="ピンのみ"
            onChange={(event) => onChange({ ...filter, onlyPinned: event.target.checked })}
          />
          ピンのみ
        </label>
      </div>
      <div className="tag-filter-group">
        <p>#タグ</p>
        <div className="chip-list">
          {tags.length === 0 && <span className="hint">まだタグがありません</span>}
          {tags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={filter.tags.includes(tag) ? 'tag-chip active' : 'tag-chip'}
              onClick={() => handleTagToggle(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
      <div className="tag-filter-group">
        <p>クイックタグ</p>
        <div className="chip-list">
          {quickTags.map((tag) => (
            <button
              type="button"
              key={tag}
              className={filter.quickTags.includes(tag) ? 'quick-tag active' : 'quick-tag'}
              onClick={() => handleQuickTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TagFilter;
