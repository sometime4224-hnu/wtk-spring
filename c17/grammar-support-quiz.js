(function () {
    "use strict";

    const config = window.C17_GRAMMAR_SUPPORT;

    if (!config) {
        return;
    }

    const els = {
        stageNav: document.getElementById("stageNav"),
        stageList: document.getElementById("stageList"),
        quizPanel: document.getElementById("quizPanel"),
        stageLabel: document.getElementById("stageLabel"),
        stageTitle: document.getElementById("stageTitle"),
        stageFocus: document.getElementById("stageFocus"),
        questionCount: document.getElementById("questionCount"),
        progressBar: document.getElementById("progressBar"),
        contextGrid: document.getElementById("contextGrid"),
        contextKo: document.getElementById("contextKo"),
        contextVi: document.getElementById("contextVi"),
        prompt: document.getElementById("prompt"),
        hint: document.getElementById("hint"),
        choices: document.getElementById("choices"),
        feedback: document.getElementById("feedback"),
        nextBtn: document.getElementById("nextBtn"),
        resetBtn: document.getElementById("resetBtn"),
        resultCard: document.getElementById("resultCard")
    };

    const state = {
        stageIndex: 0,
        questionIndex: 0,
        unlockedStage: 0,
        selectedAnswers: config.stages.map(function (stage) {
            return stage.questions.map(function () {
                return null;
            });
        })
    };

    window.C17_GRAMMAR_SUPPORT_APP = {
        state: state,
        getCurrentQuestion: function () {
            return getCurrentQuestion();
        }
    };

    function getCurrentStage() {
        return config.stages[state.stageIndex];
    }

    function getCurrentQuestion() {
        return getCurrentStage().questions[state.questionIndex];
    }

    function getStageAnsweredCount(stageIndex) {
        return state.selectedAnswers[stageIndex].filter(function (answer) {
            return answer !== null;
        }).length;
    }

    function getStageScore(stageIndex) {
        return state.selectedAnswers[stageIndex].reduce(function (score, selected, questionIndex) {
            return score + (selected === config.stages[stageIndex].questions[questionIndex].answer ? 1 : 0);
        }, 0);
    }

    function getTotalScore() {
        return config.stages.reduce(function (total, _stage, stageIndex) {
            return total + getStageScore(stageIndex);
        }, 0);
    }

    function getTotalQuestions() {
        return config.stages.reduce(function (total, stage) {
            return total + stage.questions.length;
        }, 0);
    }

    function renderStageNav() {
        els.stageNav.innerHTML = "";

        config.stages.forEach(function (stage, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "stage-step" + (index === state.stageIndex ? " is-active" : "");
            button.disabled = index > state.unlockedStage;
            button.innerHTML = "<span>" + stage.label + "</span>" + stage.title;
            button.addEventListener("click", function () {
                state.stageIndex = index;
                state.questionIndex = getStageAnsweredCount(index) < stage.questions.length
                    ? getStageAnsweredCount(index)
                    : 0;
                renderQuestion();
            });
            els.stageNav.appendChild(button);
        });
    }

    function renderStageList() {
        if (!els.stageList) {
            return;
        }

        els.stageList.innerHTML = "";

        config.stages.forEach(function (stage, index) {
            const card = document.createElement("article");
            card.className = "stage-card" + (index === state.stageIndex ? " is-active" : "");

            const answered = getStageAnsweredCount(index);
            const score = getStageScore(index);
            card.innerHTML = ""
                + "<p class=\"eyebrow\">" + stage.label + "</p>"
                + "<h3>" + stage.title + "</h3>"
                + "<p>" + stage.focus + "</p>"
                + "<span class=\"stage-score\">" + score + " / " + stage.questions.length + " 정답 · " + answered + "문항 완료</span>";
            els.stageList.appendChild(card);
        });
    }

    function renderContext(question) {
        const hasContext = Boolean(question.contextKo || question.contextVi);
        els.contextGrid.hidden = !hasContext;

        if (!hasContext) {
            els.contextKo.textContent = "";
            els.contextVi.textContent = "";
            return;
        }

        els.contextKo.textContent = question.contextKo || "";
        els.contextVi.textContent = question.contextVi || "";
    }

    function renderChoices(question) {
        const selected = state.selectedAnswers[state.stageIndex][state.questionIndex];
        const hasAnswered = selected !== null;
        els.choices.innerHTML = "";

        question.choices.forEach(function (choice, choiceIndex) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "choice-btn";
            button.textContent = choice;

            if (hasAnswered) {
                button.disabled = true;
                if (choiceIndex === question.answer) {
                    button.classList.add("is-correct");
                } else if (choiceIndex === selected) {
                    button.classList.add("is-wrong");
                } else {
                    button.classList.add("is-dimmed");
                }
            } else {
                button.addEventListener("click", function () {
                    chooseAnswer(choiceIndex);
                });
            }

            els.choices.appendChild(button);
        });
    }

    function renderFeedback(question) {
        const selected = state.selectedAnswers[state.stageIndex][state.questionIndex];

        if (selected === null) {
            els.feedback.className = "feedback";
            els.feedback.textContent = "";
            return;
        }

        const isCorrect = selected === question.answer;
        els.feedback.className = "feedback is-visible " + (isCorrect ? "is-correct" : "is-wrong");
        els.feedback.innerHTML = "<strong>" + (isCorrect ? "정답!" : "다시 확인!") + "</strong> " + question.feedback;
    }

    function renderQuestion() {
        const stage = getCurrentStage();
        const question = getCurrentQuestion();
        const answered = getStageAnsweredCount(state.stageIndex);
        const selected = state.selectedAnswers[state.stageIndex][state.questionIndex];
        const isLastQuestion = state.questionIndex === stage.questions.length - 1;
        const isLastStage = state.stageIndex === config.stages.length - 1;

        els.quizPanel.hidden = false;
        els.resultCard.classList.remove("is-visible");
        els.resultCard.innerHTML = "";

        els.stageLabel.textContent = stage.label;
        els.stageTitle.textContent = stage.title;
        els.stageFocus.innerHTML = stage.focus;
        els.questionCount.textContent = (state.questionIndex + 1) + " / " + stage.questions.length;
        els.progressBar.style.width = Math.round((answered / stage.questions.length) * 100) + "%";
        els.prompt.innerHTML = question.prompt;
        els.hint.innerHTML = question.hint || "";

        renderContext(question);
        renderChoices(question);
        renderFeedback(question);
        renderStageNav();
        renderStageList();

        els.nextBtn.disabled = selected === null;
        if (isLastQuestion && isLastStage) {
            els.nextBtn.innerHTML = "결과 보기 <i class=\"fa-solid fa-check\"></i>";
        } else if (isLastQuestion) {
            els.nextBtn.innerHTML = "다음 단계 <i class=\"fa-solid fa-arrow-right\"></i>";
        } else {
            els.nextBtn.innerHTML = "다음 문제 <i class=\"fa-solid fa-arrow-right\"></i>";
        }
    }

    function chooseAnswer(choiceIndex) {
        state.selectedAnswers[state.stageIndex][state.questionIndex] = choiceIndex;
        renderQuestion();
    }

    function goNext() {
        const stage = getCurrentStage();
        const isLastQuestion = state.questionIndex === stage.questions.length - 1;
        const isLastStage = state.stageIndex === config.stages.length - 1;

        if (!isLastQuestion) {
            state.questionIndex += 1;
            renderQuestion();
            return;
        }

        if (!isLastStage) {
            state.stageIndex += 1;
            state.unlockedStage = Math.max(state.unlockedStage, state.stageIndex);
            state.questionIndex = 0;
            renderQuestion();
            return;
        }

        renderFinalResult();
    }

    function resetCurrentStage() {
        state.selectedAnswers[state.stageIndex] = getCurrentStage().questions.map(function () {
            return null;
        });
        state.questionIndex = 0;
        renderQuestion();
    }

    function resetAll() {
        state.stageIndex = 0;
        state.questionIndex = 0;
        state.unlockedStage = 0;
        state.selectedAnswers = config.stages.map(function (stage) {
            return stage.questions.map(function () {
                return null;
            });
        });
        window.C17_GRAMMAR_SUPPORT_APP.state = state;
        renderQuestion();
    }

    function renderFinalResult() {
        const total = getTotalQuestions();
        const score = getTotalScore();
        const percent = Math.round((score / total) * 100);

        els.quizPanel.hidden = true;
        renderStageNav();
        renderStageList();

        const stageItems = config.stages.map(function (stage, index) {
            return "<li>" + stage.label + " " + stage.title + ": " + getStageScore(index) + " / " + stage.questions.length + "</li>";
        }).join("");

        els.resultCard.classList.add("is-visible");
        els.resultCard.innerHTML = ""
            + "<p class=\"eyebrow\">완료</p>"
            + "<h2>" + score + " / " + total + " 정답</h2>"
            + "<p>정답률은 " + percent + "%입니다. 1단계 뜻, 2단계 모양, 3단계 문맥 순서로 다시 보면 더 잘 기억할 수 있어요.</p>"
            + "<ul class=\"result-list\">" + stageItems + "</ul>"
            + "<button id=\"restartQuizBtn\" class=\"next-btn\" type=\"button\"><i class=\"fa-solid fa-rotate-left\"></i> 처음부터 다시</button>";

        document.getElementById("restartQuizBtn").addEventListener("click", resetAll);
    }

    els.nextBtn.addEventListener("click", goNext);
    els.resetBtn.addEventListener("click", resetCurrentStage);

    renderQuestion();
})();
