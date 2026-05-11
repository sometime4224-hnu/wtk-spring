(function () {
    "use strict";

    const ASSET_BASE = "../assets/c17/reading-writing/images/writing-cut/";
    const STORAGE_KEY = "korean3b.c17.writing-cut.v1";

    const stages = [
        {
            id: "choice",
            short: "선택",
            title: "컷에 맞는 문장 고르기",
            guide: "그림과 가장 잘 맞는 문장을 선택하세요."
        },
        {
            id: "keyword",
            short: "핵심어",
            title: "핵심어 넣기",
            guide: "아래 낱말을 눌러 빈칸을 완성하세요."
        },
        {
            id: "order",
            short: "어순",
            title: "어순 맞추기",
            guide: "문장 조각을 바른 순서대로 누르세요."
        },
        {
            id: "blank",
            short: "빈칸",
            title: "빈칸 직접 쓰기",
            guide: "중요 표현을 직접 입력하세요."
        }
    ];

    const cuts = [
        {
            id: 1,
            label: "서동 소개",
            image: "c17-writing-cut-01.webp",
            alt: "서동은 가난했지만 영리한 청년이었다",
            sentence: "백제에 살던 서동은 가난했지만 영리한 청년이었습니다.",
            choices: [0, 3, 5, 8],
            blanks: ["백제", "가난했지만 영리한 청년"],
            blankPrompt: ["", "에 살던 서동은 ", "이었습니다."],
            order: ["백제에 살던", "서동은", "가난했지만", "영리한 청년이었습니다."],
            required: ["백제", "서동", "가난", "영리"]
        },
        {
            id: 2,
            label: "신라로 향함",
            image: "c17-writing-cut-02.webp",
            alt: "서동이 선화 공주 이야기를 듣고 신라로 향한다",
            sentence: "그는 신라의 선화 공주가 아름답다는 이야기를 듣고 신라로 향했습니다.",
            choices: [1, 2, 4, 6],
            blanks: ["선화 공주", "신라"],
            blankPrompt: ["그는 신라의 ", "가 아름답다는 이야기를 듣고 ", "로 향했습니다."],
            order: ["그는", "신라의 선화 공주가", "아름답다는 이야기를 듣고", "신라로 향했습니다."],
            required: ["신라", "선화", "공주", "향했습니다"]
        },
        {
            id: 3,
            label: "노래를 퍼뜨림",
            image: "c17-writing-cut-03.webp",
            alt: "서동이 노래를 만들어 사람들 사이에 퍼뜨린다",
            sentence: "그곳에서 공주와 자신의 이름이 들어간 노래를 만들어 사람들 사이에 퍼뜨렸습니다.",
            choices: [2, 0, 4, 7],
            blanks: ["노래", "퍼뜨렸습니다"],
            blankPrompt: ["그곳에서 공주와 자신의 이름이 들어간 ", "를 만들어 사람들 사이에 ", "."],
            order: ["그곳에서", "공주와 자신의 이름이 들어간 노래를", "만들어", "사람들 사이에 퍼뜨렸습니다."],
            required: ["공주", "이름", "노래", "퍼뜨"]
        },
        {
            id: 4,
            label: "궁궐까지 전해짐",
            image: "c17-writing-cut-04.webp",
            alt: "아이들이 노래를 계속 불러 이야기가 궁궐까지 전해진다",
            sentence: "뜻을 모르는 아이들이 그 노래를 계속 부르자, 이야기는 궁궐 안까지 전해졌습니다.",
            choices: [3, 2, 5, 8],
            blanks: ["뜻을 모르는 아이들", "궁궐 안"],
            blankPrompt: ["", "이 그 노래를 계속 부르자, 이야기는 ", "까지 전해졌습니다."],
            order: ["뜻을 모르는 아이들이", "그 노래를 계속 부르자,", "이야기는", "궁궐 안까지 전해졌습니다."],
            required: ["아이", "노래", "궁궐", "전해"]
        },
        {
            id: 5,
            label: "궁 밖으로 나감",
            image: "c17-writing-cut-05.webp",
            alt: "왕이 공주를 궁 밖으로 내보낸다",
            sentence: "왕은 공주에게 나쁜 소문이 생겼다고 생각했고, 결국 공주를 궁 밖으로 내보냈습니다.",
            choices: [4, 1, 3, 6],
            blanks: ["나쁜 소문", "궁 밖"],
            blankPrompt: ["왕은 공주에게 ", "이 생겼다고 생각했고, 결국 공주를 ", "으로 내보냈습니다."],
            order: ["왕은 공주에게", "나쁜 소문이 생겼다고 생각했고,", "결국 공주를", "궁 밖으로 내보냈습니다."],
            required: ["왕", "공주", "소문", "궁 밖"]
        },
        {
            id: 6,
            label: "시골에서 만남",
            image: "c17-writing-cut-06.webp",
            alt: "공주가 시골에서 한 남자를 만난다",
            sentence: "공주는 시골에서 한 남자를 만났습니다.",
            choices: [5, 0, 6, 8],
            blanks: ["시골", "한 남자"],
            blankPrompt: ["공주는 ", "에서 ", "를 만났습니다."],
            order: ["공주는", "시골에서", "한 남자를", "만났습니다."],
            required: ["공주", "시골", "남자", "만났"]
        },
        {
            id: 7,
            label: "사랑과 결혼",
            image: "c17-writing-cut-07.webp",
            alt: "남자가 공주를 도와주고 두 사람이 결혼한다",
            sentence: "그 남자는 공주가 지낼 수 있도록 도와주었고, 두 사람은 서로 사랑하게 되어 결혼했습니다.",
            choices: [6, 1, 4, 7],
            blanks: ["지낼 수 있도록", "결혼했습니다"],
            blankPrompt: ["그 남자는 공주가 ", " 도와주었고, 두 사람은 서로 사랑하게 되어 ", "."],
            order: ["그 남자는", "공주가 지낼 수 있도록 도와주었고,", "두 사람은 서로 사랑하게 되어", "결혼했습니다."],
            required: ["남자", "공주", "도와", "결혼"]
        },
        {
            id: 8,
            label: "사실을 알게 됨",
            image: "c17-writing-cut-08.webp",
            alt: "공주가 소문을 퍼뜨린 사람이 남편 서동이라는 사실을 알게 된다",
            sentence: "시간이 지나 공주는 소문을 퍼뜨린 사람이 남편 서동이었다는 사실을 알게 되었지만, 서동을 향한 마음은 달라지지 않았습니다.",
            choices: [7, 2, 4, 8],
            blanks: ["남편 서동", "달라지지 않았습니다"],
            blankPrompt: ["시간이 지나 공주는 소문을 퍼뜨린 사람이 ", "이었다는 사실을 알게 되었지만, 서동을 향한 마음은 ", "."],
            order: ["시간이 지나 공주는", "소문을 퍼뜨린 사람이 남편 서동이었다는 사실을", "알게 되었지만,", "서동을 향한 마음은 달라지지 않았습니다."],
            required: ["공주", "소문", "서동", "마음"]
        },
        {
            id: 9,
            label: "백제의 왕",
            image: "c17-writing-cut-09.webp",
            alt: "서동이 백제의 왕이 된다",
            sentence: "훗날 서동은 공부하고 재산을 모아 백제의 왕이 되었습니다.",
            choices: [8, 0, 3, 5],
            blanks: ["공부하고 재산", "백제의 왕"],
            blankPrompt: ["훗날 서동은 ", "을 모아 ", "이 되었습니다."],
            order: ["훗날 서동은", "공부하고 재산을 모아", "백제의 왕이", "되었습니다."],
            required: ["서동", "공부", "재산", "왕"]
        }
    ];

    window.C17_WRITING_CUTS = cuts;

    const state = loadState();
    let selectedChoice = null;
    let filledBlanks = [];
    let selectedOrder = [];

    const els = {
        cutRail: document.getElementById("cutRail"),
        stageEyebrow: document.getElementById("stageEyebrow"),
        stageTitle: document.getElementById("stageTitle"),
        progressDots: document.getElementById("progressDots"),
        modeRow: document.getElementById("modeRow"),
        cutImage: document.getElementById("cutImage"),
        cutCaption: document.getElementById("cutCaption"),
        taskHeading: document.getElementById("taskHeading"),
        taskGuide: document.getElementById("taskGuide"),
        taskBody: document.getElementById("taskBody"),
        feedback: document.getElementById("feedback"),
        answerText: document.getElementById("answerText"),
        prevBtn: document.getElementById("prevBtn"),
        checkBtn: document.getElementById("checkBtn"),
        showAnswerBtn: document.getElementById("showAnswerBtn"),
        nextBtn: document.getElementById("nextBtn")
    };

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return {
                cutIndex: clamp(Number(saved.cutIndex) || 0, 0, cuts.length - 1),
                stageIndex: clamp(Number(saved.stageIndex) || 0, 0, stages.length - 1),
                done: saved.done && typeof saved.done === "object" ? saved.done : {}
            };
        } catch (error) {
            return { cutIndex: 0, stageIndex: 0, done: {} };
        }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function normalize(value) {
        return String(value || "")
            .replace(/[.?!,，。！？\s]/g, "")
            .trim();
    }

    function isStageDone(cutId, stageId) {
        return Boolean(state.done[`${cutId}:${stageId}`]);
    }

    function markStageDone() {
        const cut = cuts[state.cutIndex];
        const stage = stages[state.stageIndex];
        state.done[`${cut.id}:${stage.id}`] = true;
        saveState();
    }

    function render() {
        selectedChoice = null;
        filledBlanks = [];
        selectedOrder = [];
        els.feedback.textContent = "";
        els.feedback.className = "feedback";
        els.answerText.textContent = "";
        els.answerText.className = "answer-text";

        renderRail();
        renderStageNav();
        renderTask();
        updateButtons();
    }

    function renderRail() {
        els.cutRail.innerHTML = cuts.map((cut, index) => {
            const active = index === state.cutIndex ? " active" : "";
            const doneCount = stages.filter((stage) => isStageDone(cut.id, stage.id)).length;
            return `<button class="cut-pick${active}" type="button" data-cut-index="${index}">
                <span>${cut.id}</span>
                <span>${cut.label}<br><small>${doneCount}/${stages.length} 완료</small></span>
            </button>`;
        }).join("");
    }

    function renderStageNav() {
        const cut = cuts[state.cutIndex];
        const stage = stages[state.stageIndex];

        els.stageEyebrow.textContent = `Cut ${cut.id} · Step ${state.stageIndex + 1}`;
        els.stageTitle.textContent = stage.title;
        els.progressDots.innerHTML = stages.map((item, index) => {
            const done = isStageDone(cut.id, item.id) ? " done" : "";
            const active = index === state.stageIndex ? " active" : "";
            return `<button class="dot${done}${active}" type="button" data-stage-index="${index}" aria-label="${item.title}">${index + 1}</button>`;
        }).join("");
        els.modeRow.innerHTML = stages.map((item, index) => {
            const active = index === state.stageIndex ? " active" : "";
            return `<button class="${active}" type="button" data-stage-index="${index}">${item.short}</button>`;
        }).join("");
    }

    function renderTask() {
        const cut = cuts[state.cutIndex];
        const stage = stages[state.stageIndex];

        els.cutImage.src = ASSET_BASE + cut.image;
        els.cutImage.alt = `${cut.id}컷, ${cut.alt}`;
        els.cutCaption.textContent = `${cut.id}컷 · ${cut.label}`;
        els.taskHeading.textContent = stage.title;
        els.taskGuide.textContent = stage.guide;

        if (stage.id === "choice") {
            renderChoiceTask(cut);
        } else if (stage.id === "keyword") {
            renderKeywordTask(cut);
        } else if (stage.id === "order") {
            renderOrderTask(cut);
        } else {
            renderBlankTask(cut);
        }
    }

    function renderChoiceTask(cut) {
        const buttons = cut.choices.map((choiceIndex) => {
            const sentence = cuts[choiceIndex].sentence;
            return `<button class="choice" type="button" data-choice-index="${choiceIndex}">${sentence}</button>`;
        }).join("");
        els.taskBody.innerHTML = `<div class="choice-grid">${buttons}</div>`;
    }

    function renderKeywordTask(cut) {
        const choices = shuffle([...cut.blanks, ...getDistractors(cut)]).map((word) => (
            `<button class="token" type="button" data-keyword="${escapeAttr(word)}">${word}</button>`
        )).join("");
        els.taskBody.innerHTML = `
            <div class="sentence-box" id="keywordSentence">${renderBlankSentence(cut, [])}</div>
            <div class="token-row">${choices}</div>
        `;
    }

    function renderOrderTask(cut) {
        const choices = shuffle(cut.order).map((token) => (
            `<button class="token" type="button" data-order-token="${escapeAttr(token)}">${token}</button>`
        )).join("");
        els.taskBody.innerHTML = `
            <div class="sentence-box" id="orderSentence">선택한 조각이 여기에 쌓입니다.</div>
            <div class="token-row">${choices}</div>
        `;
    }

    function renderBlankTask(cut) {
        els.taskBody.innerHTML = `
            <div class="target-sentence">${renderBlankSentence(cut, cut.blanks.map((_, index) => `(${index + 1})`))}</div>
            <div class="input-grid">
                ${cut.blanks.map((_, index) => (
                    `<label>${index + 1}번 빈칸
                        <input type="text" data-blank-input="${index}" autocomplete="off">
                    </label>`
                )).join("")}
            </div>
        `;
    }

    function renderBlankSentence(cut, values) {
        return cut.blankPrompt.reduce((html, part, index) => {
            const slot = index < cut.blanks.length
                ? `<span class="blank-slot${values[index] ? " filled" : ""}" data-slot="${index}">${values[index] || "빈칸"}</span>`
                : "";
            return html + part + slot;
        }, "");
    }

    function getDistractors(cut) {
        const pool = ["궁궐", "소문", "공주", "서동", "노래", "재산", "시골", "결국"];
        return pool.filter((word) => !cut.blanks.some((answer) => answer.includes(word))).slice(0, 3);
    }

    function shuffle(items) {
        return items
            .map((item, index) => ({ item, order: ((index + 3) * 17) % 11 }))
            .sort((a, b) => a.order - b.order)
            .map((entry) => entry.item);
    }

    function escapeAttr(value) {
        return String(value).replace(/"/g, "&quot;");
    }

    function updateButtons() {
        els.prevBtn.disabled = state.cutIndex === 0 && state.stageIndex === 0;
        els.nextBtn.textContent = state.cutIndex === cuts.length - 1 && state.stageIndex === stages.length - 1 ? "마무리" : "다음 ";
        if (!(state.cutIndex === cuts.length - 1 && state.stageIndex === stages.length - 1)) {
            els.nextBtn.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-arrow-right"></i>');
        }
    }

    function setFeedback(message, good) {
        els.feedback.textContent = message;
        els.feedback.className = good ? "feedback good" : "feedback bad";
        if (good) {
            markStageDone();
            renderStageNav();
            renderRail();
        }
    }

    function checkAnswer() {
        const cut = cuts[state.cutIndex];
        const stage = stages[state.stageIndex];

        if (stage.id === "choice") {
            const good = selectedChoice === state.cutIndex;
            paintChoiceResult(cut);
            setFeedback(good ? "정답입니다. 컷의 사건과 문장이 잘 맞습니다." : "다시 확인해 보세요. 그림 속 사건과 문장의 중심 인물을 비교하세요.", good);
        } else if (stage.id === "keyword") {
            const good = cut.blanks.every((answer, index) => normalize(answer) === normalize(filledBlanks[index]));
            setFeedback(good ? "좋아요. 핵심어가 문장 안에 자연스럽게 들어갔습니다." : "아직 빈칸이 맞지 않습니다. 원문 문장의 핵심어를 다시 골라 보세요.", good);
        } else if (stage.id === "order") {
            const good = cut.order.every((answer, index) => answer === selectedOrder[index]);
            setFeedback(good ? "어순이 맞습니다." : "순서를 다시 살펴보세요. 시간 흐름과 조사에 주의하면 좋아요.", good);
        } else if (stage.id === "blank") {
            const values = Array.from(document.querySelectorAll("[data-blank-input]")).map((input) => input.value);
            const good = cut.blanks.every((answer, index) => normalize(answer) === normalize(values[index]));
            setFeedback(good ? "빈칸을 정확히 썼습니다." : "빈칸 표현을 다시 확인하세요. 띄어쓰기는 크게 보지 않지만 핵심 낱말은 맞아야 합니다.", good);
        }
    }

    function paintChoiceResult(cut) {
        document.querySelectorAll("[data-choice-index]").forEach((button) => {
            const index = Number(button.dataset.choiceIndex);
            button.classList.toggle("correct", index === state.cutIndex);
            button.classList.toggle("wrong", index === selectedChoice && index !== state.cutIndex);
        });
    }

    function showAnswer() {
        const cut = cuts[state.cutIndex];
        els.answerText.textContent = cut.sentence;
        els.answerText.className = "answer-text open";
    }

    function goNext() {
        if (state.stageIndex < stages.length - 1) {
            state.stageIndex += 1;
        } else if (state.cutIndex < cuts.length - 1) {
            state.cutIndex += 1;
            state.stageIndex = 0;
        } else {
            setFeedback("마지막 컷까지 도착했습니다. 필요한 컷을 다시 골라 복습해 보세요.", true);
            return;
        }
        saveState();
        render();
    }

    function goPrev() {
        if (state.stageIndex > 0) {
            state.stageIndex -= 1;
        } else if (state.cutIndex > 0) {
            state.cutIndex -= 1;
            state.stageIndex = stages.length - 1;
        }
        saveState();
        render();
    }

    function bindEvents() {
        document.addEventListener("click", (event) => {
            const cutButton = event.target.closest("[data-cut-index]");
            if (cutButton) {
                state.cutIndex = Number(cutButton.dataset.cutIndex);
                state.stageIndex = 0;
                saveState();
                render();
                return;
            }

            const stageButton = event.target.closest("[data-stage-index]");
            if (stageButton) {
                state.stageIndex = Number(stageButton.dataset.stageIndex);
                saveState();
                render();
                return;
            }

            const choice = event.target.closest("[data-choice-index]");
            if (choice) {
                selectedChoice = Number(choice.dataset.choiceIndex);
                document.querySelectorAll("[data-choice-index]").forEach((button) => button.classList.remove("selected", "correct", "wrong"));
                choice.classList.add("selected");
                els.feedback.textContent = "";
                els.feedback.className = "feedback";
                return;
            }

            const keyword = event.target.closest("[data-keyword]");
            if (keyword) {
                const cut = cuts[state.cutIndex];
                if (filledBlanks.length >= cut.blanks.length) {
                    return;
                }
                filledBlanks.push(keyword.dataset.keyword);
                keyword.disabled = true;
                document.getElementById("keywordSentence").innerHTML = renderBlankSentence(cut, filledBlanks);
                return;
            }

            const orderToken = event.target.closest("[data-order-token]");
            if (orderToken) {
                selectedOrder.push(orderToken.dataset.orderToken);
                orderToken.disabled = true;
                document.getElementById("orderSentence").textContent = selectedOrder.join(" ");
            }
        });

        els.checkBtn.addEventListener("click", checkAnswer);
        els.showAnswerBtn.addEventListener("click", showAnswer);
        els.nextBtn.addEventListener("click", goNext);
        els.prevBtn.addEventListener("click", goPrev);
    }

    bindEvents();
    render();
})();
