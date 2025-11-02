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

  const hasActiveFilters =
    Boolean(filter.text) ||
    Boolean(filter.date) ||
    filter.onlyPinned ||
    filter.tags.length > 0 ||
    filter.quickTags.length > 0;

  return (
    <section className="filter-panel" aria-label="検索フィルタ">
      <div className="filter-toolbar">
        <h3>検索</h3>
        <div className="filter-inputs">
          <input type="text" value={filter.text} onChange={handleTextChange} placeholder="語句" />
          <input
            type="date"
            value={filter.date ?? ''}
            onChange={(event) => onChange({ ...filter, date: event.target.value || null })}
            aria-label="日付で絞り込み"
          />
          <label className={filter.onlyPinned ? 'toggle active' : 'toggle'}>
            <input
              type="checkbox"
              checked={filter.onlyPinned}
              onChange={(event) => onChange({ ...filter, onlyPinned: event.target.checked })}
            />
            ピンのみ
          </label>
        </div>
        <button className="ghost" onClick={onReset} disabled={!hasActiveFilters}>
          リセット
        </button>
      </div>
      <div className="tag-filter-group">
        <p>#タグ</p>
        <div className="chip-list compact">
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
        <div className="chip-list compact">
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
