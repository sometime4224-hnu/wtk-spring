const { test, expect } = require("@playwright/test");

async function blockExternalRequests(page) {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("https://cdnjs.cloudflare.com/**", (route) => route.abort());
}

async function answerCurrentQuestion(page) {
  const answerText = await page.evaluate(() => {
    const question = window.C17_GRAMMAR_SUPPORT_APP.getCurrentQuestion();
    return question.choices[question.answer];
  });

  await page.getByRole("button", { name: answerText, exact: true }).click();
  await expect(page.locator("#feedback")).toContainText("정답");
  await expect(page.locator("#nextBtn")).toBeEnabled();
}

test("c17 grammar support quizzes are linked from chapter and grammar pages", async ({ page }) => {
  await blockExternalRequests(page);

  await page.goto("/c17/index.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href="grammar1-support-quiz.html"]')).toContainText("V-고 보니 3단계 퀴즈");
  await expect(page.locator('a[href="grammar2-support-quiz.html"]')).toContainText("척하다 3단계 퀴즈");

  await page.goto("/c17/grammar1.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator('.footer-nav a[href="grammar1-support-quiz.html"]')).toContainText("보조 퀴즈");

  await page.goto("/c17/grammar2.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator('.footer-nav a[href="grammar2-support-quiz.html"]')).toContainText("보조 퀴즈");
});

test("c17 grammar support quizzes use three scaffold stages and complete correctly", async ({ page }) => {
  await blockExternalRequests(page);

  const pages = [
    ["/c17/grammar1-support-quiz.html", "문법 1 보조 퀴즈: V-고 보니"],
    ["/c17/grammar2-support-quiz.html", "문법 2 보조 퀴즈: A-(으)ㄴ/V-는 척하다"]
  ];

  for (const [url, heading] of pages) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(heading);
    await expect(page.locator(".stage-step")).toHaveCount(3);
    await expect(page.locator("#stageList")).toHaveCount(0);
    await expect(page.locator("#contextGrid")).toContainText("Tiếng Việt");

    const structure = await page.evaluate(() => {
      const answerCounts = [0, 0, 0, 0];
      const contrastCount = window.C17_GRAMMAR_SUPPORT.stages.reduce((count, stage) => {
        return count + stage.questions.filter((question) => question.contrast).length;
      }, 0);
      const contextCount = window.C17_GRAMMAR_SUPPORT.stages.reduce((count, stage) => {
        return count + stage.questions.filter((question) => question.contextKo && question.contextVi).length;
      }, 0);
      const meaningQuestion = window.C17_GRAMMAR_SUPPORT.stages[0].questions.find((question) => {
        return question.prompt.includes("언제 써요") || question.prompt.includes("무슨 뜻");
      });

      window.C17_GRAMMAR_SUPPORT.stages.forEach((stage) => {
        stage.questions.forEach((question) => {
          answerCounts[question.answer] += 1;
        });
      });

      return {
        stages: window.C17_GRAMMAR_SUPPORT.stages.length,
        questionCounts: window.C17_GRAMMAR_SUPPORT.stages.map((stage) => stage.questions.length),
        answerCounts,
        contextCount,
        contrastCount,
        hasVietnameseMeaningChoices: meaningQuestion.choices.every((choice) => choice.includes("(") && choice.includes(")"))
      };
    });

    expect(structure.stages).toBe(3);
    expect(structure.questionCounts).toEqual([4, 4, 4]);
    expect(structure.answerCounts).toEqual([3, 3, 3, 3]);
    expect(structure.contextCount).toBeGreaterThanOrEqual(6);
    expect(structure.contrastCount).toBe(2);
    expect(structure.hasVietnameseMeaningChoices).toBe(true);

    for (let index = 0; index < 12; index += 1) {
      await expect(page.locator("#stageFocus")).not.toContainText("<code>");
      await expect(page.locator("#prompt")).not.toContainText("<code>");
      await expect(page.locator("#hint")).not.toContainText("<code>");
      await answerCurrentQuestion(page);
      await page.locator("#nextBtn").click();
    }

    await expect(page.locator("#resultCard")).toContainText("12 / 12 정답");
  }
});

test("c17 grammar support quizzes use a compact phone portrait layout", async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/c17/grammar1-support-quiz.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#stageList")).toHaveCount(0);
  await expect(page.locator(".stage-step")).toHaveCount(3);

  const layout = await page.evaluate(() => {
    const stageButtons = Array.from(document.querySelectorAll(".stage-step")).map((button) => button.getBoundingClientRect());
    const quizPanel = document.querySelector("#quizPanel").getBoundingClientRect();
    const actions = document.querySelector(".actions").getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    return {
      sameRow: stageButtons.every((box) => Math.abs(box.top - stageButtons[0].top) < 2),
      stageHeight: document.querySelector("#stageNav").getBoundingClientRect().height,
      quizFits: quizPanel.left >= 0 && quizPanel.right <= viewportWidth,
      actionsFits: actions.left >= 0 && actions.right <= viewportWidth
    };
  });

  expect(layout.sameRow).toBe(true);
  expect(layout.stageHeight).toBeLessThan(80);
  expect(layout.quizFits).toBe(true);
  expect(layout.actionsFits).toBe(true);
});
