(function () {
  const DATA = window.TOPIK_PRACTICE_MOCK_DATA;
  const STORAGE_KEY = `${DATA.quizId}:store:v2`;
  const app = document.getElementById("app");

  const iconPaths = {
    back: '<path d="m15 18-6-6 6-6"/><path d="M21 12H9"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3 3 3 0 0 1 3-3h5a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    layout: '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="M8 5v14"/><path d="M3 10h5"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    expand: '<path d="m15 3 6 0 0 6"/><path d="M10 14 21 3"/><path d="m9 21-6 0 0-6"/><path d="M14 10 3 21"/>',
    right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    left: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'
  };

  const state = {
    screen: "home",
    filter: "all",
    sectionId: null,
    currentIndex: 0,
    answers: {},
    result: null,
    reviewFilter: "wrong"
  };

  let store = loadStore();
  let currentAudio = null;
  let audioQuestionId = null;

  document.documentElement.dataset.layout = store.layout || "phone";
  state.filter = store.filter || "all";

  app.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeydown);
  render();

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function ensureStoreShape() {
    store.layout = store.layout || "phone";
    store.filter = store.filter || "all";
    store.drafts = store.drafts || {};
    store.attempts = store.attempts || {};
  }

  function icon(name, label) {
    return `<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || ""}</svg><span class="sr-only">${escapeHtml(label || name)}</span>`;
  }

  function getSection(sectionId) {
    return DATA.sections.find((section) => section.id === sectionId);
  }

  function getCurrentSection() {
    return getSection(state.sectionId);
  }

  function getAttempts(sectionId) {
    ensureStoreShape();
    return store.attempts[sectionId] || [];
  }

  function getDraft(sectionId) {
    ensureStoreShape();
    return store.drafts[sectionId] || null;
  }

  function saveDraft() {
    ensureStoreShape();
    store.drafts[state.sectionId] = {
      answers: state.answers,
      currentIndex: state.currentIndex,
      startedAt: store.drafts[state.sectionId]?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveStore();
  }

  function clearDraft(sectionId) {
    ensureStoreShape();
    delete store.drafts[sectionId];
    saveStore();
  }

  function render() {
    stopAudio();
    if (state.screen === "section") {
      renderSectionStart();
    } else if (state.screen === "quiz") {
      renderQuiz();
    } else if (state.screen === "result") {
      renderResult();
    } else {
      renderHome();
    }
    hydrateImages();
  }

  function shell(content) {
    app.innerHTML = `
      <div class="app-shell">
        ${renderTopbar()}
        ${content}
      </div>
    `;
  }

  function renderTopbar() {
    const layout = store.layout || "phone";
    const title = layout === "wide" ? "넓게 보기" : "폰 화면";
    return `
      <header class="topbar">
        <div class="topbar__group">
          <a class="icon-button" href="../index.html" title="앱 허브" aria-label="앱 허브">${icon("back", "앱 허브")}</a>
          <button class="icon-button" type="button" data-action="go-home" title="처음 화면" aria-label="처음 화면">${icon("home", "처음 화면")}</button>
        </div>
        <strong>${escapeHtml(DATA.title)}</strong>
        <button class="icon-button" type="button" data-action="toggle-layout" title="${title}" aria-label="${title}">${icon(layout === "wide" ? "layout" : "grid", title)}</button>
      </header>
    `;
  }

  function renderHome() {
    ensureStoreShape();
    store.filter = state.filter;
    saveStore();

    const visibleSections = DATA.sections.filter((section) => state.filter === "all" || section.skill === state.filter);
    const readingCount = countBySkill("reading");
    const listeningCount = countBySkill("listening");

    shell(`
      <section class="hero">
        <span class="eyebrow">${icon("book", "")} TOPIK II Practice</span>
        <h1>${escapeHtml(DATA.title)}</h1>
        <p>${escapeHtml(DATA.subtitle)}</p>
        ${DATA.scopeNote ? `<p class="scope-note">${escapeHtml(DATA.scopeNote)}</p>` : ""}
        <div class="stats-grid">
          ${statCard("유형", `${DATA.sections.length}세트`)}
          ${statCard("전체 문항", `${totalQuestions(DATA.sections)}문항`)}
          ${statCard("읽기", `${readingCount}문항`)}
          ${statCard("듣기", `${listeningCount}문항`)}
        </div>
      </section>

      <section class="panel">
        <div class="meta-row">
          <div class="segment-control" aria-label="영역 필터">
            ${segmentButton("all", "전체", state.filter)}
            ${segmentButton("reading", "읽기", state.filter)}
            ${segmentButton("listening", "듣기", state.filter)}
          </div>
          <span class="chip"><strong>${visibleSections.length}</strong> 세트</span>
        </div>
        <div class="section-grid">
          ${visibleSections.map(renderSectionCard).join("")}
        </div>
      </section>

      <details class="staff-note">
        <summary>강사용 자료 관리</summary>
        <p>${DATA.scopeNote ? `${escapeHtml(DATA.scopeNote)} ` : ""}${escapeHtml(DATA.sourceNote)} 문항별 이미지는 <code>assets/questions</code>, 듣기 MP3는 <code>assets/audio</code>에서 재생됩니다.</p>
      </details>
    `);
  }

  function renderSectionCard(section) {
    const draft = getDraft(section.id);
    const attempts = getAttempts(section.id);
    const latest = attempts[0];
    const best = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null;

    return `
      <article class="section-card">
        <div class="meta-row">
          <span class="chip">${escapeHtml(section.part)}</span>
          <span class="chip">${escapeHtml(section.type)}</span>
          <span class="chip">${escapeHtml(section.countLabel)}</span>
        </div>
        <div>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.description)}</p>
        </div>
        <div class="meta-row">
          <span class="chip"><strong>${best === null ? "-" : best}</strong> 최고점</span>
          <span class="chip"><strong>${attempts.length}</strong> 기록</span>
          ${draft ? '<span class="chip"><strong>진행 중</strong></span>' : ""}
          ${latest ? `<span class="chip">최근 ${formatDate(latest.finishedAt)}</span>` : ""}
        </div>
        <div class="action-row">
          <button class="primary-button" type="button" data-action="open-section" data-section-id="${section.id}">${draft ? "이어 풀기" : "시작"}</button>
          <button class="secondary-button" type="button" data-action="open-section" data-section-id="${section.id}">기록 보기</button>
        </div>
      </article>
    `;
  }

  function renderSectionStart() {
    const section = getCurrentSection();
    const draft = getDraft(section.id);
    const attempts = getAttempts(section.id);
    const answered = draft ? Object.keys(draft.answers || {}).length : 0;
    const best = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : 0;

    shell(`
      <section class="start-card">
        <div class="meta-row">
          <span class="chip">${escapeHtml(section.part)}</span>
          <span class="chip">${escapeHtml(section.type)}</span>
          <span class="chip">${escapeHtml(section.countLabel)}</span>
        </div>
        <h1>${escapeHtml(section.title)}</h1>
        <p>${escapeHtml(section.description)}</p>
        <div class="stats-grid">
          ${statCard("문항", `${section.questions.length}문항`)}
          ${statCard("진행", draft ? `${answered}/${section.questions.length}` : "새 세트")}
          ${statCard("최고점", `${best}/${section.questions.length}`)}
          ${statCard("응시 기록", `${attempts.length}회`)}
        </div>
        <div class="action-row">
          ${draft ? `<button class="primary-button" type="button" data-action="resume-section" data-section-id="${section.id}">${icon("play", "")}이어 풀기</button>` : ""}
          <button class="primary-button" type="button" data-action="start-section" data-section-id="${section.id}">${icon("reset", "")}새로 풀기</button>
          <button class="secondary-button" type="button" data-action="go-home">${icon("list", "")}유형 목록</button>
        </div>
      </section>

      <section class="panel">
        <div class="history-head">
          <div>
            <strong>응시 기록</strong>
            <p class="muted">최근 기록부터 표시됩니다.</p>
          </div>
        </div>
        <div class="history-list">
          ${attempts.length ? attempts.map((attempt) => renderHistoryCard(section, attempt)).join("") : '<div class="empty-card">아직 저장된 기록이 없습니다.</div>'}
        </div>
      </section>
    `);
  }

  function renderHistoryCard(section, attempt) {
    const percent = Math.round((attempt.score / attempt.total) * 100);
    return `
      <article class="history-card">
        <div class="history-head">
          <div>
            <strong>${attempt.score}/${attempt.total}점</strong>
            <div class="muted">${formatDate(attempt.finishedAt)} · ${percent}%</div>
          </div>
          <button class="secondary-button" type="button" data-action="review-attempt" data-section-id="${section.id}" data-attempt-id="${attempt.id}">복습</button>
        </div>
      </article>
    `;
  }

  function renderQuiz() {
    const section = getCurrentSection();
    const question = section.questions[state.currentIndex];
    const answeredCount = Object.keys(state.answers).length;
    const progress = Math.round((answeredCount / section.questions.length) * 100);
    const answer = state.answers[question.id];

    shell(`
      <section class="progress-card">
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-meta">
          <span>${state.currentIndex + 1}/${section.questions.length}</span>
          <span>${answeredCount}문항 답함</span>
        </div>
        <div class="dot-strip" aria-label="문항 이동">
          ${section.questions.map((item, index) => `
            <button
              class="dot-button ${state.answers[item.id] ? "is-answered" : ""} ${index === state.currentIndex ? "is-current" : ""}"
              type="button"
              data-action="goto-question"
              data-index="${index}"
              aria-label="${index + 1}번"
            ></button>
          `).join("")}
        </div>
      </section>

      <section class="quiz-card" data-quiz-card>
        <div class="quiz-head">
          <div>
            <div class="question-number">${String(question.number).padStart(2, "0")}</div>
            <div class="meta-row">
              <span class="chip">${escapeHtml(question.tag)}</span>
              <span class="chip">p.${question.page}</span>
            </div>
          </div>
          <button class="secondary-button" type="button" data-action="open-source" data-question-id="${question.id}">${icon("expand", "")}원문 확대</button>
        </div>
        <p class="question-prompt">${escapeHtml(question.prompt)}</p>
        ${renderAudioPanel(question)}
        ${renderSourceFrame(question)}
        <div class="choice-grid" role="radiogroup" aria-label="답 선택">
          ${question.choices.map((choice) => `
            <button
              class="choice-button ${answer === choice.id ? "is-selected" : ""}"
              type="button"
              data-action="select-answer"
              data-question-id="${question.id}"
              data-choice-id="${choice.id}"
              aria-checked="${answer === choice.id}"
              role="radio"
            >${escapeHtml(choice.text)}</button>
          `).join("")}
        </div>
        <div class="nav-bar">
          <button class="nav-button" type="button" data-action="prev-question" title="이전" aria-label="이전" ${state.currentIndex === 0 ? "disabled" : ""}>${icon("left", "이전")}</button>
          <button class="primary-button" type="button" data-action="finish-section">${icon("check", "")}채점하기</button>
          <button class="nav-button is-primary" type="button" data-action="next-question" title="다음" aria-label="다음">${icon("right", "다음")}</button>
        </div>
      </section>
    `);
  }

  function renderAudioPanel(question) {
    if (!question.audio) return "";
    const isPlaying = currentAudio && audioQuestionId === question.id && !currentAudio.paused;
    return `
      <div class="audio-panel">
        <button class="audio-button ${isPlaying ? "is-playing" : ""}" type="button" data-action="toggle-audio" data-question-id="${question.id}" title="듣기 재생" aria-label="듣기 재생">
          ${icon(isPlaying ? "pause" : "play", "듣기 재생")}
        </button>
        <div class="audio-copy">
          <span class="audio-title">${escapeHtml(question.audio.label)}</span>
          <span class="audio-sub">문제를 들은 뒤 답을 고르세요.</span>
        </div>
      </div>
    `;
  }

  function renderSourceFrame(question) {
    return `
      <figure class="source-frame">
        <img src="${escapeHtml(question.pageImage)}" alt="${escapeHtml(question.tag)} 원문 p.${question.page}" loading="lazy" data-source-image>
        <figcaption class="source-caption">p.${question.page}</figcaption>
        <div class="source-fallback">로컬 문항 이미지가 아직 준비되지 않았습니다.</div>
      </figure>
    `;
  }

  function renderResult() {
    const section = getCurrentSection();
    const result = state.result || getAttempts(section.id)[0];
    if (!result) {
      state.screen = "section";
      renderSectionStart();
      return;
    }

    const percent = Math.round((result.score / result.total) * 100);
    const wrongCount = result.total - result.score;
    const reviewQuestions = section.questions.filter((question) => {
      if (state.reviewFilter === "all") return true;
      return result.answers[question.id] !== question.answer;
    });

    shell(`
      <section class="result-card">
        <span class="eyebrow">${icon("check", "")} Result</span>
        <h1>${result.score}/${result.total}점</h1>
        <div class="score-wrap">
          <div class="score-ring" style="--ring-degree: ${Math.round(percent * 3.6)}deg"><span>${percent}%</span></div>
          <div>
            <strong>${escapeHtml(section.title)}</strong>
            <p class="muted">정답 ${result.score}문항 · 오답 ${wrongCount}문항 · ${formatDate(result.finishedAt)}</p>
          </div>
        </div>
        <div class="result-actions">
          <button class="primary-button" type="button" data-action="start-section" data-section-id="${section.id}">${icon("reset", "")}다시 풀기</button>
          <button class="secondary-button" type="button" data-action="back-section">${icon("list", "")}기록 보기</button>
          <button class="secondary-button" type="button" data-action="go-home">${icon("home", "")}유형 목록</button>
        </div>
      </section>

      <section class="panel">
        <div class="history-head">
          <div>
            <strong>복습</strong>
            <p class="muted">듣기 지문은 결과 화면에서 확인할 수 있습니다.</p>
          </div>
          <div class="segment-control" aria-label="복습 필터">
            ${reviewSegmentButton("wrong", "오답", state.reviewFilter)}
            ${reviewSegmentButton("all", "전체", state.reviewFilter)}
          </div>
        </div>
        <div class="review-list">
          ${reviewQuestions.length ? reviewQuestions.map((question) => renderReviewItem(question, result)).join("") : '<div class="empty-card">오답이 없습니다.</div>'}
        </div>
      </section>
    `);
  }

  function renderReviewItem(question, result) {
    const selected = result.answers[question.id];
    const isCorrect = selected === question.answer;
    const selectedText = question.choices.find((choice) => choice.id === selected)?.text || "-";
    const correctText = question.choices.find((choice) => choice.id === question.answer)?.text || question.answer;

    return `
      <article class="review-item">
        <div class="review-head">
          <div>
            <strong>${question.number}. ${escapeHtml(question.prompt)}</strong>
            <div class="meta-row">
              <span class="chip">${escapeHtml(question.tag)}</span>
              <span class="chip">p.${question.page}</span>
            </div>
          </div>
          <span class="status-pill ${isCorrect ? "correct" : "wrong"}">${isCorrect ? "정답" : "오답"}</span>
        </div>
        <div class="review-answer">내 답 ${escapeHtml(selectedText)} · 정답 ${escapeHtml(correctText)}</div>
        <div class="choice-grid">
          ${question.choices.map((choice) => {
            const className = choice.id === question.answer ? "is-correct" : choice.id === selected ? "is-wrong" : "";
            return `<button class="choice-button ${className}" type="button" disabled>${escapeHtml(choice.text)}</button>`;
          }).join("")}
        </div>
        <div class="action-row">
          <button class="secondary-button" type="button" data-action="open-source" data-question-id="${question.id}">${icon("expand", "")}원문</button>
        </div>
        ${question.audio ? `<div class="transcript-box">${escapeHtml(question.audio.transcript.join("\n"))}</div>` : ""}
      </article>
    `;
  }

  function renderModal(question) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.dataset.modal = "source";
    modal.innerHTML = `
      <div class="modal-panel" role="dialog" aria-modal="true" aria-label="원문 확대">
        <div class="modal-close">
          <button class="icon-button" type="button" data-action="close-modal" title="닫기" aria-label="닫기">${icon("close", "닫기")}</button>
        </div>
        ${renderSourceFrame(question)}
      </div>
    `;
    document.body.appendChild(modal);
    hydrateImages(modal);
  }

  function segmentButton(value, label, active) {
    return `<button class="seg-button ${active === value ? "is-active" : ""}" type="button" data-action="set-filter" data-filter="${value}">${label}</button>`;
  }

  function reviewSegmentButton(value, label, active) {
    return `<button class="seg-button ${active === value ? "is-active" : ""}" type="button" data-action="set-review-filter" data-filter="${value}">${label}</button>`;
  }

  function statCard(label, value) {
    return `
      <div class="stats-card">
        <span class="stat-label">${escapeHtml(label)}</span>
        <span class="stat-value">${escapeHtml(value)}</span>
      </div>
    `;
  }

  function countBySkill(skill) {
    return totalQuestions(DATA.sections.filter((section) => section.skill === skill));
  }

  function totalQuestions(sections) {
    return sections.reduce((sum, section) => sum + section.questions.length, 0);
  }

  function handleClick(event) {
    const control = event.target.closest("[data-action]");
    if (!control) return;

    const action = control.dataset.action;
    if (action === "toggle-layout") {
      toggleLayout();
      return;
    }
    if (action === "go-home") {
      state.screen = "home";
      state.sectionId = null;
      state.result = null;
      render();
      return;
    }
    if (action === "set-filter") {
      state.filter = control.dataset.filter;
      renderHome();
      return;
    }
    if (action === "open-section") {
      openSection(control.dataset.sectionId);
      return;
    }
    if (action === "start-section") {
      startSection(control.dataset.sectionId, false);
      return;
    }
    if (action === "resume-section") {
      startSection(control.dataset.sectionId, true);
      return;
    }
    if (action === "review-attempt") {
      reviewAttempt(control.dataset.sectionId, control.dataset.attemptId);
      return;
    }
    if (action === "select-answer") {
      selectAnswer(control.dataset.questionId, control.dataset.choiceId);
      return;
    }
    if (action === "goto-question") {
      goToQuestion(Number(control.dataset.index));
      return;
    }
    if (action === "prev-question") {
      goToQuestion(Math.max(0, state.currentIndex - 1));
      return;
    }
    if (action === "next-question") {
      nextQuestion();
      return;
    }
    if (action === "finish-section") {
      finishSection();
      return;
    }
    if (action === "back-section") {
      state.screen = "section";
      state.result = null;
      render();
      return;
    }
    if (action === "set-review-filter") {
      state.reviewFilter = control.dataset.filter;
      renderResult();
      return;
    }
    if (action === "open-source") {
      const question = findQuestion(control.dataset.questionId);
      if (question) renderModal(question);
      return;
    }
    if (action === "close-modal") {
      closeModal();
      return;
    }
    if (action === "toggle-audio") {
      const question = findQuestion(control.dataset.questionId);
      if (question) toggleAudio(question);
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeModal();
    }
    if (state.screen !== "quiz") return;
    if (event.key === "ArrowLeft") {
      goToQuestion(Math.max(0, state.currentIndex - 1));
    }
    if (event.key === "ArrowRight") {
      nextQuestion();
    }
  }

  function openSection(sectionId) {
    state.screen = "section";
    state.sectionId = sectionId;
    state.result = null;
    render();
  }

  function startSection(sectionId, resume) {
    const section = getSection(sectionId);
    const draft = resume ? getDraft(sectionId) : null;
    state.screen = "quiz";
    state.sectionId = sectionId;
    state.currentIndex = draft?.currentIndex || 0;
    state.answers = draft?.answers || {};
    state.result = null;

    if (!resume) {
      clearDraft(sectionId);
      store.drafts[sectionId] = {
        answers: {},
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveStore();
    }

    if (!section.questions[state.currentIndex]) state.currentIndex = 0;
    render();
  }

  function reviewAttempt(sectionId, attemptId) {
    const attempt = getAttempts(sectionId).find((item) => item.id === attemptId);
    if (!attempt) return;
    state.screen = "result";
    state.sectionId = sectionId;
    state.result = attempt;
    state.reviewFilter = "wrong";
    render();
  }

  function selectAnswer(questionId, choiceId) {
    state.answers = {
      ...state.answers,
      [questionId]: choiceId
    };
    saveDraft();
    renderQuiz();
  }

  function goToQuestion(index) {
    const section = getCurrentSection();
    if (index < 0 || index >= section.questions.length) return;
    if (index !== state.currentIndex) stopAudio();
    state.currentIndex = index;
    saveDraft();
    renderQuiz();
  }

  function nextQuestion() {
    const section = getCurrentSection();
    if (state.currentIndex < section.questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    } else {
      finishSection();
    }
  }

  function finishSection() {
    const section = getCurrentSection();
    const firstMissing = section.questions.findIndex((question) => !state.answers[question.id]);
    if (firstMissing >= 0) {
      state.currentIndex = firstMissing;
      renderQuiz();
      const card = app.querySelector("[data-quiz-card]");
      if (card) {
        card.classList.add("is-shake");
        window.setTimeout(() => card.classList.remove("is-shake"), 320);
      }
      return;
    }

    const score = section.questions.reduce((sum, question) => {
      return sum + (state.answers[question.id] === question.answer ? 1 : 0);
    }, 0);
    const attempt = {
      id: `${Date.now()}`,
      sectionId: section.id,
      score,
      total: section.questions.length,
      answers: { ...state.answers },
      finishedAt: new Date().toISOString()
    };
    ensureStoreShape();
    store.attempts[section.id] = [attempt, ...getAttempts(section.id)].slice(0, 12);
    clearDraft(section.id);
    saveStore();

    state.screen = "result";
    state.result = attempt;
    state.reviewFilter = score === section.questions.length ? "all" : "wrong";
    render();
  }

  function toggleLayout() {
    ensureStoreShape();
    store.layout = store.layout === "wide" ? "phone" : "wide";
    document.documentElement.dataset.layout = store.layout;
    saveStore();
    render();
  }

  function toggleAudio(question) {
    if (!question.audio) return;
    if (currentAudio && audioQuestionId === question.id && !currentAudio.paused) {
      stopAudio();
      renderQuiz();
      return;
    }
    stopAudio();
    audioQuestionId = question.id;
    currentAudio = new Audio(question.audio.file);
    currentAudio.addEventListener("ended", () => {
      currentAudio = null;
      audioQuestionId = null;
      renderQuiz();
    });
    currentAudio.addEventListener("error", () => {
      currentAudio = null;
      audioQuestionId = null;
      renderQuiz();
    });
    currentAudio.play().then(renderQuiz).catch(() => {
      currentAudio = null;
      audioQuestionId = null;
      renderQuiz();
    });
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = null;
    audioQuestionId = null;
  }

  function findQuestion(questionId) {
    for (const section of DATA.sections) {
      const question = section.questions.find((item) => item.id === questionId);
      if (question) return question;
    }
    return null;
  }

  function closeModal() {
    const modal = document.querySelector("[data-modal]");
    if (modal) modal.remove();
  }

  function hydrateImages(scope = document) {
    scope.querySelectorAll("img[data-source-image]").forEach((image) => {
      image.addEventListener("error", () => {
        image.closest(".source-frame")?.classList.add("is-missing");
      }, { once: true });
      if (image.complete && image.naturalWidth === 0) {
        image.closest(".source-frame")?.classList.add("is-missing");
      }
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
