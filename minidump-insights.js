/* 미니덤프 분석기 보조 모듈: 업로드 전 검사·수집 폴더 검증·결과 설명 카드 렌더링.
 *
 * DOM을 직접 만지지 않고 HTML 문자열만 돌려준다(모든 사용자·서버 값은 esc()로 escape).
 * 서버의 규칙 기반 분석(crash_insights.py) 결과를 화면에 옮기는 역할이며, AI 결과와는 무관하다.
 * 브라우저에서는 window.ITSVC_Insights, Node 테스트에서는 module.exports로 쓴다.
 */
(function (root) {
  'use strict';

  const LIMITS = { dump: 64 * 1024 * 1024, evtx: 80 * 1024 * 1024, json: 2 * 1024 * 1024 };
  const MIN_BYTES = { dump: 256, evtx: 4096 };
  const MAX_DUMPS = 8;
  const ERR_COPY = '파일을 바탕화면에 복사한 뒤 다시 올려 주세요.';

  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ko-KR', { hour12: false });
  }

  const KERNEL_DUMP_TYPES = {
    1: '전체 메모리 덤프', 2: '커널 메모리 덤프', 4: '작은 메모리 덤프(트리아지)',
    5: '전체 메모리 덤프(자동/비트맵)', 6: '커널 메모리 덤프(자동/비트맵)',
  };

  // ── 업로드 전 파일 검사 ────────────────────────────────────────────────
  function extOf(name) {
    const m = /\.([A-Za-z0-9]+)$/.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }

  function ascii(bytes, from, len) {
    let s = '';
    for (let i = from; i < from + len && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }

  /** 파일 하나를 올리기 전에 크기·형식·읽기 가능 여부를 확인한다. 파일 내용을 서버로 보내지 않는다. */
  async function inspectFile(file) {
    const name = file.name || '';
    const ext = extOf(name);
    const item = {
      name, size: file.size, sizeText: fmtSize(file.size || 0), modified: file.lastModified || null,
      path: file.webkitRelativePath || file._path || '', ext, kind: null, typeLabel: '', status: 'ok',
      problems: [], notes: [], readable: null, file,
    };
    const kind = ext === 'dmp' ? 'dump' : ext === 'evtx' ? 'evtx' : ext === 'json' ? 'json' : null;
    item.kind = kind;
    if (!kind) {
      item.status = 'skip';
      item.typeLabel = '지원하지 않는 형식';
      item.notes.push('.dmp, .evtx, hardware.json만 분석할 수 있어 건너뜁니다.');
      return item;
    }
    if (!file.size) {
      item.status = 'block';
      item.readable = false;
      item.problems.push('0바이트 파일입니다. 빈 파일이거나 Windows 폴더 권한 때문에 내용을 읽지 못한 것일 수 있습니다. ' + ERR_COPY);
      return item;
    }
    if (file.size > LIMITS[kind]) {
      item.status = 'block';
      item.problems.push(`파일이 너무 큽니다(${fmtSize(file.size)}, 한도 ${fmtSize(LIMITS[kind])}).`
        + (kind === 'dump' ? ' 전체·커널 메모리 덤프는 올릴 수 없습니다. 작은 메모리 덤프(Minidump 폴더의 파일)를 사용하세요.' : kind === 'evtx' ? ' 이벤트 뷰어에서 증상이 있었던 기간만 남겨 저장하세요.' : ''));
    }
    if (MIN_BYTES[kind] && file.size < MIN_BYTES[kind]) {
      item.status = 'block';
      item.problems.push(`파일이 너무 작아(${file.size}바이트) 정상적인 ${kind === 'dump' ? '덤프' : '이벤트 로그'}로 볼 수 없습니다. 저장 도중 끊겼을 수 있습니다.`);
    }
    let head = null;
    try {
      const buf = await file.slice(0, 4096).arrayBuffer();
      head = new Uint8Array(buf);
      item.readable = true;
    } catch (e) {
      item.readable = false;
      item.status = 'block';
      item.problems.push('파일을 읽지 못했습니다. Windows 폴더 권한 때문일 수 있습니다. ' + ERR_COPY);
      return item;
    }
    if (kind === 'dump') {
      const sig8 = ascii(head, 0, 8);
      if (ascii(head, 0, 4) === 'MDMP') {
        item.typeLabel = '미니덤프(MDMP)';
      } else if (sig8 === 'PAGEDU64') {
        let t = null;
        if (head.length >= 0xF9C) t = new DataView(head.buffer, head.byteOffset, head.byteLength).getUint32(0xF98, true);
        item.typeLabel = (KERNEL_DUMP_TYPES[t] || '커널 덤프(PAGEDU64)') + ' 형식';
        item.notes.push('헤더의 STOP 코드·매개변수와 드라이버 이름만 읽습니다. 원인 드라이버를 특정하지는 못합니다.');
        if (t === 1 || t === 5) item.notes.push('전체 메모리 덤프는 보통 수 GB라 서버 한도(64 MB)를 넘을 수 있습니다.');
      } else if (sig8 === 'PAGEDUMP') {
        item.typeLabel = '32비트 커널 덤프(PAGEDUMP)';
        item.status = 'block';
        item.problems.push('이 형식은 지원하지 않습니다. 64비트 Windows의 미니덤프를 올려 주세요.');
      } else {
        item.typeLabel = '형식 확인 실패';
        item.status = 'block';
        item.problems.push('덤프 파일 머리 부분이 올바르지 않습니다. 파일이 손상됐거나 저장 도중 끊겼을 수 있습니다.');
      }
    } else if (kind === 'evtx') {
      if (ascii(head, 0, 7) === 'ElfFile') {
        item.typeLabel = '이벤트 로그(EVTX)';
        if (/^system\.evtx$/i.test(name)) item.notes.push('시스템 로그입니다.');
      } else {
        item.typeLabel = '형식 확인 실패';
        item.status = 'block';
        item.problems.push('이벤트 로그(.evtx) 파일이 아니거나 손상됐습니다.');
      }
    } else if (kind === 'json') {
      item.typeLabel = 'JSON';
      if (item.status !== 'block') {
        try {
          const text = typeof file.text === 'function' ? await file.text() : '';
          const parsed = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            item.status = 'block';
            item.problems.push('hardware.json 형식이 아닙니다(객체가 아닌 JSON).');
          } else {
            item.typeLabel = '하드웨어 정보(JSON)';
          }
        } catch (e) {
          item.status = 'block';
          item.problems.push('JSON 형식이 올바르지 않습니다. 수집 스크립트가 만든 hardware.json을 그대로 올려 주세요.');
        }
      }
    }
    return item;
  }

  /** 검사한 파일 목록에서 분석에 쓸 파일과 안내를 정리한다. */
  function summarizeChecks(items) {
    const ok = (k) => items.filter((i) => i.kind === k && i.status !== 'block');
    const dumps = ok('dump');
    const evtx = ok('evtx');
    const json = ok('json');
    const blocked = items.filter((i) => i.status === 'block');
    const notes = [];
    const checks = [];
    const add = (id, label, state, text) => checks.push({ id, label, state, text });

    const sys = evtx.filter((i) => /^system\.evtx$/i.test(i.name));
    if (!evtx.length) add('evtx', '이벤트 로그(System.evtx)', 'warn', '없습니다. 덤프 전후에 어떤 기록이 있었는지 연결하려면 System.evtx를 함께 올려 주세요.');
    else if (!sys.length) add('evtx', '이벤트 로그(System.evtx)', 'warn', `이름이 System.evtx가 아닌 파일(${esc(evtx[0].name)})입니다. 시스템 로그가 맞는지 확인하세요.`);
    else add('evtx', '이벤트 로그(System.evtx)', 'ok', '있습니다.');
    if (evtx.length > 1) notes.push('이벤트 로그는 첫 번째 파일만 분석합니다.');

    if (!dumps.length) add('dump', '덤프(.dmp)', 'warn', '없습니다. Minidump 폴더가 비어 있으면 이벤트 로그만으로도 분석할 수 있습니다.');
    else add('dump', '덤프(.dmp)', 'ok', `${dumps.length}개${dumps.length > MAX_DUMPS ? ` (최대 ${MAX_DUMPS}개만 분석)` : ''}`);
    if (dumps.length > MAX_DUMPS) notes.push(`덤프는 최대 ${MAX_DUMPS}개만 분석합니다.`);

    if (!json.length) add('json', '하드웨어 정보(hardware.json)', 'warn', '없습니다. 있으면 그래픽카드 링크·디스크 상태까지 함께 판단합니다.');
    else add('json', '하드웨어 정보(hardware.json)', 'ok', 'JSON 형식이 올바릅니다.');

    const zero = items.filter((i) => i.kind && i.size === 0);
    add('zero', '0바이트 파일', zero.length ? 'bad' : 'ok', zero.length ? `${zero.map((i) => esc(i.name)).join(', ')} — 분석에서 제외합니다.` : '없습니다.');
    const unreadable = items.filter((i) => i.readable === false && i.size !== 0);
    if (unreadable.length) add('read', '읽기 가능 여부', 'bad', `${unreadable.map((i) => esc(i.name)).join(', ')}을(를) 읽지 못했습니다.`);

    return {
      accepted: [...dumps.slice(0, MAX_DUMPS), ...evtx.slice(0, 1), ...json.slice(0, 1)].map((i) => i.file),
      dumpCount: dumps.length, evtxCount: evtx.length, jsonCount: json.length, blockedCount: blocked.length,
      canAnalyze: dumps.length + evtx.length + json.length > 0, checks, notes,
      missing: checks.filter((c) => c.state === 'warn').map((c) => c.label),
    };
  }

  const STATE_ICON = { ok: '✓', warn: '△', bad: '✕' };

  function renderPrecheck(items, summary) {
    if (!items.length) return '';
    const rows = items.map((i) => {
      const cls = i.status === 'block' ? 'bad' : i.status === 'skip' ? 'skip' : 'ok';
      const msg = [...i.problems, ...i.notes].map((t) => `<span class="pc-msg">${esc(t)}</span>`).join('');
      return `<tr class="pc-${cls}"><td>${esc(i.name)}${i.path ? `<br><small class="muted">${esc(i.path)}</small>` : ''}</td>`
        + `<td>${esc(i.sizeText)}</td><td>${esc(i.ext ? '.' + i.ext : '—')}</td><td>${esc(i.typeLabel || '—')}</td>`
        + `<td>${i.modified ? esc(fmtTime(i.modified)) : '—'}</td>`
        + `<td>${i.readable === true ? '가능' : i.readable === false ? '불가' : '—'}</td>`
        + `<td>${cls === 'bad' ? '<b>제외</b>' : cls === 'skip' ? '건너뜀' : '분석'}${msg}</td></tr>`;
    }).join('');
    const checks = summary.checks.map((c) => `<li class="pc-chk ${c.state}"><b>${STATE_ICON[c.state] || ''} ${esc(c.label)}</b> — ${c.text}</li>`).join('');
    const notes = summary.notes.map((t) => `<li>${esc(t)}</li>`).join('');
    return `<div class="pc-wrap" aria-live="polite">
      <p class="vd-eyebrow">업로드 전 검사</p>
      <ul class="pc-checks">${checks}</ul>
      ${notes ? `<ul class="pc-notes">${notes}</ul>` : ''}
      <div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>파일</th><th>크기</th><th>확장자</th><th>형식</th><th>수정일</th><th>읽기</th><th>처리</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="vd-note">브라우저는 파일 생성일을 알려 주지 않아 수정일을 표시합니다. 덤프 발생 기간과 이벤트 로그 기간의 겹침은 분석 후 결과 화면에서 확인합니다.</p>
    </div>`;
  }

  // ── 분석 후: 덤프 발생 기간 vs 이벤트 로그 기간 ─────────────────────────
  function coverageCheck(dumpTimes, evtxRange) {
    const times = (dumpTimes || []).map((t) => new Date(t)).filter((d) => !Number.isNaN(d.getTime()));
    const start = evtxRange && evtxRange.start ? new Date(evtxRange.start) : null;
    const end = evtxRange && evtxRange.end ? new Date(evtxRange.end) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { state: 'unknown', text: '이벤트 로그 기간을 확인하지 못했습니다.' };
    if (!times.length) return { state: 'unknown', text: '발생 시각이 확인되는 덤프가 없어 기간 겹침을 확인하지 못했습니다.' };
    const slack = 5 * 60 * 1000;
    const inside = times.filter((t) => t.getTime() >= start.getTime() - slack && t.getTime() <= end.getTime() + slack).length;
    const range = `${fmtTime(start.toISOString())} ~ ${fmtTime(end.toISOString())}`;
    if (inside === times.length) return { state: 'ok', text: `덤프 ${times.length}개가 모두 이벤트 로그 기간(${range}) 안에 있습니다.` };
    if (inside === 0) return { state: 'bad', text: `덤프 ${times.length}개가 모두 이벤트 로그 기간(${range}) 밖입니다. 덤프 전후 기록을 연결하지 못합니다. 증상이 있었던 날의 로그를 다시 내보내세요.` };
    return { state: 'warn', text: `덤프 ${times.length}개 중 ${inside}개만 이벤트 로그 기간(${range}) 안에 있습니다.` };
  }

  function renderCoverage(c, fileChecks) {
    const parts = (fileChecks || []).map((x) => `<li class="pc-chk ${x.state}"><b>${STATE_ICON[x.state] || ''} ${esc(x.label)}</b> — ${x.text}</li>`).join('');
    return `<section class="in-card"><h3>자료 점검</h3><ul class="pc-checks">${parts}<li class="pc-chk ${c.state === 'unknown' ? 'warn' : c.state}"><b>${STATE_ICON[c.state === 'unknown' ? 'warn' : c.state] || ''} 덤프 발생 기간 ↔ 이벤트 로그 기간</b> — ${esc(c.text)}</li></ul></section>`;
  }

  // ── 결과 렌더링 ────────────────────────────────────────────────────────
  const RISK_CLASS = { '낮음': 'low', '주의': 'warn', '전문가 권장': 'high' };

  function renderSummaryCard(v) {
    if (!v || !v.summaryCard) return '';
    const s = v.summaryCard;
    const risk = s.risk || {};
    const warnings = (s.warnings || []).map((w) => `<li>${esc(w)}</li>`).join('');
    return `<section class="in-summary risk-${RISK_CLASS[risk.label] || 'low'}" aria-label="한눈에 보는 결과">
      <p class="vd-eyebrow">한눈에 보기</p>
      <p class="in-conclusion">${esc(s.conclusion)}</p>
      <div class="in-chips">
        <span class="in-chip risk">위험도: ${esc(risk.label)}</span>
        <span class="in-chip">원격 점검: ${esc((s.remote || {}).label)}</span>
        ${s.confidence ? `<span class="in-chip">근거 일치도: ${esc(s.confidence)}</span>` : ''}
      </div>
      <ol class="in-todo">
        <li><b>지금 할 일 1단계</b><span>${esc(s.step1)}</span></li>
        ${s.step2 ? `<li><b>지금 할 일 2단계</b><span>${esc(s.step2)}</span></li>` : ''}
      </ol>
      <p class="in-repeat"><b>계속 발생하면</b> ${esc(s.ifRepeats)}</p>
      <p class="in-risk-text">${esc(risk.text)} ${esc((s.remote || {}).text)}</p>
      ${warnings ? `<ul class="in-warn">${warnings}</ul>` : ''}
      <p class="vd-note">아래 내용은 올린 파일에서 규칙으로 계산한 결과입니다(AI와 무관). 덤프와 로그만으로 부품 고장을 확정할 수 없습니다.</p>
    </section>`;
  }

  const LIKE_CLASS = { '높음': 'hi', '중간': 'mid', '낮음': '' };

  function renderCandidates(v) {
    const list = v.candidates || [];
    if (!list.length) return '';
    const ul = (arr) => (arr && arr.length ? `<ul class="vd-list">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="vd-note">해당 없음</p>');
    const cards = list.map((c, idx) => `
      <details class="cand-card" ${idx === 0 ? 'open' : ''}>
        <summary><span class="vd-likelihood ${LIKE_CLASS[c.likelihood] || ''}">${esc(c.likelihood)}</span>
          <b>${esc(c.title)}</b><span class="cand-share">${esc(c.sharePercent)}%</span></summary>
        <div class="cand-body">
          <h5>판단 근거</h5>${ul(c.reasons)}
          <h5>반대 근거·불확실성</h5>${ul(c.counterEvidence)}
          <h5>다음 확인 방법</h5>${ul(c.nextChecks)}
          <div class="cand-grid">
            <div><b>원격 점검: ${esc((c.remote || {}).label)}</b><p>${esc((c.remote || {}).text)}</p></div>
            <div><b>방문 점검: ${esc((c.visit || {}).label)}</b><p>${esc((c.visit || {}).text)}</p></div>
          </div>
          <p class="in-cross">${esc(c.crossTestWarning)}</p>
        </div>
      </details>`).join('');
    return `<section class="in-card"><h3>원인 후보 (5가지 범주)</h3>
      <p class="vd-note" style="margin-top:0">후보는 가능성 순입니다. '원인 드라이버'로 보이는 모듈도 오류가 감지된 위치일 뿐 확정이 아닙니다.</p>${cards}</section>`;
  }

  const CTA_LINK = {
    remote: ['#remote-card', '아래 원격 점검 신청으로 이동'],
    crosscheck: ['#remote-card', '교차 점검 상담을 원격 점검 신청으로 접수'],
    visit: ['remote-support.html', '방문 점검 안내 보기'],
    backup: ['backup-storage-calculator.html', '백업 저장공간 계산기 보기'],
  };

  function renderCta(v) {
    const cta = v.cta;
    if (!cta || !cta.primary) return '';
    const one = (it, primary) => {
      const link = CTA_LINK[it.type];
      return `<div class="cta-item ${primary ? 'primary' : ''}"><b>${esc(it.title)}</b><p>${esc(it.text)}</p>`
        + (link ? `<a class="btn ${primary ? 'primary' : 'secondary'}" href="${esc(link[0])}">${esc(link[1])}</a>` : '') + '</div>';
    };
    return `<section class="in-card cta-box"><h3>이 결과에 맞는 다음 단계</h3>${one(cta.primary, true)}${(cta.also || []).map((x) => one(x, false)).join('')}</section>`;
  }

  function renderMismatch(v) {
    const m = v.symptomMismatch || [];
    if (!m.length) return '';
    return `<section class="in-notice" role="note"><b>문진과 로그가 다릅니다</b><ul>${m.map((x) => `<li>${esc(x.message)}</li>`).join('')}</ul></section>`;
  }

  const GROUP_LABEL = { dump: '덤프', whea: 'WHEA', power: '전원', storage: '디스크', display: '디스플레이', volume: '볼륨', service: '서비스', wer: '오류 보고', log: '로그' };

  function renderCorrelation(v) {
    const c = v.eventCorrelation;
    if (!c) return '';
    const items = (c.items || []).map((i) => `<li class="${i.linked ? 'linked' : ''}"><span class="muted">${esc(fmtTime(i.time))}${i.fileName ? ' · ' + esc(i.fileName) : ''}</span><br>${esc(i.text)}</li>`).join('');
    return `<section class="in-card"><h3>덤프 전후 이벤트 연결</h3><p class="vd-note" style="margin-top:0">${esc(c.summary)}</p>${items ? `<ul class="corr-list">${items}</ul>` : ''}</section>`;
  }

  function renderTimeline(v) {
    const t = v.timelineFull || [];
    if (!t.length) return '';
    const rows = t.map((e) => `<li class="tl-${esc(e.kind)}"><span class="tl-time">${esc(fmtTime(e.time))}</span><span class="tl-tag">${esc(GROUP_LABEL[e.group] || e.group || '')}</span><span class="tl-label">${esc(e.label)}</span></li>`).join('');
    return `<section class="in-card"><h3>시간순 타임라인</h3><ol class="tl-list">${rows}</ol></section>`;
  }

  function renderModuleReliability(v) {
    const r = v.moduleReliability;
    if (!r || !r.total) return '';
    if (!r.items.length) {
      return `<section class="in-card"><h3>반복 모듈</h3><p class="vd-note" style="margin-top:0">덤프 ${esc(r.total)}개에서 확인된 외부 드라이버 모듈이 없습니다. 커널(ntoskrnl)은 오류를 보고한 위치일 뿐 원인으로 보지 않습니다.</p></section>`;
    }
    const rows = r.items.map((m) => `<tr><td><code>${esc(m.module)}</code>${m.candidate ? ' <small class="muted">(후보)</small>' : ''}</td>`
      + `<td>${esc(m.total)}</td><td>${esc(m.count)} (${esc(m.sharePercent)}%)</td><td>${esc(fmtTime(m.firstSeen))}</td><td>${esc(fmtTime(m.lastSeen))}</td>`
      + `<td><span class="vd-likelihood ${LIKE_CLASS[m.confidence] || ''}">${esc(m.confidence)}</span></td></tr>`).join('');
    return `<section class="in-card"><h3>반복 모듈 신뢰도</h3>
      <div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>모듈</th><th>전체 덤프</th><th>반복</th><th>최초 발생</th><th>마지막 발생</th><th>신뢰도</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="in-cross">${esc(r.caution)}</p></section>`;
  }

  /** 규칙 기반 분석 영역(요약 카드 아래) 전체. 서버가 새 필드를 주지 않으면 빈 문자열이다. */
  function renderRuleAnalysis(v) {
    if (!v) return '';
    return [renderMismatch(v), renderCandidates(v), renderCta(v), renderCorrelation(v), renderTimeline(v), renderModuleReliability(v)].join('');
  }

  const api = {
    LIMITS, esc, fmtSize, inspectFile, summarizeChecks, renderPrecheck, coverageCheck, renderCoverage,
    renderSummaryCard, renderRuleAnalysis, renderCandidates, renderCta, renderMismatch, renderCorrelation, renderTimeline, renderModuleReliability,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ITSVC_Insights = api;
}(typeof window !== 'undefined' ? window : globalThis));
