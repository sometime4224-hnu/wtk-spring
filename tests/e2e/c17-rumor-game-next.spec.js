const { test, expect } = require("@playwright/test");

async function expectNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow).toBeFalsy();
}

async function expectCanvasHasScenePixels(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector("#gameCanvas");
    if (!canvas) {
      return false;
    }
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const points = [
      [0.12, 0.18],
      [0.38, 0.55],
      [0.64, 0.28],
      [0.82, 0.74]
    ];
    const colors = points.map(([xRatio, yRatio]) => {
      const x = Math.floor(canvas.width * xRatio);
      const y = Math.floor(canvas.height * yRatio);
      return Array.from(context.getImageData(x, y, 1, 1).data).join(",");
    });
    return new Set(colors).size >= 3 && colors.some((color) => !color.endsWith(",0"));
  });
}

async function movePlayerTo(page, x, y) {
  await page.evaluate(
    ({ nextX, nextY }) => {
      const state = window.RUMOR_GAME_NEXT.state;
      state.player.x = nextX;
      state.player.y = nextY;
      state.camera.x = Math.max(0, nextX - 480);
      state.camera.y = Math.max(0, nextY - 320);
    },
    { nextX: x, nextY: y }
  );
}

test("c17 rumor game NEXT renders and exposes vocabulary systems", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/c17/rumor-game-next/") && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/c17/rumor-game-next/");
  await expect(page).toHaveTitle("소문 마을 NEXT");
  await expect(page.locator("#gameCanvas")).toBeVisible();
  await expect(page.locator("#miniMap")).toBeVisible();
  await expect(page.locator("#missionTitle")).toContainText("오해");
  await expect(page.locator("#expressionList li")).toHaveCount(11);
  await expect(page.locator("#actionLog")).toContainText("소문");
  await expectCanvasHasScenePixels(page);
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("c17 rumor game NEXT lets player resolve an NPC with possibility and emotion expressions", async ({ page }) => {
  await page.goto("/c17/rumor-game-next/");
  const firstNpc = await page.evaluate(() => {
    const npc = window.RUMOR_GAME_NEXT.state.npcs[0];
    return { x: npc.x, y: npc.y, answer: npc.answer, id: npc.id };
  });

  await movePlayerTo(page, firstNpc.x, firstNpc.y);
  await page.keyboard.press("Space");
  await expect(page.locator("#dialogue")).toBeVisible();
  await expect(page.locator("#dialogueStep")).toContainText("가능성");
  await expect(page.locator("#dialogueText")).toContainText("저를 싫어하는 것 같아요");
  await expect(page.locator("#dialogueClue")).toContainText("어떤 대답이 자연스러울까요");
  await expect(page.locator("[data-expression]")).toHaveCount(2);
  await expect(page.locator('[data-expression="no-reason"]')).toContainText("그럴 리가 없어요");
  await page.locator('[data-expression="possible"]').click();
  const wrongFeedback = await page.evaluate((npcId) => {
    const state = window.RUMOR_GAME_NEXT.state;
    const npc = state.npcs.find((item) => item.id === npcId);
    return {
      mood: npc.mood,
      cueKinds: state.visualCues.map((cue) => cue.kind)
    };
  }, firstNpc.id);
  expect(wrongFeedback.mood).toBe("confused");
  expect(wrongFeedback.cueKinds).toContain("confused");
  await page.locator(`[data-expression="${firstNpc.answer}"]`).click();
  await expect(page.locator("#dialogueStep")).toContainText("감정");
  await expect(page.locator("[data-repair]")).toHaveCount(2);
  await page.locator('[data-repair="solve"]').click();

  const result = await page.evaluate((npcId) => {
    const npc = window.RUMOR_GAME_NEXT.state.npcs.find((item) => item.id === npcId);
    return {
      status: npc.status,
      emotion: npc.emotion,
      mood: npc.mood,
      cueKinds: window.RUMOR_GAME_NEXT.state.visualCues.map((cue) => cue.kind),
      allies: window.RUMOR_GAME_NEXT.state.npcs.filter((item) => item.status === "ally").length,
      log: window.RUMOR_GAME_NEXT.state.actionLog[0]
    };
  }, firstNpc.id);
  expect(result.status).toBe("ally");
  expect(result.emotion).toBe("화해하다");
  expect(result.mood).toBe("relieved");
  expect(result.cueKinds).toEqual(expect.arrayContaining(["heart", "spark"]));
  expect(result.allies).toBe(1);
  expect(result.log).toContain("오해를 풀다");
});

