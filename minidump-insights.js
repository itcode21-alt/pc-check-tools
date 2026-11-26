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

  // ── 결과 저장(PDF·텍스트)·카카오톡 상담용 요약 ───────────────────────────
  const REMOTE_POLICY = '기본 원격 점검은 30분 2만원입니다. 30분 안에 원인을 찾지 못하면 비용을 받지 않으며, 추가 작업은 사전 동의 후 진행합니다.';
  const KAKAO_URL = 'https://pf.kakao.com/_xgExbWX/chat';
  const REMOTE_CHOICES = { want: '희망', later: '상담 후 결정', unsure: '아직 모름' };

  function fmtKst(iso) {
    const d = new Date(iso);
    if (!iso || Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' KST';
  }

  const cut = (t, n) => { const x = String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; };
  const isBsod = (d) => d && d.dumpKind !== 'application';

  function dumpFacts(ctx) {
    const dumps = (ctx.results || []).map((r) => r.data).filter(Boolean);
    const bs = dumps.filter(isBsod);
    const codes = new Map();
    bs.forEach((d) => {
      if (!d.stopCode) return;
      const k = String(d.stopCode).toUpperCase().replace(/^0X/, '0x');
      const cur = codes.get(k) || { count: 0, name: d.stopCodeName || '' };
      cur.count += 1;
      codes.set(k, cur);
    });
    const times = bs.map((d) => d.crashTime).filter(Boolean).map((t) => new Date(t)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    return { all: dumps, bsod: bs, codes, latest: times.length ? times[times.length - 1].toISOString() : null };
  }

  function codeLines(f) {
    return [...f.codes.entries()].map(([k, v]) => `${k}${v.name ? ' ' + v.name : ''} ×${v.count}`);
  }

  function repeatedModules(ctx) {
    const r = ctx.verdict && ctx.verdict.moduleReliability;
    return r && r.items ? r.items.filter((m) => m.repeated) : [];
  }

  function eventEvidence(ctx, max) {
    const out = [];
    const c = ctx.verdict && ctx.verdict.eventCorrelation;
    const seen = new Set();
    ((c && c.items) || []).filter((i) => i.linked).forEach((i) => {
      const t = cut(i.text, 200);
      if (!seen.has(t) && seen.size < 2) { seen.add(t); out.push(t); }   // 같은 연결이 덤프마다 반복돼도 한 번만 적는다
    });
    const ev = ctx.evtx;
    if (ev && ev.wheaById) {
      Object.entries(ev.wheaById).slice(0, 3).forEach(([id, n]) => out.push(`WHEA-Logger ${id} ${Number(n).toLocaleString('ko-KR')}건`));
    }
    return out.slice(0, max || 4);
  }

  function symptomText(ctx) {
    const sym = ctx.symptoms;
    if (!sym || !(sym.types || []).length) return '';
    const labels = (sym.types || []).map((t) => (ctx.symptomLabels || {})[t]).filter(Boolean);
    return labels.join(', ') + (sym.perDay ? ` (하루 약 ${sym.perDay}회)` : '');
  }

  /** 카카오톡에 붙여 넣는 상담용 요약. 이름·연락처 같은 개인정보는 넣지 않는다. */
  function buildKakaoSummary(ctx) {
    const f = dumpFacts(ctx);
    const ss = (ctx.evtx && ctx.evtx.shutdownSummary) || {};
    const counts = [];
    if (f.bsod.length) counts.push(`블루스크린 덤프 ${f.bsod.length}개`);
    if (ss.count) counts.push(`이벤트 로그의 예기치 않은 종료 ${ss.count}회`);
    const mods = repeatedModules(ctx).map((m) => `${m.module} (덤프 ${m.total}개 중 ${m.count}개 · 신뢰도 ${m.confidence} · 원인 확정 아님)`);
    const ev = eventEvidence(ctx, 4);
    const lines = [
      '[PC 블루스크린 분석 요청]',
      '',
      `발생 증상: ${symptomText(ctx) || '(문진 미입력)'}`,
      `발생 횟수: ${counts.length ? counts.join(', ') : '확인된 덤프·종료 기록 없음'}`,
      `최근 발생 시각: ${f.latest ? fmtKst(f.latest) : '확인 안 됨'}`,
      `STOP 코드: ${codeLines(f).join(', ') || '확인 안 됨'}`,
      `반복 의심 모듈: ${mods.join(', ') || '반복된 모듈 없음'}`,
      `WHEA/이벤트 근거: ${ev.length ? ev.join(' / ') : '이벤트 로그 근거 없음'}`,
      `사용자가 해본 조치: ${cut(ctx.userActions, 300) || '(입력 없음)'}`,
      `원격 점검 희망 여부: ${REMOTE_CHOICES[ctx.remoteChoice] || REMOTE_CHOICES.later}`,
      `분석 ID: ${ctx.analysisId || '(발급 안 됨)'}`,
    ];
    return lines.join('\n');
  }

  function fileListLines(ctx) {
    return (ctx.files || []).map((x) => `  - ${x.name} (${x.sizeText || ''}${x.typeLabel ? ', ' + x.typeLabel : ''})`);
  }

  function candidateTextLines(v) {
    const out = [];
    (v.candidates || []).forEach((c) => {
      out.push(`- [${c.likelihood}] ${c.title} (${c.sharePercent}%)`);
      (c.reasons || []).forEach((t) => out.push(`  · 판단 근거: ${t}`));
      (c.counterEvidence || []).forEach((t) => out.push(`  · 반대 근거·불확실성: ${t}`));
      (c.nextChecks || []).forEach((t) => out.push(`  · 다음 확인: ${t}`));
      out.push(`  · 원격 점검: ${(c.remote || {}).label} / 방문 점검: ${(c.visit || {}).label}`);
    });
    return out;
  }

  function moduleTextLines(v) {
    const r = v.moduleReliability;
    if (!r || !r.items || !r.items.length) return ['- 외부 드라이버 모듈이 확인되지 않았거나 반복되지 않았습니다.'];
    const out = r.items.map((m) => `- ${m.module}: 전체 덤프 ${m.total}개 중 ${m.count}개 · 최초 ${fmtKst(m.firstSeen) || '—'} · 마지막 ${fmtKst(m.lastSeen) || '—'} · 신뢰도 ${m.confidence}`);
    out.push(`  ※ ${r.caution}`);
    return out;
  }

  /** 텍스트 저장에 들어갈 새 구역. head: 맨 위, top: 종합 판단 앞, bottom: 맨 끝 안내 앞. */
  function exportTextSections(ctx) {
    const v = ctx.verdict || {};
    const head = [
      '[덤프·이벤트 로그 분석] 진단 결과',
      `분석 ID: ${ctx.analysisId || '(발급 안 됨)'}`,
      `생성 시각: ${ctx.now ? ctx.now.toLocaleString('ko-KR') : ''}`,
      `분석한 덤프: ${(ctx.results || []).length}개${ctx.evtx ? ' · 이벤트 로그 1개' : ''}`,
      `업로드 파일 (${(ctx.files || []).length}개):`, ...(fileListLines(ctx).length ? fileListLines(ctx) : ['  (목록 없음)']), '',
    ];
    const top = [];
    if (v.summaryCard) {
      const s = v.summaryCard;
      top.push('◆ 한눈에 보기 (규칙 기반 분석)', `- 결론: ${s.conclusion}`, `- 위험도: ${(s.risk || {}).label} / 원격 점검: ${(s.remote || {}).label}`,
        `- 지금 할 일 1단계: ${s.step1}`, ...(s.step2 ? [`- 지금 할 일 2단계: ${s.step2}`] : []), `- 계속 발생하면: ${s.ifRepeats}`, '');
    }
    if ((v.candidates || []).length) top.push('◆ 원인 후보 (5가지 범주, 규칙 기반)', ...candidateTextLines(v), `  ※ ${v.crossTestWarning || ''}`, '');
    if (v.moduleReliability && v.moduleReliability.total) top.push('◆ 반복 의심 모듈 (원인 확정 아님)', ...moduleTextLines(v), '');
    const ev = eventEvidence(ctx, 6);
    const corr = (v.eventCorrelation && v.eventCorrelation.items) || [];
    if (ev.length || corr.length) {
      top.push('◆ 주요 이벤트 근거');
      corr.forEach((i) => top.push(`- ${fmtKst(i.time)}: ${i.text}`));
      if (!corr.length) ev.forEach((t) => top.push(`- ${t}`));
      top.push('');
    }
    const bottom = [];
    if (ctx.ai && ctx.ai.summary) {
      const a = ctx.ai.summary;
      bottom.push(`◆ AI 쉬운 설명 (참고용 · 위 규칙 기반 분석과 별개${ctx.ai.fallback ? ' · 자동 요약 미완료' : ''})`, `- 원인: ${a.cause}`,
        ...(a.selfCheck || []).map((t, i) => `- 안전한 조치 ${i + 1}: ${t}`), `- ${a.remoteInspection}`, `  ${a.disclaimer}`, '');
    } else {
      bottom.push('◆ AI 쉬운 설명', '- 요청하지 않았습니다(결과 화면의 ‘AI 쉬운 요약 보기’ 버튼으로 요청할 수 있습니다).', '');
    }
    bottom.push('◆ 원격 점검 신청 안내', `- ${REMOTE_POLICY}`, '- 결과 화면 하단의 신청 폼 또는 카카오톡 채널로 상담할 수 있습니다.', `  ${KAKAO_URL}`, '');
    return { head, top, bottom };
  }

  /** 인쇄·PDF 보고서에 들어갈 새 구역(HTML). */
  function exportHtmlSections(ctx) {
    const v = ctx.verdict || {};
    const li = (arr) => arr.map((t) => `<li>${esc(t)}</li>`).join('');
    const files = (ctx.files || []).map((x) => `<li>${esc(x.name)} <span class="rp-meta">(${esc(x.sizeText || '')}${x.typeLabel ? ', ' + esc(x.typeLabel) : ''})</span></li>`).join('');
    const head = `<p class="rp-meta">분석 ID: <strong>${esc(ctx.analysisId || '(발급 안 됨)')}</strong> · 생성 시각 ${esc(ctx.now ? ctx.now.toLocaleString('ko-KR') : '')}</p>`
      + `<h2>업로드 파일</h2>${files ? `<ul>${files}</ul>` : '<p>(목록 없음)</p>'}`;
    let top = '';
    if (v.summaryCard) {
      const s = v.summaryCard;
      top += `<h2>한눈에 보기 <span class="rp-meta">(규칙 기반 분석)</span></h2><p class="rp-headline">${esc(s.conclusion)}</p>`
        + `<p>위험도: <strong>${esc((s.risk || {}).label)}</strong> · 원격 점검: ${esc((s.remote || {}).label)}</p>`
        + `<ol><li>${esc(s.step1)}</li>${s.step2 ? `<li>${esc(s.step2)}</li>` : ''}</ol><p><strong>계속 발생하면</strong> ${esc(s.ifRepeats)}</p>`;
    }
    if ((v.candidates || []).length) {
      top += '<h2>원인 후보 (5가지 범주)</h2>' + v.candidates.map((c) => `<h3>[${esc(c.likelihood)}] ${esc(c.title)} (${esc(c.sharePercent)}%)</h3>`
        + `<p><strong>판단 근거</strong></p><ul>${li(c.reasons || [])}</ul><p><strong>반대 근거·불확실성</strong></p><ul>${li(c.counterEvidence || [])}</ul>`
        + `<p><strong>다음 확인 방법</strong></p><ul>${li(c.nextChecks || [])}</ul>`
        + `<p>원격 점검: ${esc((c.remote || {}).label)} · 방문 점검: ${esc((c.visit || {}).label)}</p>`).join('')
        + `<p class="rp-foot">${esc(v.crossTestWarning || '')}</p>`;
    }
    if (v.moduleReliability && v.moduleReliability.items && v.moduleReliability.items.length) {
      const rows = v.moduleReliability.items.map((m) => `<tr><td>${esc(m.module)}</td><td>${esc(m.total)}</td><td>${esc(m.count)}</td><td>${esc(fmtKst(m.firstSeen) || '—')}</td><td>${esc(fmtKst(m.lastSeen) || '—')}</td><td>${esc(m.confidence)}</td></tr>`).join('');
      top += `<h2>반복 의심 모듈 <span class="rp-meta">(원인 확정 아님)</span></h2><table class="rp-table"><thead><tr><th>모듈</th><th>전체 덤프</th><th>반복</th><th>최초</th><th>마지막</th><th>신뢰도</th></tr></thead><tbody>${rows}</tbody></table><p class="rp-foot">${esc(v.moduleReliability.caution)}</p>`;
    }
    const corr = (v.eventCorrelation && v.eventCorrelation.items) || [];
    const ev = eventEvidence(ctx, 6);
    if (corr.length || ev.length) top += `<h2>주요 이벤트 근거</h2><ul>${corr.length ? corr.map((i) => `<li>${esc(fmtKst(i.time))}: ${esc(i.text)}</li>`).join('') : li(ev)}</ul>`;
    let bottom = '';
    if (ctx.ai && ctx.ai.summary) {
      const a = ctx.ai.summary;
      bottom += `<h2>AI 쉬운 설명 <span class="rp-meta">(참고용 · 규칙 기반 분석과 별개${ctx.ai.fallback ? ' · 자동 요약 미완료' : ''})</span></h2><p>${esc(a.cause)}</p><ol>${li(a.selfCheck || [])}</ol><p>${esc(a.remoteInspection)}</p><p class="rp-foot">${esc(a.disclaimer)}</p>`;
    } else {
      bottom += '<h2>AI 쉬운 설명</h2><p>요청하지 않았습니다.</p>';
    }
    bottom += `<h2>원격 점검 신청 안내</h2><p>${esc(REMOTE_POLICY)}</p><p>결과 화면 하단의 신청 폼 또는 카카오톡 채널(${esc(KAKAO_URL)})로 상담할 수 있습니다.</p>`;
    return { head, top, bottom };
  }

  const api = {
    LIMITS, esc, fmtSize, inspectFile, summarizeChecks, renderPrecheck, coverageCheck, renderCoverage,
    REMOTE_POLICY, KAKAO_URL, REMOTE_CHOICES, fmtKst, buildKakaoSummary, exportTextSections, exportHtmlSections,
    renderSummaryCard, renderRuleAnalysis, renderCandidates, renderCta, renderMismatch, renderCorrelation, renderTimeline, renderModuleReliability,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ITSVC_Insights = api;
}(typeof window !== 'undefined' ? window : globalThis));
