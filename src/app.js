/**
 * 台灣汽車筆試題庫 2026 最新版 - 主應用程式 (Vite Single Page Application)
 */

import questionsData from './data/questions.json';

// State Object
const state = {
  questions: questionsData || [],
  currentView: 'dashboard',
  
  // User Storage
  bookmarks: new Set(JSON.parse(localStorage.getItem('tw_driver_exam_bookmarks') || '[]')),
  wrongAnswers: JSON.parse(localStorage.getItem('tw_driver_exam_wrong') || '{}'),
  userAnswers: JSON.parse(localStorage.getItem('tw_driver_exam_answers') || '{}'),
  examHistory: JSON.parse(localStorage.getItem('tw_driver_exam_history') || '[]'),
  theme: localStorage.getItem('tw_driver_exam_theme') || 'dark',

  // Active Quiz State
  activeExam: null, // { questions, userAnswers, timeRemaining, timerInterval, isSubmitted, score }
  activePractice: {
    sectionFilter: 'ALL',
    categoryFilter: 'ALL',
    currentIndex: 0,
    showAnswerMap: {}
  },
  
  // Search State
  searchKeyword: '',
  searchFilter: 'ALL' // 'ALL' | 'IMAGE' | 'WRONG' | 'BOOKMARK'
};

// DOM Elements
const mainContainer = document.getElementById('main-container');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const badgeWrongCount = document.getElementById('badge-wrong-count');

// Helper to resolve image paths for subpath hosting (GitHub Pages)
function getImageUrl(imgPath) {
  if (!imgPath) return '';
  if (imgPath.startsWith('http') || imgPath.startsWith('./')) return imgPath;
  return `./${imgPath}`;
}

// Initialize App
function init() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', state.theme);
  
  // Setup navbar listeners
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) switchView(view);
    });
  });

  document.getElementById('nav-brand').addEventListener('click', () => switchView('dashboard'));
  btnThemeToggle.addEventListener('click', toggleTheme);

  updateBadges();
  switchView('dashboard');
}