test("c17 rumor game NEXT lets allies request emotional support and improve efficiency", async ({ page }) => {
  await page.goto("/c17/rumor-game-next/");
  const allyInfo = await page.evaluate(() => {
    const state = window.RUMOR_GAME_NEXT.state;
    const npc = state.npcs[0];
    npc.status = "ally";
    npc.allyLevel = 1;
    npc.distressed = true;
    npc.supportNeed = {
      id: "test-support",
      answer: "disappointed",
      line: "소문 슬라임이 계속 와요. 조금 실망했어요.",
      clue: "기대와 달라서 마음이 상한 상태입니다."
    };
    state.slimes.push(window.RUMOR_GAME_NEXT.actions.createSlime(npc.x + 20, npc.y + 20, npc.id, 55));
    return { x: npc.x, y: npc.y, id: npc.id };
  });

  await movePlayerTo(page, allyInfo.x, allyInfo.y);
  await page.keyboard.press("Space");
  await expect(page.locator("#dialogue")).toBeVisible();
  await expect(page.locator("#dialogueStep")).toContainText("감정 다스리기");
  await expect(page.locator("#dialogueText")).toContainText("실망했어요");
  await expect(page.locator("[data-repair]")).toHaveCount(3);
  await expect(page.locator('[data-repair="disappointed"]')).toContainText("실망했어요");
  await page.locator('[data-repair="disappointed"]').click();

  const result = await page.evaluate((npcId) => {
    const npc = window.RUMOR_GAME_NEXT.state.npcs.find((item) => item.id === npcId);
    return {
      allyLevel: npc.allyLevel,
      distressed: npc.distressed,
      mood: npc.mood,
      cueKinds: window.RUMOR_GAME_NEXT.state.visualCues.map((cue) => cue.kind),
      log: window.RUMOR_GAME_NEXT.state.actionLog[0]
    };
  }, allyInfo.id);
  expect(result.allyLevel).toBe(2);
  expect(result.distressed).toBeFalsy();
  expect(result.mood).toBe("confident");
  expect(result.cueKinds).toContain("level");
  expect(result.log).toContain("우군 효율 Lv.2");
});

test("c17 rumor game NEXT shows villain spreading rumors through a whisper loop", async ({ page }) => {
  await page.goto("/c17/rumor-game-next/");
  const targetInfo = await page.evaluate(() => {
    const state = window.RUMOR_GAME_NEXT.state;
    const target = state.npcs[1];
    state.slimes = [];
    state.rumorMotes = [];
    state.villain.x = target.x - 70;
    state.villain.y = target.y - 18;
    state.villain.targetId = target.id;
    state.villain.mode = "seeking";
    state.villain.cooldown = 0;
    return { id: target.id };
  });

  await page.waitForFunction(() => window.RUMOR_GAME_NEXT.state.villain.mode === "whisper");
  await page.waitForFunction(() => {
    const state = window.RUMOR_GAME_NEXT.state;
    const target = state.npcs.find((npc) => npc.id === state.villain.targetId);
    return target && target.whisperProgress > 0.15 && target.whisperProgress < 1;
  });
  const whisperState = await page.evaluate(() => {
    const state = window.RUMOR_GAME_NEXT.state;
    const target = state.npcs.find((npc) => npc.id === state.villain.targetId);
    return {
      mode: state.villain.mode,
      targetProgress: target?.whisperProgress ?? 0
    };
  });
  expect(whisperState.mode).toBe("whisper");
  expect(whisperState.targetProgress).toBeGreaterThan(0.15);
  expect(whisperState.targetProgress).toBeLessThan(1);

  await page.waitForFunction(() => window.RUMOR_GAME_NEXT.state.slimes.length >= 2);
  const spreadResult = await page.evaluate((npcId) => {
    const state = window.RUMOR_GAME_NEXT.state;
    const target = state.npcs.find((npc) => npc.id === npcId);
    return {
      slimes: state.slimes.length,
      doubt: target.doubt,
      targetMood: target.mood,
      villainMood: state.villain.mood,
      cueKinds: state.visualCues.map((cue) => cue.kind),
      log: state.actionLog[0]
    };
  }, targetInfo.id);
  expect(spreadResult.slimes).toBeGreaterThanOrEqual(2);
  expect(spreadResult.doubt).toBeGreaterThan(100);
  expect(spreadResult.targetMood).toBe("worried");
  expect(spreadResult.villainMood).toBe("smug");
  expect(spreadResult.cueKinds).toEqual(expect.arrayContaining(["rumor", "spawn"]));
  expect(spreadResult.log).toContain("빌런");
});

test("c17 rumor game NEXT supports direct rumor slime clearing", async ({ page }) => {
  await page.goto("/c17/rumor-game-next/");
  const slime = await page.evaluate(() => {
    const target = window.RUMOR_GAME_NEXT.state.slimes[0];
    target.x = 260;
    target.y = 520;
    return { x: target.x, y: target.y, before: window.RUMOR_GAME_NEXT.state.slimes.length };
  });
  await movePlayerTo(page, slime.x, slime.y);
  await page.keyboard.press("Space");

  const after = await page.evaluate(() => ({
    count: window.RUMOR_GAME_NEXT.state.slimes.length,
    playerMood: window.RUMOR_GAME_NEXT.state.player.mood,
    cueKinds: window.RUMOR_GAME_NEXT.state.visualCues.map((cue) => cue.kind),
    log: window.RUMOR_GAME_NEXT.state.actionLog[0]
  }));
  expect(after.count).toBeLessThan(slime.before);
  expect(after.playerMood).toBe("confirm");
  expect(after.cueKinds).toContain("clear");
  expect(after.log).toContain("직접 확인");
});
