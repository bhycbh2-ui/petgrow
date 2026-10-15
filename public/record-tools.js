(() => {
  const dayNumber = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const timestamp = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp / 86400000 : NaN;
  };
  const localToday = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  };
  const today = localToday();
  document.querySelector('[name="currentDate"]').value = today;
  document.querySelector('[name="memoDate"]').value = today;
  const weightForm = document.getElementById('weight-form');
  const weightResult = document.getElementById('weight-result');
  const weightError = document.getElementById('weight-error');
  weightForm.addEventListener('input', () => { weightResult.hidden = true; weightError.textContent = ''; });
  weightForm.addEventListener('submit', event => {
    event.preventDefault();
    weightResult.hidden = true;
    weightError.textContent = '';
    if (!weightForm.reportValidity()) return;
    const data = new FormData(weightForm);
    const previous = Number(data.get('previousWeight')), current = Number(data.get('currentWeight'));
    const first = dayNumber(String(data.get('previousDate'))), last = dayNumber(String(data.get('currentDate')));
    if (![previous, current, first, last].every(Number.isFinite) || previous <= 0 || current <= 0) {
      weightError.textContent = '유효한 날짜와 0보다 큰 체중을 입력해 주세요.'; return;
    }
    if (last < first) { weightError.textContent = '최근 측정일은 이전 측정일보다 빠를 수 없어요.'; return; }
    if (last > dayNumber(today)) { weightError.textContent = '실제 측정한 오늘 또는 과거 날짜를 입력해 주세요.'; return; }
    const difference = current - previous, percentage = difference / previous * 100;
    if (!Number.isFinite(difference) || !Number.isFinite(percentage)) { weightError.textContent = '입력한 숫자가 너무 커서 비교할 수 없어요. 체중을 다시 확인해 주세요.'; return; }
    const signed = value => `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toLocaleString('ko-KR', { maximumFractionDigits: 3 })}`;
    const percent = `${percentage < 0 ? '−' : percentage > 0 ? '+' : ''}${Math.abs(percentage).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
    weightResult.textContent = `${last - first}일 사이 ${previous}kg → ${current}kg · 차이 ${signed(difference)}kg · 이전 대비 ${percent}. ${last === first ? '같은 날의 재측정 비교입니다.' : '측정 조건이 같은지 함께 확인하세요.'} 건강 상태를 판정하는 결과가 아닙니다.`;
    weightResult.hidden = false;
  });
  const memoForm = document.getElementById('memo-form');
  const memoResult = document.getElementById('memo-result');
  const preview = document.getElementById('memo-preview');
  const status = document.getElementById('memo-status');
  memoForm.addEventListener('input', () => { memoResult.hidden = true; status.textContent = ''; });
  memoForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!memoForm.reportValidity()) return;
    const data = new FormData(memoForm);
    const read = (key, fallback = '미기재') => String(data.get(key) || '').trim() || fallback;
    preview.value = [ 'PetGrow 상담 준비 메모', `반려동물: ${read('petName', '우리 아이')}`, `작성일: ${read('memoDate')}`, '', '[직접 관찰한 사실]', read('observation'), '', '[시작 시점·횟수·지속 시간]', read('timing'), '', '[최근 바뀐 환경·식사·사용 제품]', read('changes'), '', '[수의사에게 물어볼 질문]', read('questions'), '', '보호자가 입력한 기록입니다. 진단 또는 치료 안내가 아닙니다.' ].join('\n');
    status.textContent = '메모를 만들었어요. 내려받거나 인쇄해 보관하세요.';
    memoResult.hidden = false;
  });
  document.getElementById('download-memo').addEventListener('click', () => {
    if (!preview.value) return;
    const url = URL.createObjectURL(new Blob(['\ufeff', preview.value], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `petgrow-consultation-${today}.txt`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '메모 파일 내려받기를 요청했어요. 기기의 다운로드 위치를 확인해 주세요.';
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('pg-printing-memo'));
  document.getElementById('print-memo').addEventListener('click', () => {
    const page = document.getElementById('memo-print');
    page.textContent = preview.value;
    document.body.classList.add('pg-printing-memo');
    try { window.print(); } catch { document.body.classList.remove('pg-printing-memo'); status.textContent = '이 브라우저에서는 인쇄를 열지 못했어요. 메모 파일 내려받기를 이용해 주세요.'; }
  });
})();