// Save LocalStorage
function saveStorage() {
  localStorage.setItem('tw_driver_exam_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
  localStorage.setItem('tw_driver_exam_wrong', JSON.stringify(state.wrongAnswers));
  localStorage.setItem('tw_driver_exam_answers', JSON.stringify(state.userAnswers));
  localStorage.setItem('tw_driver_exam_history', JSON.stringify(state.examHistory));
  updateBadges();
}

function updateBadges() {
  const wrongCount = Object.keys(state.wrongAnswers).length;
  if (badgeWrongCount) {
    badgeWrongCount.textContent = wrongCount;
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('tw_driver_exam_theme', state.theme);
}

// Switch Active View
function switchView(viewName) {
  state.currentView = viewName;
  
  // Update Navbar Active Button
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.view === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Render Target View
  if (viewName === 'dashboard') renderDashboard();
  else if (viewName === 'exam') renderExam();
  else if (viewName === 'practice') renderPractice();
  else if (viewName === 'notebook') renderNotebook();
  else if (viewName === 'search') renderSearch();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   1. DASHBOARD VIEW
   ========================================================================== */
function renderDashboard() {
  const totalCount = state.questions.length;
  const answeredCount = Object.keys(state.userAnswers).length;
  const wrongCount = Object.keys(state.wrongAnswers).length;
  const bestScore = state.examHistory.length > 0
    ? Math.max(...state.examHistory.map(h => h.score))
    : null;

  // Breakdown sections
  const sec1 = state.questions.filter(q => q.section.includes("架構一"));
  const sec2 = state.questions.filter(q => q.section.includes("架構二"));
  const sec3 = state.questions.filter(q => q.section.includes("架構三"));

  mainContainer.innerHTML = `
    <!-- Hero Banner -->
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h1>115年最新 汽車筆試題庫<br><span style="color: var(--accent-primary);">全方位模擬測驗系統</span></h1>
        <p class="hero-subtitle">收錄交通部公路局全數 1,090 題最新考題。含酒精測試罰則、行人停讓新制、內輪差與安全駕駛觀念。</p>
        <div class="hero-actions">
          <button class="btn-primary" id="btn-start-exam">
            <span>🚀</span> 開始 40 題全真模擬考
          </button>
          <button class="btn-secondary" id="btn-start-practice">
            <span>📖</span> 依架構分類刷題
          </button>
        </div>
      </div>

      <div class="stats-card-grid">
        <div class="stat-box">
          <div class="stat-num">${totalCount}</div>
          <div class="stat-label">題庫總題數</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">${answeredCount}</div>
          <div class="stat-label">已練習題數</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">${wrongCount}</div>
          <div class="stat-label">錯題本數量</div>
        </div>
        <div class="stat-box">
          <div class="stat-num" style="color: ${bestScore !== null && bestScore >= 85 ? 'var(--success-color)' : 'var(--accent-primary)'};">
            ${bestScore !== null ? bestScore + '分' : '無紀錄'}
          </div>
          <div class="stat-label">模擬考最佳成績</div>
        </div>
      </div>
    </div>

    <!-- Section Breakdown -->
    <h2 class="section-title">📂 三大考題架構分類</h2>
    <div class="sections-grid">
      <div class="category-card" data-sec="架構一">
        <div class="cat-header">
          <div class="cat-name">架構一：正確觀念與態度</div>
          <span class="cat-badge">${sec1.length} 題</span>
        </div>
        <p class="cat-desc">包含酒駕毒駕處罰、危險駕駛、平交道規定、強制險、環保駕駛與特殊天候應變知識。</p>
        <div class="cat-footer">
          <span>題號 1 ～ 424</span>
          <span style="color: var(--accent-primary);">開始練習 ➔</span>
        </div>
      </div>

      <div class="category-card" data-sec="架構二">
        <div class="cat-header">
          <div class="cat-name">架構二：主動停讓文化</div>
          <span class="cat-badge">${sec2.length} 題</span>
        </div>
        <p class="cat-desc">包含無號誌路口停讓、行人路權、兩段式開車門、大型車內輪差與視野死角防衛駕駛。</p>
        <div class="cat-footer">
          <span>題號 425 ～ 654</span>
          <span style="color: var(--accent-primary);">開始練習 ➔</span>
        </div>
      </div>

      <div class="category-card" data-sec="架構三">
        <div class="cat-header">
          <div class="cat-name">架構三：安全駕駛能力</div>
          <span class="cat-badge">${sec3.length} 題</span>
        </div>
        <p class="cat-desc">包含安全跟車距離、正確使用頭燈霧燈、貨物超載規定、國道二次事故預防與車輛機件檢查。</p>
        <div class="cat-footer">
          <span>題號 655 ～ 1090</span>
          <span style="color: var(--accent-primary);">開始練習 ➔</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-start-exam').addEventListener('click', () => startNewExam(40));
  document.getElementById('btn-start-practice').addEventListener('click', () => switchView('practice'));

  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const sec = card.dataset.sec;
      state.activePractice.sectionFilter = sec;
      switchView('practice');
    });
  });
}

/* ==========================================================================
   2. MOCK EXAM MODE
   ========================================================================== */
function startNewExam(questionCount = 40) {
  if (state.activeExam && state.activeExam.timerInterval) {
    clearInterval(state.activeExam.timerInterval);
  }

  const signQs = state.questions.filter(q => q.image !== null);
  const textQs = state.questions.filter(q => q.image === null);

  const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());
  
  const sampledSigns = shuffle(signQs).slice(0, 18);
  const sampledTexts = shuffle(textQs).slice(0, 22);
  const examQs = shuffle([...sampledSigns, ...sampledTexts]);

  state.activeExam = {
    questions: examQs,
    answers: {},
    currentIndex: 0,
    timeRemainingSec: 30 * 60,
    timerInterval: null,
    isSubmitted: false,
    score: 0
  };

  state.activeExam.timerInterval = setInterval(() => {
    if (state.activeExam.timeRemainingSec > 0) {
      state.activeExam.timeRemainingSec--;
      updateTimerDisplay();
    } else {
      clearInterval(state.activeExam.timerInterval);
      submitExam(true);
    }
  }, 1000);

  switchView('exam');
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('exam-timer');
  if (!timerEl || !state.activeExam) return;

  const mins = Math.floor(state.activeExam.timeRemainingSec / 60);
  const secs = state.activeExam.timeRemainingSec % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  timerEl.textContent = timeStr;

  if (state.activeExam.timeRemainingSec <= 300) {
    timerEl.classList.add('warning');
  }
}

function renderExam() {
  if (!state.activeExam) {
    startNewExam(40);
    return;
  }

  const exam = state.activeExam;

  if (exam.isSubmitted) {
    renderExamReport();
    return;
  }

  const curQ = exam.questions[exam.currentIndex];
  const total = exam.questions.length;
  const selectedOpt = exam.answers[curQ.id];
  const isBookmarked = state.bookmarks.has(curQ.id);

  mainContainer.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-header glass-card" style="padding: 16px 24px; margin-bottom: 20px;">
        <div style="font-weight: 700;">
          <span style="color: var(--accent-primary);">題目 ${exam.currentIndex + 1}</span> / ${total}
        </div>
        
        <div class="quiz-timer" id="exam-timer">30:00</div>

        <button class="btn-primary" id="btn-submit-exam" style="padding: 8px 18px; font-size: 0.9rem;">
          提前交卷
        </button>
      </div>

      <div class="glass-card question-card">
        <div class="q-meta">
          <span class="q-tag">第 ${curQ.id} 題 ｜ ${curQ.section}</span>
          <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" id="btn-toggle-bookmark" title="收藏題目">
            ${isBookmarked ? '★' : '☆'}
          </button>
        </div>

        ${curQ.image ? `
          <div class="q-image-container">
            <img src="${getImageUrl(curQ.image)}" alt="題示圖片" class="q-image" />
          </div>
        ` : ''}

        <div class="q-prompt">${curQ.prompt}</div>

        <div class="options-list">
          ${curQ.options.map((optText, idx) => {
            const optNum = idx + 1;
            const isSelected = selectedOpt === optNum;
            return `
              <div class="option-item ${isSelected ? 'selected' : ''}" data-opt="${optNum}">
                <div class="option-key">${optNum}</div>
                <div class="option-text">${optText}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="quiz-nav-footer">
          <button class="btn-nav-arrow" id="btn-prev-q" ${exam.currentIndex === 0 ? 'disabled' : ''}>
            ❮ 上一題
          </button>
          
          <button class="btn-nav-arrow" id="btn-next-q" ${exam.currentIndex === total - 1 ? 'disabled' : ''}>
            下一題 ❯
          </button>
        </div>
      </div>

      <div class="glass-card q-grid-drawer">
        ${exam.questions.map((q, idx) => {
          const isAns = exam.answers[q.id] !== undefined;
          const isCur = idx === exam.currentIndex;
          return `
            <button class="q-grid-btn ${isAns ? 'answered' : ''} ${isCur ? 'current' : ''}" data-idx="${idx}">
              ${idx + 1}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  updateTimerDisplay();

  document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', () => {
      const optNum = intVal(item.dataset.opt);
      exam.answers[curQ.id] = optNum;
      state.userAnswers[curQ.id] = optNum;
      saveStorage();
      renderExam();
    });
  });

  document.getElementById('btn-toggle-bookmark').addEventListener('click', () => {
    if (state.bookmarks.has(curQ.id)) state.bookmarks.delete(curQ.id);
    else state.bookmarks.add(curQ.id);
    saveStorage();
    renderExam();
  });

  document.getElementById('btn-prev-q').addEventListener('click', () => {
    if (exam.currentIndex > 0) {
      exam.currentIndex--;
      renderExam();
    }
  });

  document.getElementById('btn-next-q').addEventListener('click', () => {
    if (exam.currentIndex < total - 1) {
      exam.currentIndex++;
      renderExam();
    }
  });

  document.querySelectorAll('.q-grid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      exam.currentIndex = intVal(btn.dataset.idx);
      renderExam();
    });
  });

  document.getElementById('btn-submit-exam').addEventListener('click', () => {
    const answeredCount = Object.keys(exam.answers).length;
    const unAnsCount = total - answeredCount;
    const confirmMsg = unAnsCount > 0
      ? `您還有 ${unAnsCount} 題尚未回答，確定要提前交卷嗎？`
      : `確定要提交考卷結算成績嗎？`;
    
    if (confirm(confirmMsg)) {
      submitExam(false);
    }
  });
}

function submitExam(isTimeout = false) {
  if (!state.activeExam) return;

  const exam = state.activeExam;
  if (exam.timerInterval) clearInterval(exam.timerInterval);

  exam.isSubmitted = true;
  
  let correctCount = 0;
  exam.questions.forEach(q => {
    const userAns = exam.answers[q.id];
    if (userAns === q.ans) {
      correctCount++;
    } else {
      state.wrongAnswers[q.id] = (state.wrongAnswers[q.id] || 0) + 1;
    }
  });

  const score = Math.round((correctCount / exam.questions.length) * 100);
  exam.score = score;
  const isPassed = score >= 85;

  state.examHistory.push({
    timestamp: Date.now(),
    score: score,
    passed: isPassed,
    correctCount: correctCount,
    totalCount: exam.questions.length,
    timeSpentSec: (30 * 60) - exam.timeRemainingSec
  });

  saveStorage();
  renderExam();
}

function renderExamReport() {
  const exam = state.activeExam;
  const isPassed = exam.score >= 85;

  mainContainer.innerHTML = `
    <div class="quiz-container">
      <div class="glass-card result-card">
        <div class="result-badge">${isPassed ? '🎉' : '⚠️'}</div>
        <div class="result-score ${isPassed ? 'pass' : 'fail'}">${exam.score} 分</div>
        <div class="result-verdict" style="color: ${isPassed ? 'var(--success-color)' : 'var(--danger-color)'};">
          ${isPassed ? '考試合格！預祝順利拿到駕照！' : '未達標準 (85分及格)，建議多加練習！'}
        </div>

        <div class="result-stats-row">
          <div class="result-stat-item">
            <span class="result-stat-val" style="color: var(--success-color);">${exam.questions.filter(q => exam.answers[q.id] === q.ans).length}</span>
            <span class="result-stat-lbl">答對題數</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-val" style="color: var(--danger-color);">${exam.questions.filter(q => exam.answers[q.id] !== q.ans).length}</span>
            <span class="result-stat-lbl">答錯題數</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-val">${Math.floor(((30 * 60) - exam.timeRemainingSec) / 60)} 分 ${((30 * 60) - exam.timeRemainingSec) % 60} 秒</span>
            <span class="result-stat-lbl">答題耗時</span>
          </div>
        </div>

        <div class="hero-actions" style="justify-content: center;">
          <button class="btn-primary" id="btn-re-exam">
            🔄 再測驗一次 (全新40題)
          </button>
          <button class="btn-secondary" id="btn-view-wrong">
            ❌ 複習錯題
          </button>
        </div>
      </div>

      <h3 style="margin: 32px 0 16px; font-weight: 800;">📝 題目詳細檢討列表</h3>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${exam.questions.map((q, idx) => {
          const userAns = exam.answers[q.id];
          const isRight = userAns === q.ans;
          return `
            <div class="glass-card" style="border-left: 5px solid ${isRight ? 'var(--success-color)' : 'var(--danger-color)'};">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 700; color: ${isRight ? 'var(--success-color)' : 'var(--danger-color)'};">
                  第 ${idx + 1} 題 (${q.id}) - ${isRight ? '✓ 答對' : '✗ 答錯'}
                </span>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${q.category}</span>
              </div>
              
              ${q.image ? `<img src="${getImageUrl(q.image)}" style="max-height: 140px; margin: 8px 0; border-radius: 8px;" />` : ''}
              <div style="font-weight: 700; margin-bottom: 12px;">${q.prompt}</div>

              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.92rem;">
                ${q.options.map((optText, oIdx) => {
                  const oNum = oIdx + 1;
                  const isUserSel = userAns === oNum;
                  const isCorrectAns = q.ans === oNum;
                  let bg = 'rgba(255,255,255,0.03)';
                  let color = 'var(--text-muted)';
                  if (isCorrectAns) { bg = 'var(--success-bg)'; color = 'var(--success-color)'; }
                  else if (isUserSel && !isRight) { bg = 'var(--danger-bg)'; color = 'var(--danger-color)'; }

                  return `
                    <div style="padding: 8px 12px; border-radius: 6px; background: ${bg}; color: ${color}; font-weight: ${isCorrectAns || isUserSel ? '700' : '400'};">
                      (${oNum}) ${optText} ${isCorrectAns ? ' 【正解】' : ''} ${isUserSel ? ' 【您的選擇】' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.getElementById('btn-re-exam').addEventListener('click', () => startNewExam(40));
  document.getElementById('btn-view-wrong').addEventListener('click', () => switchView('notebook'));
}

/* ==========================================================================
   3. PRACTICE MODE
   ========================================================================== */
function renderPractice() {
  const sections = ["ALL", "架構一", "架構二", "架構三"];
  
  let filtered = state.questions;
  if (state.activePractice.sectionFilter !== 'ALL') {
    filtered = filtered.filter(q => q.section.includes(state.activePractice.sectionFilter));
  }

  const curIdx = state.activePractice.currentIndex;
  const curQ = filtered[curIdx] || filtered[0];
  const total = filtered.length;

  if (!curQ) {
    mainContainer.innerHTML = `<div class="glass-card">目前分類尚無題目</div>`;
    return;
  }

  const userAns = state.userAnswers[curQ.id];
  const isBookmarked = state.bookmarks.has(curQ.id);

  mainContainer.innerHTML = `
    <div class="quiz-container">
      <div class="glass-card" style="margin-bottom: 20px; padding: 16px 24px;">
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 0.9rem;">篩選架構：</span>
          ${sections.map(sec => `
            <button class="pill-btn ${state.activePractice.sectionFilter === sec ? 'active' : ''}" data-sec="${sec}">
              ${sec === 'ALL' ? '全部 1090 題' : sec}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="glass-card question-card">
        <div class="q-meta">
          <span class="q-tag">第 ${curIdx + 1} / ${total} 題 (題號 ${curQ.id}) ｜ ${curQ.category}</span>
          <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" id="btn-toggle-bookmark-prac">
            ${isBookmarked ? '★' : '☆'}
          </button>
        </div>

        ${curQ.image ? `
          <div class="q-image-container">
            <img src="${getImageUrl(curQ.image)}" alt="題示圖片" class="q-image" />
          </div>
        ` : ''}

        <div class="q-prompt">${curQ.prompt}</div>

        <div class="options-list">
          ${curQ.options.map((optText, idx) => {
            const optNum = idx + 1;
            const isSelected = userAns === optNum;
            const isCorrect = curQ.ans === optNum;
            
            let extraClass = '';
            if (userAns !== undefined) {
              if (isCorrect) extraClass = 'correct';
              else if (isSelected) extraClass = 'wrong';
            } else if (isSelected) {
              extraClass = 'selected';
            }

            return `
              <div class="option-item ${extraClass}" data-opt="${optNum}">
                <div class="option-key">${optNum}</div>
                <div class="option-text">${optText}</div>
              </div>
            `;
          }).join('')}
        </div>

        ${userAns !== undefined ? `
          <div style="margin-top: 16px; padding: 14px; border-radius: 10px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); font-weight: 700; color: var(--text-main);">
            正確答案：(${curQ.ans}) ${curQ.options[curQ.ans - 1]}
          </div>
        ` : ''}

        <div class="quiz-nav-footer">
          <button class="btn-nav-arrow" id="btn-prev-prac" ${curIdx === 0 ? 'disabled' : ''}>
            ❮ 上一題
          </button>
          
          <span style="font-weight: 700; color: var(--text-muted);">${curIdx + 1} of ${total}</span>

          <button class="btn-nav-arrow" id="btn-next-prac" ${curIdx === total - 1 ? 'disabled' : ''}>
            下一題 ❯
          </button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activePractice.sectionFilter = btn.dataset.sec;
      state.activePractice.currentIndex = 0;
      renderPractice();
    });
  });

  document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', () => {
      const optNum = intVal(item.dataset.opt);
      state.userAnswers[curQ.id] = optNum;
      
      if (optNum !== curQ.ans) {
        state.wrongAnswers[curQ.id] = (state.wrongAnswers[curQ.id] || 0) + 1;
      }
      saveStorage();
      renderPractice();
    });
  });

  document.getElementById('btn-toggle-bookmark-prac').addEventListener('click', () => {
    if (state.bookmarks.has(curQ.id)) state.bookmarks.delete(curQ.id);
    else state.bookmarks.add(curQ.id);
    saveStorage();
    renderPractice();
  });

  document.getElementById('btn-prev-prac').addEventListener('click', () => {
    if (state.activePractice.currentIndex > 0) {
      state.activePractice.currentIndex--;
      renderPractice();
    }
  });

  document.getElementById('btn-next-prac').addEventListener('click', () => {
    if (state.activePractice.currentIndex < total - 1) {
      state.activePractice.currentIndex++;
      renderPractice();
    }
  });
}

/* ==========================================================================
   4. NOTEBOOK VIEW
   ========================================================================== */
function renderNotebook() {
  const wrongIds = Object.keys(state.wrongAnswers).map(id => intVal(id));
  const bookmarkIds = Array.from(state.bookmarks);

  const wrongQuestions = state.questions.filter(q => wrongIds.includes(q.id));
  const bookmarkedQuestions = state.questions.filter(q => bookmarkIds.includes(q.id));

  mainContainer.innerHTML = `
    <div class="quiz-container">
      <div class="glass-card" style="margin-bottom: 24px;">
        <h2 style="margin-bottom: 16px; font-weight: 800;">❤️ 錯題本與重點收藏庫</h2>
        <div style="display: flex; gap: 16px;">
          <button class="btn-primary" id="btn-retest-wrong" ${wrongQuestions.length === 0 ? 'disabled' : ''}>
            🎯 針對錯題隨機測驗 (${wrongQuestions.length} 題)
          </button>
          <button class="btn-secondary" id="btn-clear-wrong" ${wrongQuestions.length === 0 ? 'disabled' : ''}>
            🗑️ 清空錯題紀錄
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <h3>❌ 錯題列表 (${wrongQuestions.length} 題)</h3>
        ${wrongQuestions.length === 0 ? `
          <div class="glass-card" style="text-align: center; color: var(--text-muted);">尚未有錯題紀錄，繼續保持！</div>
        ` : wrongQuestions.map(q => renderQuestionSummaryItem(q)).join('')}

        <h3 style="margin-top: 24px;">⭐ 星號收藏題 (${bookmarkedQuestions.length} 題)</h3>
        ${bookmarkedQuestions.length === 0 ? `
          <div class="glass-card" style="text-align: center; color: var(--text-muted);">尚未收藏任何題目。點擊題目右上方星號即可收藏。</div>
        ` : bookmarkedQuestions.map(q => renderQuestionSummaryItem(q)).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-remove-wrong').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qId = intVal(btn.dataset.id);
      delete state.wrongAnswers[qId];
      saveStorage();
      renderNotebook();
    });
  });

  if (document.getElementById('btn-retest-wrong')) {
    document.getElementById('btn-retest-wrong').addEventListener('click', () => {
      if (wrongQuestions.length === 0) return;
      state.activeExam = {
        questions: shuffle([...wrongQuestions]),
        answers: {},
        currentIndex: 0,
        timeRemainingSec: 30 * 60,
        timerInterval: null,
        isSubmitted: false,
        score: 0
      };
      switchView('exam');
    });
  }

  if (document.getElementById('btn-clear-wrong')) {
    document.getElementById('btn-clear-wrong').addEventListener('click', () => {
      if (confirm('確定要清空所有錯題紀錄嗎？')) {
        state.wrongAnswers = {};
        saveStorage();
        renderNotebook();
      }
    });
  }
}

function renderQuestionSummaryItem(q) {
  return `
    <div class="glass-card" style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 700; color: var(--accent-primary);">題號 ${q.id} ｜ ${q.category}</span>
        <button class="btn-secondary btn-remove-wrong" data-id="${q.id}" style="padding: 4px 10px; font-size: 0.78rem;">
          移除紀錄
        </button>
      </div>
      ${q.image ? `<img src="${getImageUrl(q.image)}" style="max-height: 120px; margin: 8px 0; border-radius: 8px;" />` : ''}
      <div style="font-weight: 700; margin-bottom: 8px;">${q.prompt}</div>
      <div style="color: var(--success-color); font-weight: 700; font-size: 0.92rem;">
        正解：(${q.ans}) ${q.options[q.ans - 1]}
      </div>
    </div>
  `;
}

/* ==========================================================================
   5. SEARCH VIEW
   ========================================================================== */
function renderSearch() {
  mainContainer.innerHTML = `
    <div class="quiz-container">
      <div class="search-header glass-card">
        <h2 style="margin-bottom: 16px; font-weight: 800;">🔍 題庫全文與題號搜尋</h2>
        
        <div class="search-input-wrapper">
          <span class="search-icon-inside">🔍</span>
          <input type="text" class="search-input" id="input-search" placeholder="輸入關鍵字 (如：酒駕、標線、180000、或題號 101)..." value="${state.searchKeyword}">
        </div>

        <div class="filter-pills">
          <button class="pill-btn ${state.searchFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">全部 1090 題</button>
          <button class="pill-btn ${state.searchFilter === 'IMAGE' ? 'active' : ''}" data-filter="IMAGE">🖼️ 含圖示標誌題</button>
          <button class="pill-btn ${state.searchFilter === 'WRONG' ? 'active' : ''}" data-filter="WRONG">❌ 僅顯示錯題</button>
          <button class="pill-btn ${state.searchFilter === 'BOOKMARK' ? 'active' : ''}" data-filter="BOOKMARK">⭐ 僅顯示收藏</button>
        </div>
      </div>

      <div class="search-results-list" id="search-results-container">
      </div>
    </div>
  `;

  const inputSearch = document.getElementById('input-search');
  inputSearch.addEventListener('input', (e) => {
    state.searchKeyword = e.target.value;
    updateSearchResults();
  });

  document.querySelectorAll('.filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.searchFilter = btn.dataset.filter;
      renderSearch();
    });
  });

  updateSearchResults();
}

function updateSearchResults() {
  const container = document.getElementById('search-results-container');
  if (!container) return;

  const kw = state.searchKeyword.trim().toLowerCase();
  
  let results = state.questions.filter(q => {
    if (state.searchFilter === 'IMAGE' && !q.image) return false;
    if (state.searchFilter === 'WRONG' && !(q.id in state.wrongAnswers)) return false;
    if (state.searchFilter === 'BOOKMARK' && !state.bookmarks.has(q.id)) return false;

    if (!kw) return true;
    if (String(q.id) === kw) return true;
    if (q.prompt.toLowerCase().includes(kw)) return true;
    if (q.category.toLowerCase().includes(kw)) return true;
    if (q.options.some(o => o.toLowerCase().includes(kw))) return true;

    return false;
  });

  if (results.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align: center; color: var(--text-muted);">
        搜尋無結果，請嘗試其他關鍵字。
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">共找到 ${results.length} 題相符題目：</div>
    ${results.slice(0, 100).map(q => renderQuestionSummaryItem(q)).join('')}
    ${results.length > 100 ? `<div style="text-align: center; color: var(--text-dim); padding: 12px;">(僅顯示前 100 筆結果，請再縮小搜尋範圍)</div>` : ''}
  `;
}

// Helpers
function intVal(val) {
  return parseInt(val, 10);
}

function shuffle(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

// Run App
document.addEventListener('DOMContentLoaded', init);
