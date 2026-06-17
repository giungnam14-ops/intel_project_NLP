// Pull date/deadline facts out of the analysis result and, where a concrete
// calendar date can be parsed, let the user export an .ics (no backend, no libs).

function pad(num) {
  return String(num).padStart(2, '0');
}

// Parse an absolute Korean date from text → { y, m, d } or null.
// Handles "YYYY년 M월 D일" and "M월 D일" (assumes the next upcoming year).
export function parseKoreanDate(text) {
  const value = String(text || '');

  const full = value.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (full) {
    return { y: Number(full[1]), m: Number(full[2]), d: Number(full[3]) };
  }

  const md = value.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    const now = new Date();
    let year = now.getFullYear();
    const candidate = new Date(year, month - 1, day);
    // If the date already passed this year, assume next year.
    if (candidate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      year += 1;
    }
    return { y: year, m: month, d: day };
  }

  return null;
}

function toIcsDate(parsed) {
  return `${parsed.y}${pad(parsed.m)}${pad(parsed.d)}`;
}

// Build deadline entries from key_facts.dates.
export function extractDeadlines(result) {
  const dates = Array.isArray(result?.key_facts?.dates) ? result.key_facts.dates : [];
  return dates.map((item) => ({
    label: item?.label || '기한',
    value: item?.value || '',
    source: item?.source_text || '',
    parsed: parseKoreanDate(item?.value) || parseKoreanDate(item?.source_text)
  }));
}

function icsEscape(text) {
  return String(text || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, ' ');
}

// Build a VCALENDAR string from entries that have a parsed date.
export function buildIcs(entries) {
  const stamp = new Date();
  const dtstamp = `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}${pad(stamp.getUTCSeconds())}Z`;

  const events = entries
    .filter((entry) => entry.parsed)
    .map((entry, index) => {
      const date = toIcsDate(entry.parsed);
      return [
        'BEGIN:VEVENT',
        `UID:munyo-${date}-${index}@munyo`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:[문요] ${icsEscape(entry.label)} (${icsEscape(entry.value)})`,
        `DESCRIPTION:${icsEscape(entry.source)}`,
        'END:VEVENT'
      ].join('\r\n');
    });

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//문요//KO', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(entries, filename = 'munyo-deadlines.ics') {
  const ics = buildIcs(entries);
  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.warn('[문요] 일정 내보내기에 실패했어요.', err);
    return false;
  }
}
