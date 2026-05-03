(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const miniMap = document.getElementById("miniMap");
  const miniCtx = miniMap.getContext("2d");

  const refs = {
    missionTitle: document.getElementById("missionTitle"),
    missionDetail: document.getElementById("missionDetail"),
    spreadText: document.getElementById("spreadText"),
    allyText: document.getElementById("allyText"),
    allyTotalText: document.getElementById("allyTotalText"),
    slimeText: document.getElementById("slimeText"),
    spreadFill: document.getElementById("spreadFill"),
    spreadHint: document.getElementById("spreadHint"),
    expressionList: document.getElementById("expressionList"),
    actionLog: document.getElementById("actionLog"),
    prompt: document.getElementById("prompt"),
    toast: document.getElementById("toast"),
    dialogue: document.getElementById("dialogue"),
    speakerName: document.getElementById("speakerName"),
    dialogueStep: document.getElementById("dialogueStep"),
    dialogueText: document.getElementById("dialogueText"),
    dialogueClue: document.getElementById("dialogueClue"),
    dialogueOptions: document.getElementById("dialogueOptions"),
    finishCard: document.getElementById("finishCard"),
    finishSummary: document.getElementById("finishSummary"),
    restartButton: document.getElementById("restartButton")
  };

  const WORLD = { width: 1660, height: 1060 };
  const INTERACT_RANGE = 72;
  const DIRECT_CLEAR_RANGE = 64;
  const CLEAN_RADIUS = 180;
  const VILLAIN_SPEED = 126;
  const WHISPER_DURATION = 2.1;
  const MAX_SLIMES = 34;
  const ALLY_MAX_LEVEL = 3;

  const possibilityExpressions = [
    {
      id: "no-reason",
      label: "그럴 리가 없다",
      speech: "그럴 리가 없어요",
      short: "불가능",
      meaning: "가능성이 거의 없다고 판단할 때",
      color: "#be123c"
    },
    {
      id: "hard-to-believe",
      label: "믿어지지 않다",
      speech: "믿어지지 않아요",
      short: "불신",
      meaning: "놀랍거나 받아들이기 어려울 때",
      color: "#b45309"
    },
    {
      id: "possible",
      label: "그럴 수 있다",
      speech: "그럴 수 있어요",
      short: "가능",
      meaning: "그럴 가능성을 인정할 때",
      color: "#0f766e"
    },
    {
      id: "certain",
      label: "틀림없다",
      speech: "틀림없어요",
      short: "확실",
      meaning: "근거가 충분해 확신할 때",
      color: "#4f46e5"
    }
  ];

  const repairExpressions = [
    {
      id: "disappointed",
      label: "실망하다",
      speech: "실망했어요",
      short: "감정",
      meaning: "기대와 달라 마음이 상한 상태",
      color: "#e11d48"
    },
    {
      id: "argue",
      label: "다투다",
      speech: "다퉜어요",
      short: "갈등",
      meaning: "서로 말이나 행동으로 싸우는 상태",
      color: "#dc2626"
    },
    {
      id: "misunderstand",
      label: "오해하다",
      speech: "오해했어요",
      short: "오해",
      meaning: "상황을 잘못 이해한 상태",
      color: "#7c3aed"
    },
    {
      id: "solve",
      label: "오해를 풀다",
      speech: "오해를 풀어요",
      short: "해결",
      meaning: "잘못 이해한 것을 바로잡기",
      color: "#0f766e"
    },
    {
      id: "reconcile",
      label: "화해하다",
      speech: "화해해요",
      short: "회복",
      meaning: "다툰 뒤 관계를 다시 좋게 하기",
      color: "#047857"
    }
  ];

  const rumorWords = [
    "소문이 나다",
    "소문이 퍼지다",
    "소문을 내다",
    "소문을 퍼뜨리다",
    "오해하다",
    "믿어지지 않다"
  ];

  const supportScenarios = [
    {
      id: "support-disappointed",
      answer: "disappointed",
      line: "소문 슬라임이 계속 와요. 조금 실망했어요.",
      clue: "기대와 달라서 마음이 상한 상태입니다."
    },
    {
      id: "support-argue",
      answer: "argue",
      line: "소문 때문에 친구와 다퉜어요. 마음이 복잡해요.",
      clue: "서로 말로 싸운 상태입니다."
    },
    {
      id: "support-misunderstand",
      answer: "misunderstand",
      line: "제가 또 잘못 들은 것 같아요. 헷갈려요.",
      clue: "상황을 잘못 이해한 상태입니다."
    },
    {
      id: "support-reconcile",
      answer: "reconcile",
      line: "이제 다시 같이 돕고 싶어요. 사이좋게 지낼 수 있죠?",
      clue: "관계를 다시 좋게 만드는 표현입니다."
    }
  ];

  const npcSeeds = [
    {
      id: "minji",
      name: "민지",
      x: 410,
      y: 390,
      color: "#f97316",
      emotion: "실망하다",
      rumor: "주인공이 약속에 안 왔어요. 저를 싫어하는 것 같아요.",
      clue: "주인공은 아팠어요.",
      answer: "no-reason",
      repairText: "아파서 못 온 거예요. 저를 싫어한 건 아니에요."
    },
    {
      id: "junho",
      name: "준호",
      x: 940,
      y: 340,
      color: "#2563eb",
      emotion: "오해하다",
      rumor: "주인공이 제 파일을 숨겼어요. 저를 도와주기 싫은 것 같아요.",
      clue: "파일은 같은 폴더에 있어요. 이름만 바뀌었어요.",
      answer: "no-reason",
      repairText: "파일이 그대로 있어요. 숨긴 게 아니에요."
    },
    {
      id: "sua",
      name: "수아",
      x: 1230,
      y: 690,
      color: "#db2777",
      emotion: "다투다",
      rumor: "주인공이 제 이야기를 퍼뜨렸어요. 솔직히 믿어지지 않아요.",
      clue: "다른 사람이 말을 잘못 전했어요.",
      answer: "hard-to-believe",
      repairText: "맞아요. 직접 확인하기 전에는 믿기 어려워요."
    },
    {
      id: "akira",
      name: "아키라",
      x: 650,
      y: 800,
      color: "#059669",
      emotion: "오해하다",
      rumor: "주인공이 비밀 글을 썼어요. 그 사람이 쓴 게 틀림없어요.",
      clue: "그 시간에 주인공은 선생님과 같이 있었어요.",
      answer: "no-reason",
      repairText: "시간이 맞지 않아요. 주인공이 쓴 게 아니에요."
    },
    {
      id: "hana",
      name: "하나",
      x: 1370,
      y: 260,
      color: "#7c3aed",
      emotion: "실망하다",
      rumor: "주인공이 저를 도와주려고 했대요. 정말인지 모르겠어요.",
      clue: "선생님이 방금 주인공이 도와준다고 분명히 말했어요.",
      answer: "certain",
      repairText: "선생님이 확인했어요. 도와주려고 한 게 맞아요."
    }
  ];

  const keys = new Set();

  function createInitialState() {
    const npcs = npcSeeds.map((npc, index) => ({
      ...npc,
      status: "misled",
      doubt: 100,
      mood: "worried",
      moodTimer: 0,
      allyLevel: 0,
      allyPulse: 0,
      distressed: false,
      distressTimer: 0,
      supportIndex: index % supportScenarios.length,
      supportNeed: null,
      whisperProgress: 0,
      cleanTimer: 0.9 + index * 0.35
    }));

    return {
      running: true,
      time: 0,
      won: false,
      camera: { x: 0, y: 0 },
      player: { x: 240, y: 520, r: 18, speed: 248, face: 1, mood: "ready", moodTimer: 0 },
      villain: {
        x: 820,
        y: 156,
        r: 22,
        targetIndex: 0,
        targetId: null,
        mode: "seeking",
        whisperTimer: 0,
        moteTimer: 0,
        cooldown: 0,
        face: 1,
        wave: 0,
        mood: "smug",
        moodTimer: 0
      },
      npcs,
      slimes: npcs.slice(0, 1).flatMap((npc, index) => [
        createSlime(npc.x + 48, npc.y + 30, npc.id, index * 10),
        createSlime(npc.x - 38, npc.y - 42, npc.id, index * 10 + 1)
      ]),
      rumorMotes: [],
      pulses: [],
      particles: [],
      visualCues: [],
      actionLog: [
        "빌런이 주인공을 오해하고 NPC들에게 소문을 퍼뜨리기 시작했습니다."
      ],
      activeDialogue: null,
      toast: { text: "", timer: 0 },
      lastPrompt: ""
    };
  }

  let state = createInitialState();

  function createSlime(x, y, sourceId = "wild", seed = Math.random() * 1000) {
    const angle = (seed * 1.77) % (Math.PI * 2);
    const speed = 22 + (seed % 17);
    return {
      id: `slime-${Date.now()}-${Math.round(Math.random() * 100000)}-${seed}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 18 + (seed % 6),
      wobble: Math.random() * Math.PI * 2,
      bornTimer: 0.55,
      sourceId,
      word: rumorWords[Math.floor(Math.abs(seed)) % rumorWords.length],
      hp: 1
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function worldToScreen(point) {
    return { x: point.x - state.camera.x, y: point.y - state.camera.y };
  }

  function addLog(text) {
    state.actionLog.unshift(text);
    state.actionLog = state.actionLog.slice(0, 7);
  }

  function showToast(text) {
    state.toast = { text, timer: 2.6 };
  }

  function getExpression(id) {
    return possibilityExpressions.find((item) => item.id === id);
  }

  function getRepairExpression(id) {
    return repairExpressions.find((item) => item.id === id);
  }

  function getSupportNeed(npc) {
    if (!npc.supportNeed) {
      npc.supportNeed = supportScenarios[npc.supportIndex % supportScenarios.length];
      npc.supportIndex += 1;
    }
    return npc.supportNeed;
  }

  function getAllyCleanInterval(npc) {
    return Math.max(1.6, 5.2 - (npc.allyLevel - 1) * 1.7);
  }

  function getAllyCleanRadius(npc) {
    return 118 + npc.allyLevel * 44;
  }

  function getAllyClearCount(npc) {
    return npc.allyLevel >= ALLY_MAX_LEVEL ? 2 : 1;
  }

  function getAllyPower() {
    return state.npcs.reduce((total, npc) => total + (npc.status === "ally" ? npc.allyLevel : 0), 0);
  }

  function getDialogueOptionLimit() {
    const allies = state.npcs.filter((npc) => npc.status === "ally").length;
    if (allies <= 0) {
      return 2;
    }
    if (allies <= 2) {
      return 3;
    }
    return 4;
  }

  function getPossibilityOptions(answerId) {
    const optionPlan = {
      "no-reason": ["no-reason", "possible", "hard-to-believe", "certain"],
      "hard-to-believe": ["hard-to-believe", "certain", "no-reason", "possible"],
      possible: ["possible", "no-reason", "hard-to-believe", "certain"],
      certain: ["certain", "hard-to-believe", "possible", "no-reason"]
    };
    return (optionPlan[answerId] ?? possibilityExpressions.map((item) => item.id))
      .slice(0, getDialogueOptionLimit())
      .map(getExpression)
      .filter(Boolean);
  }

  function getSupportOptions(answerId) {
    const optionPlan = {
      disappointed: ["disappointed", "reconcile", "argue", "misunderstand"],
      argue: ["argue", "disappointed", "reconcile", "misunderstand"],
      misunderstand: ["misunderstand", "argue", "reconcile", "disappointed"],
      reconcile: ["reconcile", "disappointed", "misunderstand", "argue"],
      solve: ["solve", "reconcile", "misunderstand", "disappointed"]
    };
    return (optionPlan[answerId] ?? repairExpressions.map((item) => item.id))
      .slice(0, getDialogueOptionLimit())
      .map(getRepairExpression)
      .filter(Boolean);
  }

  function getRepairOptions() {
    const optionCount = Math.min(repairExpressions.length, getDialogueOptionLimit());
    const ids = ["solve", "misunderstand", "reconcile", "disappointed", "argue"].slice(0, optionCount);
    return ids.map(getRepairExpression).filter(Boolean);
  }

  function getNearbySlimes(point, range) {
    return state.slimes
      .map((slime) => ({ slime, dist: distance(point, slime) }))
      .filter((item) => item.dist <= range)
      .sort((a, b) => a.dist - b.dist)
      .map((item) => item.slime);
  }

  function getNearestNpc() {
    return state.npcs
      .map((npc) => ({ npc, dist: distance(state.player, npc) }))
      .filter((item) => item.dist <= INTERACT_RANGE)
      .sort((a, b) => a.dist - b.dist)[0]?.npc ?? null;
  }

  function getNearestSlime(range = DIRECT_CLEAR_RANGE) {
    return state.slimes
      .map((slime) => ({ slime, dist: distance(state.player, slime) }))
      .filter((item) => item.dist <= range)
      .sort((a, b) => a.dist - b.dist)[0]?.slime ?? null;
  }

  function removeSlime(slime, reason = "direct") {
    const index = state.slimes.indexOf(slime);
    if (index === -1) {
      return false;
    }
    state.slimes.splice(index, 1);
    spawnParticles(slime.x, slime.y, reason === "ally" ? "#0f766e" : "#f59e0b", 14);
    state.pulses.push({ x: slime.x, y: slime.y, r: 8, max: 58, color: reason === "ally" ? "#0f766e" : "#f59e0b", life: 0.45 });
    addVisualCue(slime.x, slime.y - 20, reason === "ally" ? "ally-clear" : "clear", reason === "ally" ? "#0f766e" : "#f59e0b", "✓", 0.95);
    return true;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 46 + Math.random() * 110;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.55,
        maxLife: 0.9,
        color
      });
    }
  }

  function addVisualCue(x, y, kind, color, label, life = 1.05) {
    state.visualCues.push({
      x,
      y,
      kind,
      color,
      label,
      life,
      maxLife: life,
      drift: randomBetween(-18, 18),
      size: randomBetween(0.9, 1.18)
    });
  }

  function setNpcMood(npc, mood, duration = 1.4) {
    npc.mood = mood;
    npc.moodTimer = Math.max(npc.moodTimer ?? 0, duration);
  }

  function setPlayerMood(mood, duration = 0.9) {
    state.player.mood = mood;
    state.player.moodTimer = duration;
  }

  function setVillainMood(mood, duration = 1.3) {
    state.villain.mood = mood;
    state.villain.moodTimer = duration;
  }

  function openDialogue(npc) {
    if (npc.status === "ally") {
      if (npc.distressed) {
        state.activeDialogue = {
          npcId: npc.id,
          step: "support"
        };
        renderDialogue();
        return;
      }
      showToast(`${npc.name}은 우군 Lv.${npc.allyLevel}입니다. 주변 소문을 천천히 정화합니다.`);
      state.pulses.push({ x: npc.x, y: npc.y, r: 14, max: getAllyCleanRadius(npc), color: "#0f766e", life: 0.8 });
      return;
    }

    state.activeDialogue = {
      npcId: npc.id,
      step: "possibility",
      selectedPossibility: null,
      missCount: 0,
      hint: ""
    };
    setNpcMood(npc, "listening", 1.6);
    addVisualCue(npc.x, npc.y - 70, "listen", "#7c3aed", "?", 0.9);
    renderDialogue();
  }

  function closeDialogue() {
    state.activeDialogue = null;
    refs.dialogue.classList.add("hidden");
  }

  function handleOption(kind, id) {
    const dialogue = state.activeDialogue;
    if (!dialogue) {
      return;
    }
    const npc = state.npcs.find((item) => item.id === dialogue.npcId);
    if (!npc) {
      closeDialogue();
      return;
    }

    if (kind === "possibility") {
      if (id === npc.answer) {
        dialogue.step = "repair";
        dialogue.selectedPossibility = id;
        dialogue.hint = "";
        setNpcMood(npc, "understanding", 1.3);
        addVisualCue(npc.x, npc.y - 70, "correct", "#0f766e", "✓", 1.1);
        state.pulses.push({ x: npc.x, y: npc.y, r: 10, max: 74, color: "#0f766e", life: 0.65 });
        showToast(`${getExpression(id).speech}: 단서를 보고 자연스럽게 대답했습니다.`);
        renderDialogue();
      } else {
        const correct = getExpression(npc.answer).speech;
        dialogue.missCount = (dialogue.missCount ?? 0) + 1;
        dialogue.hint = `다시 봐요: ${npc.clue} 이럴 때는 "${correct}"가 더 자연스러워요.`;
        npc.doubt = clamp(npc.doubt + 4, 0, 120);
        setNpcMood(npc, "confused", 1.8);
        addVisualCue(npc.x, npc.y - 70, "confused", "#7c3aed", "?", 1.15);
        state.pulses.push({ x: npc.x, y: npc.y, r: 10, max: 72, color: "#a855f7", life: 0.58 });
        if (dialogue.missCount >= 2) {
          const slime = createSlime(npc.x + 34, npc.y - 28, npc.id, state.time * 10);
          state.slimes.push(slime);
          addVisualCue(slime.x, slime.y - 30, "spawn", "#8b5cf6", "!", 1.1);
          addLog(`${npc.name}: 아직 걱정이 남아 소문 슬라임이 하나 늘었습니다. 힌트는 ${correct}.`);
        }
        showToast("조금 어색했어요. 단서를 보고 다시 말해 보세요.");
        renderDialogue();
      }
      return;
    }

    if (kind === "repair") {
      if (id === "solve") {
        resolveNpc(npc, dialogue.selectedPossibility);
      } else {
        dialogue.missCount = (dialogue.missCount ?? 0) + 1;
        dialogue.hint = "잘못 이해한 것을 바로잡을 때는 \"오해를 풀어요\"가 자연스러워요.";
        npc.doubt = clamp(npc.doubt + 3, 0, 120);
        setNpcMood(npc, "confused", 1.6);
        addVisualCue(npc.x, npc.y - 70, "confused", "#f59e0b", "?", 1.05);
        showToast("아직 오해가 남았어요. 다시 말해 보세요.");
        renderDialogue();
        return;
      }
      closeDialogue();
      return;
    }

    if (kind === "support") {
      const supportNeed = getSupportNeed(npc);
      if (id === supportNeed.answer) {
        sootheAlly(npc, id);
      } else {
        const correct = getRepairExpression(supportNeed.answer).speech;
        dialogue.missCount = (dialogue.missCount ?? 0) + 1;
        dialogue.hint = `다시 들어 봐요: ${supportNeed.clue} "${correct}"가 더 자연스러워요.`;
        npc.distressTimer = 1.6;
        setNpcMood(npc, "shaken", 1.6);
        addVisualCue(npc.x, npc.y - 76, "shaken", "#f59e0b", "!", 1.05);
        addLog(`${npc.name}: 아직 마음이 흔들립니다. 힌트는 ${correct}.`);
        showToast("아직 맞는 감정 표현을 찾지 못했습니다.");
        renderDialogue();
        return;
      }
      closeDialogue();
    }
  }

  function resolveNpc(npc, possibilityId) {
    npc.status = "ally";
    npc.doubt = 0;
    npc.emotion = "화해하다";
    npc.allyLevel = 1;
    npc.allyPulse = 1;
    npc.distressed = false;
    npc.distressTimer = 5.5;
    npc.supportNeed = null;
    setNpcMood(npc, "relieved", 2.2);
    const expression = getExpression(possibilityId);
    let cleared = 0;
    for (const slime of [...state.slimes]) {
      if (distance(npc, slime) <= CLEAN_RADIUS + 40) {
        removeSlime(slime, "ally");
        cleared += 1;
      }
    }
    state.pulses.push({ x: npc.x, y: npc.y, r: 12, max: CLEAN_RADIUS + 30, color: "#0f766e", life: 1.1 });
    spawnParticles(npc.x, npc.y, "#0f766e", 24);
    addVisualCue(npc.x - 18, npc.y - 78, "heart", "#0f766e", "♥", 1.45);
    addVisualCue(npc.x + 20, npc.y - 70, "spark", "#22c55e", "✦", 1.25);
    addLog(`${npc.name}: ${expression.speech} → 오해를 풀다 → 화해하다. 소문 ${cleared}개를 함께 정화했습니다.`);
    showToast(`${npc.name}과 화해했습니다. 이제 주변 소문을 같이 없애 줍니다.`);
    checkWin();
  }

  function setAllyDistressed(npc) {
    if (npc.status !== "ally" || npc.distressed || npc.allyLevel >= ALLY_MAX_LEVEL) {
      return;
    }
    npc.distressed = true;
    npc.supportNeed = supportScenarios[npc.supportIndex % supportScenarios.length];
    npc.supportIndex += 1;
    npc.allyPulse = 1;
    setNpcMood(npc, "worried", 2.2);
    state.pulses.push({ x: npc.x, y: npc.y, r: 10, max: 92, color: "#f59e0b", life: 0.8 });
    addVisualCue(npc.x, npc.y - 82, "distress", "#f59e0b", "!", 1.25);
    addLog(`${npc.name}이 곤란해합니다. 감정을 다스려 주면 우군 효율이 올라갑니다.`);
  }

  function sootheAlly(npc, repairId) {
    const expression = getRepairExpression(repairId);
    npc.distressed = false;
    npc.supportNeed = null;
    npc.allyLevel = clamp(npc.allyLevel + 1, 1, ALLY_MAX_LEVEL);
    npc.allyPulse = 1.4;
    npc.distressTimer = 8 + Math.random() * 4;
    npc.emotion = npc.allyLevel >= ALLY_MAX_LEVEL ? "화해하다" : "오해를 풀다";
    setNpcMood(npc, "confident", 2.1);

    let cleared = 0;
    for (const slime of getNearbySlimes(npc, getAllyCleanRadius(npc) + 28).slice(0, npc.allyLevel)) {
      if (removeSlime(slime, "ally")) {
        cleared += 1;
      }
    }

    state.pulses.push({ x: npc.x, y: npc.y, r: 12, max: getAllyCleanRadius(npc) + 34, color: "#0f766e", life: 1 });
    spawnParticles(npc.x, npc.y - 10, "#0f766e", 22);
    addVisualCue(npc.x - 18, npc.y - 78, "level", "#0f766e", "Lv↑", 1.4);
    addVisualCue(npc.x + 22, npc.y - 66, "spark", "#22c55e", "✦", 1.2);
    addLog(`${npc.name}: ${expression.speech} → 마음 안정. 우군 효율 Lv.${npc.allyLevel}, 소문 ${cleared}개 정화.`);
    showToast(`${npc.name}의 우군 효율이 Lv.${npc.allyLevel}로 올랐습니다.`);
    checkWin();
  }

  function interact() {
    if (state.won) {
      restart();
      return;
    }
    if (state.activeDialogue) {
      return;
    }

    if (state.villain.mode === "whisper" && distance(state.player, state.villain) <= 78) {
      interruptVillain();
      return;
    }

    const npc = getNearestNpc();
    if (npc) {
      openDialogue(npc);
      return;
    }

    const slime = getNearestSlime();
    if (slime) {
      removeSlime(slime, "direct");
      setPlayerMood("confirm", 0.9);
      addLog(`직접 확인: ${slime.word} 소문 슬라임을 하나 무마했습니다.`);
      showToast("소문 슬라임을 직접 확인해서 줄였습니다.");
      checkWin();
      return;
    }

    showToast("NPC나 소문 슬라임 가까이에서 확인 버튼을 누르세요.");
  }

  function interruptVillain() {
    const target = getVillainTarget();
    if (target) {
      target.whisperProgress = 0;
      setNpcMood(target, "relieved", 1.2);
    }
    state.villain.mode = "cooldown";
    state.villain.cooldown = 2.2;
    state.villain.whisperTimer = 0;
    state.villain.targetId = null;
    state.rumorMotes = [];
    state.pulses.push({ x: state.player.x, y: state.player.y, r: 12, max: 112, color: "#0f766e", life: 0.8 });
    spawnParticles(state.villain.x, state.villain.y - 12, "#0f766e", 16);
    setPlayerMood("block", 1.1);
    setVillainMood("shocked", 1.8);
    addVisualCue(state.player.x, state.player.y - 64, "block", "#0f766e", "✓", 1.1);
    addVisualCue(state.villain.x, state.villain.y - 72, "blocked", "#ef4444", "×", 1.25);
    addLog("주인공이 빌런의 속삭임을 막았습니다. 새 소문이 생기지 않았습니다.");
    showToast("속삭임을 막았습니다.");
  }

  function update(dt) {
    if (!state.running) {
      return;
    }

    state.time += dt;
    updatePlayer(dt);
    updateVillain(dt);
    updateNpcs(dt);
    updateSlimes(dt);
    updateRumorMotes(dt);
    updatePulses(dt);
    updateParticles(dt);
    updateVisualFeedback(dt);
    updateCamera();
    updateHud();
  }

  function updatePlayer(dt) {
    if (state.activeDialogue) {
      return;
    }
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      state.player.x = clamp(state.player.x + dx * state.player.speed * dt, 40, WORLD.width - 40);
      state.player.y = clamp(state.player.y + dy * state.player.speed * dt, 64, WORLD.height - 44);
      state.player.face = dx < 0 ? -1 : dx > 0 ? 1 : state.player.face;
    }
  }

  function updateVillain(dt) {
    const villain = state.villain;
    villain.wave += dt;
    if (state.won) {
      return;
    }

    if (villain.mode === "cooldown") {
      villain.cooldown -= dt;
      if (villain.cooldown <= 0) {
        chooseVillainTarget();
      }
      return;
    }

    let target = getVillainTarget();
    if (!target || target.status === "ally") {
      chooseVillainTarget();
      target = getVillainTarget();
      if (!target) {
        villain.mode = "idle";
        return;
      }
    }

    villain.face = target.x < villain.x ? -1 : 1;

    if (villain.mode === "whisper") {
      villain.whisperTimer -= dt;
      villain.moteTimer -= dt;
      target.whisperProgress = clamp(1 - villain.whisperTimer / WHISPER_DURATION, 0, 1);
      if (villain.moteTimer <= 0) {
        villain.moteTimer = 0.18;
        spawnRumorMote(villain, target);
      }
      if (villain.whisperTimer <= 0) {
        completeVillainSpread(target);
        target.whisperProgress = 0;
        villain.mode = "cooldown";
        villain.cooldown = 0.9;
        villain.targetId = null;
      }
      return;
    }

    const goal = {
      x: clamp(target.x - 58, 50, WORLD.width - 50),
      y: clamp(target.y - 18, 72, WORLD.height - 46)
    };
    const dx = goal.x - villain.x;
    const dy = goal.y - villain.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 14) {
      startVillainWhisper(target);
      return;
    }
    villain.x += (dx / dist) * VILLAIN_SPEED * dt;
    villain.y += (dy / dist) * VILLAIN_SPEED * dt;
  }

  function getVillainTarget() {
    return state.npcs.find((npc) => npc.id === state.villain.targetId) ?? null;
  }

  function chooseVillainTarget() {
    const candidates = state.npcs.filter((npc) => npc.status !== "ally");
    if (!candidates.length) {
      state.villain.targetId = null;
      state.villain.mode = "idle";
      return;
    }
    const target = candidates[state.villain.targetIndex % candidates.length];
    state.villain.targetIndex += 1;
    state.villain.targetId = target.id;
    state.villain.mode = "seeking";
  }

  function startVillainWhisper(target) {
    const villain = state.villain;
    villain.mode = "whisper";
    villain.whisperTimer = WHISPER_DURATION;
    villain.moteTimer = 0;
    target.whisperProgress = 0.02;
    setVillainMood("whisper", WHISPER_DURATION + 0.4);
    setNpcMood(target, "worried", WHISPER_DURATION + 0.6);
    addVisualCue(target.x, target.y - 78, "warning", "#8b5cf6", "!", 0.95);
    state.pulses.push({ x: target.x, y: target.y, r: 12, max: 96, color: "#8b5cf6", life: 0.8 });
  }

  function completeVillainSpread(target) {
    target.doubt = clamp(target.doubt + 14, 0, 120);
    setVillainMood("smug", 1.5);
    setNpcMood(target, "worried", 2.2);
    state.pulses.push({ x: target.x, y: target.y, r: 12, max: 118, color: "#8b5cf6", life: 0.9 });
    spawnParticles(target.x, target.y - 22, "#8b5cf6", 18);
    addVisualCue(target.x - 20, target.y - 78, "rumor", "#8b5cf6", "?", 1.25);
    addVisualCue(target.x + 20, target.y - 70, "spawn", "#8b5cf6", "!", 1.2);
    if (state.slimes.length < MAX_SLIMES) {
      state.slimes.push(createSlime(target.x + 42, target.y + 38, target.id, state.time * 13));
    }
    if (state.slimes.length < MAX_SLIMES) {
      state.slimes.push(createSlime(target.x - 34, target.y + 26, target.id, state.time * 17));
    }
    addLog(`빌런이 ${target.name}에게 오해를 퍼뜨렸습니다. 소문 슬라임이 생겼습니다.`);
  }

  function spawnRumorMote(villain, target) {
    state.rumorMotes.push({
      sx: villain.x + villain.face * 16,
      sy: villain.y - 24,
      tx: target.x,
      ty: target.y - 28,
      t: 0,
      life: 0.64,
      size: 5 + Math.random() * 4,
      curve: randomBetween(-32, 32)
    });
  }

  function updateNpcs(dt) {
    for (const npc of state.npcs) {
      if (npc.status === "ally") {
        npc.allyPulse = Math.max(0, npc.allyPulse - dt * 0.7);
        if (npc.distressed) {
          npc.cleanTimer = Math.max(npc.cleanTimer, 1.2);
          continue;
        }

        const cleanRadius = getAllyCleanRadius(npc);
        const nearbySlimes = getNearbySlimes(npc, cleanRadius);
        if (npc.allyLevel < ALLY_MAX_LEVEL && nearbySlimes.length > 0) {
          npc.distressTimer -= dt;
          if (npc.distressTimer <= 0) {
            setAllyDistressed(npc);
            continue;
          }
        }

        npc.cleanTimer -= dt;
        if (npc.cleanTimer <= 0) {
          npc.cleanTimer = getAllyCleanInterval(npc);
          let cleared = 0;
          for (const slime of nearbySlimes.slice(0, getAllyClearCount(npc))) {
            if (removeSlime(slime, "ally")) {
              cleared += 1;
            }
          }
          if (cleared) {
            for (let wave = 0; wave < npc.allyLevel; wave += 1) {
              state.pulses.push({
                x: npc.x,
                y: npc.y,
                r: 12 + wave * 16,
                max: getAllyCleanRadius(npc) + wave * 20,
                color: "#0f766e",
                life: 0.55 + wave * 0.16
              });
            }
            checkWin();
          }
        }
        continue;
      }
      npc.whisperProgress = Math.max(0, npc.whisperProgress - dt * 0.8);
    }
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function updateSlimes(dt) {
    for (const slime of state.slimes) {
      slime.wobble += dt * 4.2;
      slime.x += slime.vx * dt;
      slime.y += slime.vy * dt;
      slime.vx += Math.cos(state.time * 0.9 + slime.wobble) * dt * 12;
      slime.vy += Math.sin(state.time * 0.7 + slime.wobble) * dt * 12;
      const speed = Math.hypot(slime.vx, slime.vy);
      if (speed > 58) {
        slime.vx = (slime.vx / speed) * 58;
        slime.vy = (slime.vy / speed) * 58;
      }
      if (slime.x < 34 || slime.x > WORLD.width - 34) slime.vx *= -1;
      if (slime.y < 58 || slime.y > WORLD.height - 34) slime.vy *= -1;
      slime.x = clamp(slime.x, 34, WORLD.width - 34);
      slime.y = clamp(slime.y, 58, WORLD.height - 34);
      slime.bornTimer = Math.max(0, slime.bornTimer - dt);
    }
  }

  function updateRumorMotes(dt) {
    for (const mote of state.rumorMotes) {
      mote.t += dt / mote.life;
    }
    state.rumorMotes = state.rumorMotes.filter((mote) => mote.t < 1);
  }

  function updatePulses(dt) {
    for (const pulse of state.pulses) {
      pulse.life -= dt;
      pulse.r += (pulse.max - pulse.r) * dt * 3.6;
    }
    state.pulses = state.pulses.filter((pulse) => pulse.life > 0);
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 120 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateVisualFeedback(dt) {
    for (const npc of state.npcs) {
      if (npc.moodTimer > 0) {
        npc.moodTimer -= dt;
        if (npc.moodTimer <= 0) {
          npc.mood = npc.status === "ally" ? "ally" : "worried";
          npc.moodTimer = 0;
        }
      }
    }

    if (state.player.moodTimer > 0) {
      state.player.moodTimer -= dt;
      if (state.player.moodTimer <= 0) {
        state.player.mood = "ready";
        state.player.moodTimer = 0;
      }
    }

    if (state.villain.moodTimer > 0) {
      state.villain.moodTimer -= dt;
      if (state.villain.moodTimer <= 0) {
        state.villain.mood = state.villain.mode === "whisper" ? "whisper" : "smug";
        state.villain.moodTimer = 0;
      }
    }

    for (const cue of state.visualCues) {
      cue.life -= dt;
      cue.y -= dt * 26;
      cue.x += cue.drift * dt;
    }
    state.visualCues = state.visualCues.filter((cue) => cue.life > 0);
  }

  function updateCamera() {
    state.camera.x = clamp(state.player.x - canvas.width / 2, 0, WORLD.width - canvas.width);
    state.camera.y = clamp(state.player.y - canvas.height / 2, 0, WORLD.height - canvas.height);
  }

  function getSpreadScore() {
    const misled = state.npcs.filter((npc) => npc.status !== "ally").length;
    return clamp(Math.round(state.slimes.length * 3 + misled * 9), 0, 100);
  }

  function updateHud() {
    const allies = state.npcs.filter((npc) => npc.status === "ally").length;
    const distressed = state.npcs.filter((npc) => npc.distressed).length;
    const allyPower = getAllyPower();
    const spread = getSpreadScore();
    refs.spreadText.textContent = String(spread);
    refs.allyText.textContent = String(allies);
    refs.allyTotalText.textContent = String(state.npcs.length);
    refs.slimeText.textContent = String(state.slimes.length);
    refs.spreadFill.style.width = `${spread}%`;
    refs.spreadHint.textContent = distressed
      ? "곤란해하는 우군과 대화하면 정화 효율이 올라갑니다."
      : allies
      ? `우군 효율 합계 ${allyPower}. 레벨이 오를수록 더 빨리 정화합니다.`
      : "NPC의 오해를 풀면 소문 증식을 함께 막아 줍니다.";

    const prompt = getPrompt();
    refs.prompt.textContent = prompt;
    refs.prompt.classList.toggle("hidden", !prompt || Boolean(state.activeDialogue) || state.won);

    refs.toast.textContent = state.toast.text;
    refs.toast.classList.toggle("hidden", !state.toast.text || state.toast.timer <= 0);
    if (state.toast.timer > 0) {
      state.toast.timer -= 1 / 60;
    }

    const remaining = state.npcs.filter((npc) => npc.status !== "ally");
    if (state.won) {
      refs.missionTitle.textContent = "모든 오해가 풀렸습니다";
      refs.missionDetail.textContent = "소문은 확인과 대화로 줄어듭니다.";
    } else if (distressed) {
      const target = state.npcs.find((npc) => npc.distressed);
      refs.missionTitle.textContent = `${target.name}의 마음 다스리기`;
      refs.missionDetail.textContent = "머리 위 ! 표시가 뜬 우군과 대화해서 효율을 올리세요.";
    } else if (allies === state.npcs.length) {
      refs.missionTitle.textContent = "우군망을 키워 빌런 몰아내기";
      refs.missionDetail.textContent = `우군 효율 합계 ${allyPower}. 곤란한 친구를 도우면 더 강해집니다.`;
    } else if (remaining.length) {
      const target = remaining.sort((a, b) => b.doubt - a.doubt)[0];
      refs.missionTitle.textContent = `${target.name}의 오해를 풀기`;
      refs.missionDetail.textContent = `${target.emotion} 상태입니다. 단서를 보고 가능성 표현을 고르세요.`;
    }
  }

  function getPrompt() {
    if (state.villain.mode === "whisper" && distance(state.player, state.villain) <= 98) {
      return "Space/E - 빌런의 속삭임 막기";
    }
    const npc = getNearestNpc();
    if (npc) {
      if (npc.status === "ally") {
        return npc.distressed
          ? `Space/E - ${npc.name} 마음 다스리기 · 우군 Lv.${npc.allyLevel}`
          : `Space/E - ${npc.name}의 정화 파동 확인 · 우군 Lv.${npc.allyLevel}`;
      }
      return `Space/E - ${npc.name}와 대화하기 · ${npc.emotion}`;
    }
    const slime = getNearestSlime();
    if (slime) {
      return `Space/E - ${slime.word} 슬라임 직접 무마`;
    }
    return "이동: WASD/방향키 · NPC에게 대화 · 소문 슬라임은 직접 무마";
  }

  function renderDialogue() {
    const dialogue = state.activeDialogue;
    if (!dialogue) {
      closeDialogue();
      return;
    }
    const npc = state.npcs.find((item) => item.id === dialogue.npcId);
    if (!npc) {
      closeDialogue();
      return;
    }

    refs.dialogue.classList.remove("hidden");
    refs.speakerName.textContent = npc.name;
    refs.dialogueOptions.innerHTML = "";

    if (dialogue.step === "possibility") {
      refs.dialogueStep.textContent = "가능성 판단";
      refs.dialogueText.textContent = `${npc.name}: "${npc.rumor}"`;
      refs.dialogueClue.textContent = dialogue.hint || `단서: ${npc.clue} 어떤 대답이 자연스러울까요?`;
      for (const expression of getPossibilityOptions(npc.answer)) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.expression = expression.id;
        button.textContent = expression.speech;
        button.style.borderColor = expression.color;
        button.addEventListener("click", () => handleOption("possibility", expression.id));
        refs.dialogueOptions.appendChild(button);
      }
      return;
    }

    if (dialogue.step === "support") {
      const supportNeed = getSupportNeed(npc);
      refs.dialogueStep.textContent = "감정 다스리기";
      refs.dialogueText.textContent = `${npc.name}: "${supportNeed.line}"`;
      refs.dialogueClue.textContent = dialogue.hint || `상황: ${supportNeed.clue} 어떤 말로 도와줄까요?`;
      for (const expression of getSupportOptions(supportNeed.answer)) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.repair = expression.id;
        button.textContent = expression.speech;
        button.style.borderColor = expression.color;
        button.addEventListener("click", () => handleOption("support", expression.id));
        refs.dialogueOptions.appendChild(button);
      }
      return;
    }

    refs.dialogueStep.textContent = "감정 정리";
    refs.dialogueText.textContent = `${npc.name}: "${npc.repairText}" 이제 어떤 표현으로 상황을 바로잡을까요?`;
    refs.dialogueClue.textContent = dialogue.hint || "힌트: 잘못 이해한 것을 바로잡는 표현을 고르세요.";
    for (const expression of getRepairOptions()) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.repair = expression.id;
      button.textContent = expression.speech;
      button.style.borderColor = expression.color;
      button.addEventListener("click", () => handleOption("repair", expression.id));
      refs.dialogueOptions.appendChild(button);
    }
  }

  function renderExpressions() {
    const allExpressions = [
      ...possibilityExpressions,
      ...repairExpressions,
      { id: "rumor-spread", label: "소문이 퍼지다", short: "소문", meaning: "소문 자체가 넓게 알려지기" },
      { id: "rumor-scatter", label: "소문을 퍼뜨리다", short: "행동", meaning: "누군가 소문을 여기저기 전하기" }
    ];
    refs.expressionList.innerHTML = allExpressions
      .map((item) => `<li><b>${escapeHtml(item.speech ?? item.label)}</b><span>${escapeHtml(item.label)} · ${escapeHtml(item.meaning)}</span></li>`)
      .join("");
  }

  function renderLog() {
    refs.actionLog.innerHTML = state.actionLog
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld();
    drawPulses();
    drawVillainTargetPreview();
    drawVillainWhisperLink();
    drawRumorMotes();
    drawSlimes();
    drawNpcs();
    drawVillain();
    drawPlayer();
    drawParticles();
    drawVisualCues();
    drawGuidance();
    drawMiniMap();
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    ctx.fillStyle = "#d9ead2";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    drawPath(0, 520, WORLD.width, 112, "#e9dac0");
    drawPath(740, 0, 132, WORLD.height, "#e8d6bb");
    drawPath(1080, 120, 108, 820, "#eadfc6");

    drawBuilding(170, 140, 270, 160, "#fbbf24", "도서관");
    drawBuilding(1110, 140, 320, 172, "#60a5fa", "교실");
    drawBuilding(1240, 780, 260, 150, "#f472b6", "동아리방");
    drawBuilding(500, 700, 280, 152, "#34d399", "상담실");

    drawNoticeBoard(802, 226);
    drawTreePatch(86, 732);
    drawTreePatch(1410, 512);
    drawTreePatch(534, 202);
    drawTreePatch(1028, 888);

    ctx.restore();
  }

  function drawPath(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(108, 84, 50, 0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  }

  function drawBuilding(x, y, w, h, color, label) {
    ctx.fillStyle = "rgba(74, 52, 36, 0.14)";
    ctx.fillRect(x + 10, y + 16, w, h);
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(x + 34 + i * 72, y + 44, 42, 34);
    }
    ctx.fillStyle = "#223047";
    ctx.font = "700 22px sans-serif";
    ctx.fillText(label, x + 28, y + h - 30);
  }

  function drawNoticeBoard(x, y) {
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(x - 8, y + 80, 16, 78);
    ctx.fillStyle = "#a16207";
    roundRect(ctx, x - 86, y, 172, 96, 10);
    ctx.fill();
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(x - 68, y + 18, 136, 58);
    ctx.fillStyle = "#7c3aed";
    ctx.font = "800 18px sans-serif";
    ctx.fillText("소문 게시판", x - 50, y + 53);
  }

  function drawTreePatch(x, y) {
    for (let i = 0; i < 5; i += 1) {
      const tx = x + Math.cos(i * 1.4) * 48;
      const ty = y + Math.sin(i * 1.2) * 32;
      ctx.fillStyle = "#7c4a1d";
      ctx.fillRect(tx - 5, ty + 14, 10, 26);
      ctx.fillStyle = ["#15803d", "#16a34a", "#65a30d"][i % 3];
      ctx.beginPath();
      ctx.arc(tx, ty, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPulses() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    for (const pulse of state.pulses) {
      ctx.globalAlpha = clamp(pulse.life, 0, 1);
      ctx.strokeStyle = pulse.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawVillainTargetPreview() {
    const target = getVillainTarget();
    if (!target || target.status === "ally" || !["seeking", "whisper"].includes(state.villain.mode)) {
      return;
    }
    const villain = state.villain;
    const phase = state.time * 4.8;
    const pulse = Math.sin(phase) * 7;
    const warningAlpha = state.villain.mode === "whisper" ? 0.42 : 0.28;

    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    ctx.fillStyle = `rgba(139, 92, 246, ${warningAlpha * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y + 24, 56 + pulse, 18 + Math.sin(phase + 1) * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(109, 40, 217, ${warningAlpha + 0.18})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(target.x, target.y - 6, 58 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (state.villain.mode === "seeking") {
      const midX = (villain.x + target.x) / 2;
      const midY = (villain.y + target.y) / 2 - 42;
      ctx.strokeStyle = "rgba(139, 92, 246, 0.22)";
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 14]);
      ctx.beginPath();
      ctx.moveTo(villain.x, villain.y - 22);
      ctx.quadraticCurveTo(midX, midY, target.x, target.y - 26);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawSlimes() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    for (const slime of state.slimes) {
      const wobble = Math.sin(slime.wobble) * 3;
      if (slime.bornTimer > 0) {
        const birth = 1 - slime.bornTimer / 0.55;
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.65 * (1 - birth)})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(slime.x, slime.y, 16 + birth * 42, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(74, 28, 116, 0.16)";
      ctx.beginPath();
      ctx.ellipse(slime.x, slime.y + slime.r + 5, slime.r * 1.08, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const grd = ctx.createRadialGradient(slime.x - 8, slime.y - 10, 4, slime.x, slime.y, slime.r + 12);
      grd.addColorStop(0, "#f0abfc");
      grd.addColorStop(0.58, "#a855f7");
      grd.addColorStop(1, "#7e22ce");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(slime.x, slime.y + wobble, slime.r * 1.08, slime.r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(slime.x - 7, slime.y - 3 + wobble, 4.5, 0, Math.PI * 2);
      ctx.arc(slime.x + 9, slime.y - 3 + wobble, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2e1065";
      ctx.beginPath();
      ctx.arc(slime.x - 6, slime.y - 2 + wobble, 2, 0, Math.PI * 2);
      ctx.arc(slime.x + 10, slime.y - 2 + wobble, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNpcs() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    for (const npc of state.npcs) {
      const isAlly = npc.status === "ally";
      ctx.fillStyle = npc.distressed ? "rgba(245, 158, 11, 0.2)" : isAlly ? "rgba(15, 118, 110, 0.14)" : "rgba(139, 92, 246, 0.16)";
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, isAlly ? 54 + npc.allyPulse * 14 : 44 + Math.sin(state.time * 2) * 2, 0, Math.PI * 2);
      ctx.fill();

      if (isAlly && !npc.distressed) {
        drawAllyCleanAura(npc);
      }
      if (npc.distressed) {
        drawDistressAura(npc);
      }

      if (npc.whisperProgress > 0) {
        const intensity = clamp(npc.whisperProgress, 0, 1);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.26 + intensity * 0.36})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 24, 28 + Math.sin(state.time * 10) * 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(76, 29, 149, 0.78)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(npc.x, npc.y - 24, 42, -Math.PI / 2, -Math.PI / 2 + intensity * Math.PI * 2);
        ctx.stroke();
        ctx.lineCap = "butt";

        ctx.fillStyle = `rgba(139, 92, 246, ${0.14 + intensity * 0.2})`;
        ctx.beginPath();
        ctx.arc(npc.x - 22, npc.y - 50, 7 + Math.sin(state.time * 7) * 2, 0, Math.PI * 2);
        ctx.arc(npc.x + 24, npc.y - 45, 5 + Math.cos(state.time * 8) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const allyLabel = npc.distressed ? "도움 필요" : `우군 Lv.${npc.allyLevel}`;
      const faceMood = npc.whisperProgress > 0 ? "worried" : npc.mood;
      drawCharacter(npc.x, npc.y, npc.color, npc.name, isAlly ? allyLabel : npc.emotion, isAlly, npc.distressed, faceMood);

      if (!isAlly) {
        drawBubble(npc.x, npc.y - 66, "오해?", "#6d28d9");
      } else if (npc.distressed) {
        drawExclamation(npc.x, npc.y - 82);
      } else {
        drawAllyLevelBadge(npc.x, npc.y - 70, npc.allyLevel);
      }
    }
    ctx.restore();
  }

  function drawVillain() {
    const villain = worldToScreen(state.villain);
    const mood = state.villain.mode === "whisper" ? "whisper" : state.villain.mood;
    const shake = mood === "shocked" ? Math.sin(state.time * 28) * 3 : 0;
    ctx.save();
    ctx.translate(villain.x + shake, villain.y);
    ctx.scale(state.villain.face, 1);
    const pulse = Math.sin(state.time * 3) * 4;
    ctx.fillStyle = mood === "shocked" ? "rgba(239, 68, 68, 0.16)" : "rgba(109, 40, 217, 0.17)";
    ctx.beginPath();
    ctx.arc(0, 0, state.villain.mode === "whisper" ? 58 + pulse : 42 + pulse, 0, Math.PI * 2);
    ctx.fill();
    if (state.villain.mode === "whisper") {
      ctx.strokeStyle = "rgba(139, 92, 246, 0.72)";
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(24 + i * 8, -20, 12 + i * 10 + Math.sin(state.time * 7 + i) * 3, -0.7, 0.7);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#2e1065";
    ctx.beginPath();
    ctx.arc(0, -12, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4c1d95";
    roundRect(ctx, -18, 6, 36, 44, 12);
    ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    if (mood === "shocked") {
      ctx.arc(-7, -15, 4.4, 0, Math.PI * 2);
      ctx.arc(7, -15, 4.4, 0, Math.PI * 2);
    } else {
      ctx.arc(-7, -15, 3, 0, Math.PI * 2);
      ctx.arc(7, -15, 3, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === "shocked") {
      ctx.moveTo(-12, -25);
      ctx.lineTo(-3, -21);
      ctx.moveTo(3, -21);
      ctx.lineTo(12, -25);
    } else {
      ctx.moveTo(-12, -23);
      ctx.lineTo(-3, -25);
      ctx.moveTo(3, -25);
      ctx.lineTo(12, -23);
    }
    ctx.stroke();

    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (mood === "shocked") {
      ctx.arc(0, -4, 5, 0, Math.PI * 2);
    } else if (state.villain.mode === "retreat") {
      ctx.moveTo(-9, 0);
      ctx.quadraticCurveTo(0, -5, 9, 0);
    } else {
      ctx.moveTo(-9, -4);
      ctx.quadraticCurveTo(0, 3, 9, -4);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawVillainWhisperLink() {
    if (state.villain.mode !== "whisper") {
      return;
    }
    const target = getVillainTarget();
    if (!target) {
      return;
    }
    const villain = state.villain;
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.35)";
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 12]);
    ctx.beginPath();
    const midX = (villain.x + target.x) / 2;
    const midY = (villain.y + target.y) / 2 - 52;
    ctx.moveTo(villain.x + villain.face * 16, villain.y - 22);
    ctx.quadraticCurveTo(midX, midY, target.x, target.y - 28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawRumorMotes() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    for (const mote of state.rumorMotes) {
      const t = clamp(mote.t, 0, 1);
      const eased = t * t * (3 - 2 * t);
      const x = (1 - eased) * (1 - eased) * mote.sx + 2 * (1 - eased) * eased * ((mote.sx + mote.tx) / 2) + eased * eased * mote.tx;
      const y = (1 - eased) * (1 - eased) * mote.sy + 2 * (1 - eased) * eased * ((mote.sy + mote.ty) / 2 + mote.curve) + eased * eased * mote.ty;
      ctx.globalAlpha = 1 - t * 0.25;
      const grd = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, mote.size + 7);
      grd.addColorStop(0, "#f5d0fe");
      grd.addColorStop(0.58, "#a855f7");
      grd.addColorStop(1, "rgba(126, 34, 206, 0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, mote.size + Math.sin(state.time * 12 + t) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const player = worldToScreen(state.player);
    const mood = state.player.mood;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(state.player.face, 1);
    ctx.fillStyle = "rgba(30, 64, 175, 0.16)";
    ctx.beginPath();
    ctx.ellipse(0, 24, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(0, -17, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2563eb";
    roundRect(ctx, -15, 0, 30, 42, 10);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(-6, -20, 2.4, 0, Math.PI * 2);
    ctx.arc(7, -20, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === "block") {
      ctx.moveTo(-8, -12);
      ctx.quadraticCurveTo(1, -15, 9, -12);
    } else {
      ctx.moveTo(-5, -11);
      ctx.quadraticCurveTo(1, mood === "confirm" ? -6 : -7, 8, -11);
    }
    ctx.stroke();
    if (mood === "confirm" || mood === "block") {
      ctx.strokeStyle = mood === "block" ? "#0f766e" : "#2563eb";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -2, 27 + Math.sin(state.time * 12) * 2, -0.25, Math.PI * 1.25);
      ctx.stroke();
    }
    ctx.restore();
    drawScreenBubble(player.x, player.y - 58, "확인하기", "#1d4ed8");
  }

  function drawCharacter(x, y, color, name, label, isAlly, distressed = false, mood = "neutral") {
    const faceMood = distressed ? "distressed" : mood || (isAlly ? "ally" : "worried");
    const isPositive = ["ally", "understanding", "relieved", "confident"].includes(faceMood);
    const isAlert = ["confused", "worried", "shaken", "distressed"].includes(faceMood);
    ctx.fillStyle = "rgba(24, 32, 45, 0.15)";
    ctx.beginPath();
    ctx.ellipse(x, y + 26, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x - 16, y - 4, 32, 44, 10);
    ctx.fill();
    ctx.fillStyle = distressed ? "#fef3c7" : isAlly ? "#dcfce7" : "#fee2e2";
    ctx.beginPath();
    ctx.arc(x, y - 22, 18, 0, Math.PI * 2);
    ctx.fill();
    if (isPositive) {
      ctx.fillStyle = "rgba(244, 114, 182, 0.36)";
      ctx.beginPath();
      ctx.arc(x - 10, y - 19, 3.5, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 19, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    if (faceMood === "relieved" || faceMood === "confident") {
      ctx.arc(x - 6, y - 25, 3.1, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 25, 3.1, 0, Math.PI * 2);
    } else if (faceMood === "listening") {
      ctx.arc(x - 6, y - 26, 2.7, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 26, 2.7, 0, Math.PI * 2);
    } else {
      ctx.arc(x - 6, y - 25, 2.4, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 25, 2.4, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (isAlert) {
      ctx.moveTo(x - 11, y - 33);
      ctx.lineTo(x - 3, y - 31);
      ctx.moveTo(x + 3, y - 31);
      ctx.lineTo(x + 11, y - 33);
    } else if (faceMood === "listening") {
      ctx.moveTo(x - 11, y - 33);
      ctx.lineTo(x - 3, y - 35);
      ctx.moveTo(x + 3, y - 35);
      ctx.lineTo(x + 11, y - 33);
    } else {
      ctx.moveTo(x - 11, y - 32);
      ctx.lineTo(x - 3, y - 33);
      ctx.moveTo(x + 3, y - 33);
      ctx.lineTo(x + 11, y - 32);
    }
    ctx.stroke();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (faceMood === "listening") {
      ctx.arc(x + 1, y - 13, 3.6, 0, Math.PI * 2);
    } else if (faceMood === "shaken" || faceMood === "distressed") {
      ctx.moveTo(x - 8, y - 13);
      ctx.quadraticCurveTo(x, y - 18, x + 8, y - 13);
    } else if (faceMood === "confused" || faceMood === "worried") {
      ctx.moveTo(x - 8, y - 12);
      ctx.quadraticCurveTo(x, y - 16, x + 8, y - 12);
    } else if (isPositive) {
      ctx.moveTo(x - 7, y - 15);
      ctx.quadraticCurveTo(x, y - 8, x + 8, y - 15);
    } else {
      ctx.moveTo(x - 8, y - 12);
      ctx.quadraticCurveTo(x, y - 17, x + 8, y - 12);
    }
    ctx.stroke();
    ctx.fillStyle = "#18202d";
    ctx.font = "800 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y + 58);
    ctx.fillStyle = isAlly ? "#0f766e" : "#7c3aed";
    ctx.font = "700 12px sans-serif";
    ctx.fillText(label, x, y + 74);
    ctx.textAlign = "left";
  }

  function drawExclamation(x, y) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 18 + Math.sin(state.time * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d97706";
    ctx.font = "900 25px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", x, y + 8);
    ctx.restore();
  }

  function drawAllyLevelBadge(x, y, level) {
    ctx.save();
    const width = 34 + level * 15;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 2;
    roundRect(ctx, x - width / 2, y - 14, width, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0f766e";
    for (let i = 0; i < level; i += 1) {
      ctx.beginPath();
      ctx.arc(x - (level - 1) * 7 + i * 14, y - 2, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAllyCleanAura(npc) {
    const radius = 30 + npc.allyLevel * 12 + Math.sin(state.time * (2.2 + npc.allyLevel * 0.4)) * 4;
    ctx.save();
    ctx.strokeStyle = `rgba(15, 118, 110, ${0.2 + npc.allyLevel * 0.08})`;
    ctx.lineWidth = 2 + npc.allyLevel;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (npc.allyLevel >= 2) {
      ctx.strokeStyle = "rgba(20, 184, 166, 0.24)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, radius + 18, Math.sin(state.time * 2), Math.PI * 1.35 + Math.sin(state.time * 2));
      ctx.stroke();
    }

    if (npc.allyLevel >= 3) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const angle = state.time * 2.8 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(npc.x + Math.cos(angle) * 36, npc.y + Math.sin(angle) * 22, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawDistressAura(npc) {
    ctx.save();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.62)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 9]);
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, 48 + Math.sin(state.time * 7) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(15, 118, 110, 0.18)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      const start = state.time * 1.8 + i * 2.1;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, 62 + i * 9, start, start + 0.45);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(217, 119, 6, 0.78)";
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      const x = npc.x + i * 14 + Math.sin(state.time * 10 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, npc.y - 70);
      ctx.lineTo(x + 4, npc.y - 62);
      ctx.moveTo(x + 4, npc.y - 70);
      ctx.lineTo(x - 4, npc.y - 62);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    for (const particle of state.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawVisualCues() {
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const cue of state.visualCues) {
      const t = 1 - cue.life / cue.maxLife;
      const alpha = clamp(cue.life / cue.maxLife, 0, 1);
      const scale = cue.size + Math.sin(t * Math.PI) * 0.35;
      const y = cue.y - t * 18;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cue.x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
      ctx.strokeStyle = cue.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (cue.kind === "spark") {
        for (let i = 0; i < 8; i += 1) {
          const angle = i * Math.PI / 4;
          const radius = i % 2 === 0 ? 18 : 8;
          const x = Math.cos(angle) * radius;
          const starY = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, starY);
          else ctx.lineTo(x, starY);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, cue.label.length > 1 ? 22 : 18, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cue.color;
      ctx.font = cue.label.length > 1 ? "900 17px sans-serif" : "900 25px sans-serif";
      ctx.fillText(cue.label, 0, cue.label.length > 1 ? 1 : 2);
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }

  function drawGuidance() {
    if (state.won || state.activeDialogue) {
      return;
    }
    const target = state.npcs
      .filter((npc) => npc.status !== "ally")
      .sort((a, b) => b.doubt - a.doubt)[0];
    if (!target) {
      return;
    }
    const pos = worldToScreen(target);
    ctx.save();
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 60 + Math.sin(state.time * 4) * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (pos.x < 20 || pos.x > canvas.width - 20 || pos.y < 20 || pos.y > canvas.height - 20) {
      const center = { x: canvas.width / 2, y: canvas.height / 2 };
      const angle = Math.atan2(pos.y - center.y, pos.x - center.x);
      const x = clamp(center.x + Math.cos(angle) * 400, 34, canvas.width - 34);
      const y = clamp(center.y + Math.sin(angle) * 260, 34, canvas.height - 34);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#0f766e";
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMiniMap() {
    miniCtx.clearRect(0, 0, miniMap.width, miniMap.height);
    miniCtx.fillStyle = "#eef3df";
    miniCtx.fillRect(0, 0, miniMap.width, miniMap.height);
    miniCtx.fillStyle = "#e0d1b6";
    miniCtx.fillRect(0, 62, miniMap.width, 14);
    miniCtx.fillRect(75, 0, 13, miniMap.height);

    const sx = miniMap.width / WORLD.width;
    const sy = miniMap.height / WORLD.height;

    for (const slime of state.slimes) {
      miniCtx.fillStyle = "#8b5cf6";
      miniCtx.beginPath();
      miniCtx.arc(slime.x * sx, slime.y * sy, 2.4, 0, Math.PI * 2);
      miniCtx.fill();
    }
    for (const npc of state.npcs) {
      miniCtx.fillStyle = npc.distressed ? "#f59e0b" : npc.status === "ally" ? "#0f766e" : "#f59e0b";
      miniCtx.fillRect(npc.x * sx - 2, npc.y * sy - 2, 4, 4);
    }
    miniCtx.fillStyle = "#2563eb";
    miniCtx.beginPath();
    miniCtx.arc(state.player.x * sx, state.player.y * sy, 3.6, 0, Math.PI * 2);
    miniCtx.fill();
  }

  function drawBubble(x, y, text, color) {
    ctx.save();
    const width = Math.max(74, Math.min(128, text.length * 13));
    ctx.font = "800 13px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    roundRect(ctx, x - width / 2, y - 19, width, 28, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawScreenBubble(x, y, text, color) {
    ctx.save();
    drawBubble(x, y, text, color);
    ctx.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
  }

  function checkWin() {
    if (state.won) {
      return;
    }
    const allAllies = state.npcs.every((npc) => npc.status === "ally");
    const allyPower = getAllyPower();
    const enoughSupport = allyPower >= state.npcs.length + 4;
    const noDistress = state.npcs.every((npc) => !npc.distressed);
    if (allAllies && enoughSupport && noDistress && state.slimes.length <= 4) {
      state.won = true;
      state.running = false;
      state.villain.mode = "retreat";
      refs.finishSummary.textContent = `우군 효율 합계 ${allyPower}, 남은 소문 ${state.slimes.length}개. 함께 마음을 다스려 빌런을 몰아냈습니다.`;
      refs.finishCard.classList.remove("hidden");
      addLog("우군망이 강해졌습니다. 빌런이 더 이상 소문을 퍼뜨리지 못하고 물러났습니다.");
    }
  }

  function restart() {
    state = createInitialState();
    refs.finishCard.classList.add("hidden");
    refs.dialogue.classList.add("hidden");
    renderLog();
    updateHud();
  }

  function setupInput() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
        keys.add(key);
        event.preventDefault();
      }
      if (key === " " || key === "e" || key === "enter") {
        interact();
        event.preventDefault();
      }
      if (key === "escape" && state.activeDialogue) {
        closeDialogue();
      }
    });
    window.addEventListener("keyup", (event) => {
      keys.delete(event.key.toLowerCase());
    });

    document.querySelectorAll("[data-action='move']").forEach((button) => {
      const dir = button.dataset.dir;
      const keyMap = { up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright" };
      const mapped = keyMap[dir];
      button.addEventListener("pointerdown", () => keys.add(mapped));
      button.addEventListener("pointerup", () => keys.delete(mapped));
      button.addEventListener("pointerleave", () => keys.delete(mapped));
      button.addEventListener("click", () => {
        keys.add(mapped);
        window.setTimeout(() => keys.delete(mapped), 140);
      });
    });
    document.querySelector("[data-action='interact']").addEventListener("click", interact);
    refs.restartButton.addEventListener("click", restart);
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    renderLog();
    requestAnimationFrame(loop);
  }

  function init() {
    refs.allyTotalText.textContent = String(state.npcs.length);
    renderExpressions();
    renderLog();
    updateHud();
    setupInput();
    requestAnimationFrame(loop);
  }

  window.RUMOR_GAME_NEXT = {
    get state() {
      return state;
    },
    actions: {
      restart,
      interact,
      openDialogue,
      handleOption,
      resolveNpc,
      setAllyDistressed,
      sootheAlly,
      removeSlime,
      createSlime
    }
  };

  init();
})();
