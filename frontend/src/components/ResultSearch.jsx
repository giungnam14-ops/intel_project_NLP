import { useState } from 'react';
import { searchResult, suggestedTerms } from '../utils/search';

const MAX_RESULTS = 5;

function ResultSearch({ result, documentText, onShowInDocument }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const terms = suggestedTerms(result?.document_type);
  const trimmed = query.trim();
  const matches = trimmed ? searchResult(result, documentText, trimmed) : [];
  const top = matches.slice(0, MAX_RESULTS);

  const handleOpenInDocument = (match) => {
    const isGood = match.quality === 'good' && Boolean(match.cleaned);
    onShowInDocument({
      title: match.label || '검색 결과',
      text: isGood ? match.cleaned : '',
      rawTextForMatch: match.raw,
      source: isGood ? match.cleaned : match.raw,
      quality: isGood ? 'good' : 'low'
    });
  };

  return (
    <section className="result-search">
      <button
        type="button"
        className="result-search-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>🔎 결과 안에서 찾기</span>
        <span className="result-search-caret" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="result-search-body">
          <input
            type="text"
            className="result-search-input"
            placeholder="환불, 개인정보, 기한, 위약금처럼 찾아보세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="result-search-chips">
            {terms.map((term) => (
              <button type="button" key={term} className="chip" onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>

          {trimmed && (
            matches.length > 0 ? (
              <>
                <p className="result-search-count">
                  {matches.length}개 찾음{matches.length > top.length ? ` · 상위 ${top.length}개` : ''}
                </p>
                <ul className="result-search-list">
                  {top.map((match, index) => (
                    <li key={`${match.type}-${index}`}>
                      <button
                        type="button"
                        className="result-search-item"
                        onClick={() => handleOpenInDocument(match)}
                      >
                        <span className="result-search-type">{match.type}</span>
                        {match.quality === 'low' ? (
                          <span className="result-search-lowq">원본 확인 필요</span>
                        ) : (
                          <span className="result-search-snippet">{match.snippet}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="result-search-empty">‘{trimmed}’에 대한 결과를 찾지 못했어요.</p>
            )
          )}
        </div>
      )}
    </section>
  );
}

export default ResultSearch;
