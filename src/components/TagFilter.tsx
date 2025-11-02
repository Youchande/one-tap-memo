import { ChangeEvent, useEffect, useRef, useState } from 'react';
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

  const [expanded, setExpanded] = useState(hasActiveFilters);
  const previousActive = useRef(hasActiveFilters);
  const detailsId = 'memo-filter-details';

  useEffect(() => {
    if (hasActiveFilters && !previousActive.current) {
      setExpanded(true);
    }
    if (!hasActiveFilters) {
      setExpanded(false);
    }
    previousActive.current = hasActiveFilters;
  }, [hasActiveFilters]);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const showDetails = expanded;

  return (
    <section
      className={`filter-panel ${showDetails ? 'expanded' : 'collapsed'}${hasActiveFilters ? ' active' : ''}`}
      aria-label="検索フィルタ"
    >
      <div className="filter-compact">
        <label htmlFor="memo-filter-text" className="sr-only">
          メモを検索
        </label>
        <input
          id="memo-filter-text"
          type="text"
          value={filter.text}
          onChange={handleTextChange}
          placeholder="メモ内検索"
        />
        <div className="compact-actions">
          {hasActiveFilters && (
            <>
              <span className="filter-indicator" aria-hidden="true" />
              <span className="sr-only" role="status">
                フィルタ適用中
              </span>
            </>
          )}
          <button
            type="button"
            className={hasActiveFilters ? 'ghost toggle active' : 'ghost toggle'}
            aria-expanded={expanded}
            onClick={toggleExpanded}
            aria-controls={detailsId}
            aria-label={expanded ? '詳細フィルタを閉じる' : '詳細フィルタを開く'}
          >
            {expanded ? '閉じる' : '詳細'}
          </button>
          {hasActiveFilters && (
            <button type="button" className="ghost" onClick={onReset}>
              リセット
            </button>
          )}
        </div>
      </div>
      {showDetails && (
        <div className="filter-details" id={detailsId}>
          <div className="filter-row">
            <label className="filter-label" htmlFor="memo-filter-date">
              日付
            </label>
            <input
              id="memo-filter-date"
              type="date"
              value={filter.date ?? ''}
              onChange={(event) => onChange({ ...filter, date: event.target.value || null })}
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
          <div className="tag-filter-group">
            <p className="filter-label">#タグ</p>
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
            <p className="filter-label">クイックタグ</p>
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
        </div>
      )}
    </section>
  );
};

export default TagFilter;
