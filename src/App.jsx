import { useEffect, useMemo, useRef, useState } from "react";
import { createEmptyInventory, difficultyConfig, shopItems } from "./gameData";

const STORAGE_KEY = "word_fortress_profile_v1";
const START_Y = 8;
const ENEMY_LANES = [12, 31, 50, 69, 88];
const MASTERED_STREAK = 2;
const ROADMAP_MAX_LEVEL = 12;
const ROUND_SIZE_BY_MODE = {
  easy: 15,
  medium: 18,
  hard: 20,
  custom: 18,
  mistakes: 15
};
const COMBO_SCORE_STEPS = [
  { min: 8, multiplier: 1.6, speedMultiplier: 1.22 },
  { min: 6, multiplier: 1.45, speedMultiplier: 1.17 },
  { min: 4, multiplier: 1.3, speedMultiplier: 1.12 },
  { min: 2, multiplier: 1.15, speedMultiplier: 1.07 }
];
const MISTAKE_SPEED_STEPS = [
  { min: 4, speedMultiplier: 0.82 },
  { min: 3, speedMultiplier: 0.88 },
  { min: 2, speedMultiplier: 0.94 }
];
const COMBO_FLASH_STEPS = [
  { min: 12, accent: "legend", subline: "火力全开" },
  { min: 8, accent: "fury", subline: "进入狂热" },
  { min: 4, accent: "boost", subline: "倍率上升" },
  { min: 2, accent: "start", subline: "连击开始" }
];
const HOME_MODE_OPTIONS = [
  { id: "easy", label: "简单", desc: "速度最慢，适合热身", icon: "E" },
  { id: "medium", label: "中等", desc: "词更难，速度适中", icon: "M" },
  { id: "hard", label: "困难", desc: "高分挑战，血量更少", icon: "H" },
  { id: "custom", label: "自定义", desc: "使用自己的词库", icon: "DIY" }
];
const ZH_ALIAS_MAP = {
  书: ["书本"],
  学校: ["校园"],
  家庭: ["家人"],
  开心的: ["开心", "高兴", "高兴的"],
  朋友: ["伙伴"],
  花园: ["园子"],
  提升: ["提高"],
  创造: ["创建"],
  旅行: ["旅游"],
  未来: ["将来"],
  记忆: ["回忆"],
  诚实的: ["诚实", "老实", "老实的"],
  保护: ["保卫"],
  发现: ["发觉"],
  后果: ["结果"],
  高效的: ["高效", "效率高"],
  重要的: ["重要", "关键的"],
  视角: ["角度", "观点"],
  合作: ["协作"],
  动力: ["驱动力"],
  策略: ["战略"],
  资源: ["物资"],
  有韧性的: ["有韧性", "坚韧", "坚韧的"]
};

function createGameState() {
  return {
    mode: "easy",
    hp: 5,
    maxHp: 5,
    score: 0,
    kills: 0,
    combo: 0,
    mistakeStreak: 0,
    skipBullets: 0,
    baseSpeed: 55,
    speed: 55,
    points: 10,
    baseScoreMultiplier: 1,
    scoreMultiplier: 1,
    totalEnemies: 0,
    spawnedEnemies: 0,
    enemies: [],
    maxConcurrent: 2,
    spawnDelay: 1200,
    frozen: false,
    running: false
  };
}

function buildWordId(word) {
  const en = String(word?.en || "").trim().toLowerCase();
  const zh = String(word?.zh || "").trim();
  return `${en}::${zh}`;
}

const WORD_DETAIL_LOOKUP = new Map();
Object.values(difficultyConfig).forEach((config) => {
  config.words.forEach((word) => {
    WORD_DETAIL_LOOKUP.set(buildWordId(word), word);
    WORD_DETAIL_LOOKUP.set(String(word.en).trim().toLowerCase(), word);
  });
});

function findWordDetail(word) {
  const idMatch = WORD_DETAIL_LOOKUP.get(buildWordId(word));
  if (idMatch) return idMatch;
  return WORD_DETAIL_LOOKUP.get(String(word?.en || "").trim().toLowerCase()) || null;
}

function hasWordDetail(value) {
  return Boolean(value && value !== "暂无" && value !== "N/A");
}

function getModeDisplayName(mode) {
  if (mode === "custom") return "自定义";
  if (mode === "mistakes") return "错题练习";
  return difficultyConfig[mode]?.label || "练习";
}

function normalizeMistakeBook(raw) {
  const source = Array.isArray(raw) ? raw : Object.values(raw || {});

  return source
    .map((entry) => {
      const en = String(entry?.en || "").trim();
      const zh = String(entry?.zh || "").trim();
      if (!en || !zh) return null;
      const detail = findWordDetail({ en, zh });

      return {
        id: entry.id || buildWordId(entry),
        en,
        zh,
        zhAliases: Array.isArray(entry.zhAliases) ? entry.zhAliases : detail?.zhAliases || [],
        partOfSpeech: hasWordDetail(entry.partOfSpeech) ? entry.partOfSpeech : detail?.partOfSpeech || "暂无",
        defEn: hasWordDetail(entry.defEn) ? entry.defEn : detail?.defEn || "",
        synonym: hasWordDetail(entry.synonym) ? entry.synonym : detail?.synonym || "",
        example: hasWordDetail(entry.example) ? entry.example : detail?.example || "",
        points: Number(entry.points) || Number(detail?.points) || 10,
        missedCount: Number(entry.missedCount ?? entry.misses) || 1,
        correctStreak: Number(entry.correctStreak) || 0,
        lastMissedAt: Number(entry.lastMissedAt) || 0,
        lastPracticedAt: Number(entry.lastPracticedAt) || 0,
        source: entry.source || entry.mode || "练习"
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.lastMissedAt - a.lastMissedAt);
}

function createMistakeEntry(word, source, timestamp) {
  const detail = findWordDetail(word);

  return {
    id: buildWordId(word),
    en: word.en,
    zh: word.zh,
    zhAliases: Array.isArray(word.zhAliases) ? word.zhAliases : detail?.zhAliases || [],
    partOfSpeech: word.partOfSpeech || detail?.partOfSpeech || "暂无",
    defEn: word.defEn || detail?.defEn || "",
    synonym: word.synonym || detail?.synonym || "",
    example: word.example || detail?.example || "",
    points: Number(word.points) || Number(detail?.points) || 10,
    missedCount: 1,
    correctStreak: 0,
    lastMissedAt: timestamp,
    lastPracticedAt: 0,
    source
  };
}

function addMistakesToProfile(profile, words, source) {
  const timestamp = Date.now();
  const map = new Map(normalizeMistakeBook(profile.mistakes).map((entry) => [entry.id, entry]));

  words.forEach((word) => {
    const id = buildWordId(word);
    const existing = map.get(id);
    const detail = findWordDetail(word);

    map.set(
      id,
      existing
        ? {
            ...existing,
            en: word.en,
            zh: word.zh,
            zhAliases: Array.isArray(word.zhAliases) ? word.zhAliases : existing.zhAliases || detail?.zhAliases || [],
            partOfSpeech: word.partOfSpeech || (hasWordDetail(existing.partOfSpeech) ? existing.partOfSpeech : detail?.partOfSpeech) || "暂无",
            defEn: word.defEn || (hasWordDetail(existing.defEn) ? existing.defEn : detail?.defEn) || "",
            synonym: word.synonym || (hasWordDetail(existing.synonym) ? existing.synonym : detail?.synonym) || "",
            example: word.example || (hasWordDetail(existing.example) ? existing.example : detail?.example) || "",
            points: Number(word.points) || existing.points || Number(detail?.points) || 10,
            missedCount: existing.missedCount + 1,
            correctStreak: 0,
            lastMissedAt: timestamp,
            source
          }
        : createMistakeEntry(word, source, timestamp)
    );
  });

  return {
    ...profile,
    mistakes: Array.from(map.values()).sort((a, b) => b.lastMissedAt - a.lastMissedAt)
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        wallet: 0,
        lifetimeScore: 0,
        inventory: createEmptyInventory(),
        mistakes: []
      };
    }

    const parsed = JSON.parse(raw);
    return {
      wallet: Number(parsed.wallet) || 0,
      lifetimeScore: Number(parsed.lifetimeScore ?? parsed.wallet) || 0,
      inventory: {
        ...createEmptyInventory(),
        ...(parsed.inventory || {})
      },
      mistakes: normalizeMistakeBook(parsed.mistakes)
    };
  } catch (_error) {
    return {
      wallet: 0,
      lifetimeScore: 0,
      inventory: createEmptyInventory(),
      mistakes: []
    };
  }
}

function getXpGoal(level) {
  return 120 + (level - 1) * 70;
}

function getRankTitle(level) {
  if (level >= 12) return "传说词库守卫";
  if (level >= 9) return "秘境挑战者";
  if (level >= 6) return "词义猎人";
  if (level >= 3) return "前线守卫";
  return "新手冒险者";
}

function buildPlayerProgress(totalXp) {
  let level = 1;
  let xp = Math.max(0, Number(totalXp) || 0);
  let goal = getXpGoal(level);

  while (xp >= goal) {
    xp -= goal;
    level += 1;
    goal = getXpGoal(level);
  }

  return {
    level,
    currentXp: xp,
    nextXp: goal,
    ratio: goal ? xp / goal : 0,
    title: getRankTitle(level)
  };
}

function buildLevelRoadmap(maxLevel = ROADMAP_MAX_LEVEL) {
  let totalXp = 0;
  const roadmap = [];

  for (let level = 1; level <= maxLevel; level += 1) {
    const needXp = getXpGoal(level);
    roadmap.push({
      level,
      title: getRankTitle(level),
      needXp,
      totalXpToReach: totalXp,
      totalXpToNext: totalXp + needXp
    });
    totalXp += needXp;
  }

  return roadmap;
}

function toHalfWidth(value) {
  return String(value || "")
    .replace(/[\u3000]/g, " ")
    .replace(/[\uFF01-\uFF5E]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
}

function normalizeAnswer(raw) {
  let normalized = toHalfWidth(raw).trim().toLowerCase();

  normalized = normalized.replace(/[，。！!？?、；;：:,.。\s'"“”‘’`~·\-—_()（）【】\[\]<>《》\/\\]/g, "");
  normalized = normalized.replace(/^(?:一个|一种|一位|一名|一项|一条|一座|一场|一份|一段|一件|一类|一些|一点|这个|那个|这种|那种|该|此|表示|叫做)+/g, "");

  if (normalized.length > 2) {
    normalized = normalized.replace(/(?:一个|一种|一位|一名|一项|一条|一座|一场|一份|一段|一件|一类)$/g, "");
  }

  if (normalized.length > 1 && normalized.endsWith("的")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function parseZhWithAliases(raw) {
  const tokens = String(raw || "")
    .split(/[|｜/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return { primary: "", aliases: [] };
  }

  return {
    primary: tokens[0],
    aliases: tokens.slice(1)
  };
}

function buildAcceptedAnswers(word) {
  const answerSet = new Set();
  const canonical = normalizeAnswer(word.zh);
  const mappedAliases = ZH_ALIAS_MAP[word.zh] || [];
  const rawAliases = Array.isArray(word.zhAliases) ? word.zhAliases : [];

  [word.zh, ...mappedAliases, ...rawAliases].forEach((candidate) => {
    const norm = normalizeAnswer(candidate);
    if (!norm) return;

    answerSet.add(norm);
    if (norm.endsWith("的")) {
      answerSet.add(norm.slice(0, -1));
    } else {
      answerSet.add(`${norm}的`);
    }
  });

  if (canonical) {
    answerSet.add(canonical);
  }

  return Array.from(answerSet);
}

function shuffleArray(items) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function pickRoundWords(words, mode) {
  const limit = ROUND_SIZE_BY_MODE[mode] || 18;
  if (!Array.isArray(words) || words.length <= limit) {
    return Array.isArray(words) ? [...words] : [];
  }

  return shuffleArray(words).slice(0, limit);
}

function getComboStep(combo) {
  return COMBO_SCORE_STEPS.find((step) => combo >= step.min) || null;
}

function getMistakeStep(mistakeStreak) {
  return MISTAKE_SPEED_STEPS.find((step) => mistakeStreak >= step.min) || null;
}

function getComboFlashStep(combo) {
  return COMBO_FLASH_STEPS.find((step) => combo >= step.min) || null;
}

function applyBattleMomentum(gameLike) {
  const comboStep = getComboStep(gameLike.combo || 0);
  const mistakeStep = getMistakeStep(gameLike.mistakeStreak || 0);
  const baseSpeed = Number(gameLike.baseSpeed) || Number(gameLike.speed) || 0;
  const baseScoreMultiplier = Number(gameLike.baseScoreMultiplier) || 1;
  const comboMultiplier = comboStep?.multiplier || 1;
  const speedUp = comboStep?.speedMultiplier || 1;
  const speedDown = mistakeStep?.speedMultiplier || 1;

  return {
    ...gameLike,
    scoreMultiplier: Number((baseScoreMultiplier * comboMultiplier).toFixed(2)),
    speed: Math.max(16, Math.round(baseSpeed * speedUp * speedDown))
  };
}

function parseCustomWords(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [enRaw, ...zhParts] = line.split(":");
      if (!enRaw || zhParts.length === 0) return null;

      const en = enRaw.trim();
      const { primary: zh, aliases: zhAliases } = parseZhWithAliases(zhParts.join(":").trim());
      if (!zh) return null;
      const autoPoints = Math.min(40, 8 + en.length * 2);

      return {
        en,
        zh,
        zhAliases,
        partOfSpeech: "自定义",
        points: autoPoints,
        defEn: `自定义单词：${en}`,
        synonym: "暂无",
        example: `本局学习了 ${en} 这个单词。`
      };
    })
    .filter(Boolean);
}

function buildInventoryText(profile) {
  const tags = shopItems
    .filter((item) => (profile.inventory[item.id] || 0) > 0)
    .map((item) => `${item.name} x${profile.inventory[item.id]}`);

  return tags.length ? `库存：${tags.join(" | ")}` : "库存：暂无道具";
}

function buildReviewWords(words) {
  const uniq = new Map();
  words.forEach((word) => {
    if (!uniq.has(word.en)) {
      uniq.set(word.en, word);
    }
  });
  return Array.from(uniq.values());
}

function getWaveConfig(mode, speedOverride) {
  if (mode === "easy") {
    return { maxConcurrent: 2, spawnDelay: 1900 };
  }
  if (mode === "medium") {
    return { maxConcurrent: 2, spawnDelay: 1320 };
  }
  if (mode === "hard") {
    return { maxConcurrent: 2, spawnDelay: 1220 };
  }

  const speed = speedOverride || 85;
  if (speed <= 75) {
    return { maxConcurrent: 2, spawnDelay: 1250 };
  }
  if (speed <= 115) {
    return { maxConcurrent: 3, spawnDelay: 930 };
  }
  return { maxConcurrent: 4, spawnDelay: 720 };
}

function applyInventoryBuffs(profile, baseGame) {
  const nextProfile = {
    ...profile,
    wallet: profile.wallet,
    inventory: { ...profile.inventory }
  };
  const nextGame = { ...baseGame };
  const activated = [];

  if (nextProfile.inventory.skipPack > 0) {
    nextProfile.inventory.skipPack -= 1;
    nextGame.skipBullets += 3;
    activated.push(shopItems.find((item) => item.id === "skipPack").short);
  }

  if (nextProfile.inventory.shieldBoost > 0) {
    nextProfile.inventory.shieldBoost -= 1;
    nextGame.hp += 1;
    nextGame.maxHp += 1;
    activated.push(shopItems.find((item) => item.id === "shieldBoost").short);
  }

  if (nextProfile.inventory.slowChip > 0) {
    nextProfile.inventory.slowChip -= 1;
    nextGame.baseSpeed = Math.round(nextGame.baseSpeed * 0.85);
    activated.push(shopItems.find((item) => item.id === "slowChip").short);
  }

  if (nextProfile.inventory.scoreBoost > 0) {
    nextProfile.inventory.scoreBoost -= 1;
    nextGame.baseScoreMultiplier = 1.5;
    activated.push(shopItems.find((item) => item.id === "scoreBoost").short);
  }

  return { nextProfile, nextGame: applyBattleMomentum(nextGame), activated };
}

function pickLane(enemies) {
  const occupied = new Set(enemies.map((enemy) => enemy.laneIndex));
  const freeLanes = ENEMY_LANES.map((x, laneIndex) => ({ laneIndex, x })).filter(
    (lane) => !occupied.has(lane.laneIndex)
  );

  const candidates = freeLanes.length > 0 ? freeLanes : ENEMY_LANES.map((x, laneIndex) => ({ laneIndex, x }));
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [profile, setProfile] = useState(loadProfile);
  const [game, setGame] = useState(createGameState);
  const [answer, setAnswer] = useState("");
  const [selectedMode, setSelectedMode] = useState("easy");
  const [showCustom, setShowCustom] = useState(false);
  const [customWordsText, setCustomWordsText] = useState("apple:苹果|水果\nbook:书|书本\ntravel:旅行|旅游");
  const [customSpeed, setCustomSpeed] = useState(85);
  const [homeNote, setHomeNote] = useState("准备就绪。选择一个关卡开始，或先去商店购买道具。");
  const [shopMessage, setShopMessage] = useState({ text: "被动道具会在下一局自动加载，主动道具可在战斗中点击使用。", type: "ok" });
  const [gameMessage, setGameMessage] = useState({ text: "", type: "ok" });
  const [resultSummary, setResultSummary] = useState("");
  const [reviewWords, setReviewWords] = useState([]);
  const [bursts, setBursts] = useState([]);
  const [battlefieldPulse, setBattlefieldPulse] = useState(false);
  const [rewardPulse, setRewardPulse] = useState(false);
  const [dangerLevel, setDangerLevel] = useState("");
  const [comboFlash, setComboFlash] = useState(null);

  const battlefieldRef = useRef(null);
  const enemyNodesRef = useRef(new Map());
  const audioCtxRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const freezeTimerRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const rewardPulseTimerRef = useRef(null);
  const comboFlashTimerRef = useRef(null);
  const warningSfxAtRef = useRef(0);
  const dangerLevelRef = useRef("");
  const burstTimersRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const enemyIdRef = useRef(0);

  const profileRef = useRef(profile);
  const gameRef = useRef(game);
  const enemiesRef = useRef(game.enemies);
  const sessionRef = useRef({
    wordPool: [],
    seenWords: [],
    reviewMap: new Map()
  });

  useEffect(() => {
    profileRef.current = profile;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (_error) {
      setHomeNote("浏览器暂时无法写入本地存储，错题本可能无法保存。");
    }
  }, [profile]);

  useEffect(() => {
    gameRef.current = game;
    enemiesRef.current = game.enemies;
  }, [game]);

  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
      }
      if (freezeTimerRef.current) {
        clearTimeout(freezeTimerRef.current);
      }
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      if (rewardPulseTimerRef.current) {
        clearTimeout(rewardPulseTimerRef.current);
      }
      if (comboFlashTimerRef.current) {
        clearTimeout(comboFlashTimerRef.current);
      }
      burstTimersRef.current.forEach((id) => clearTimeout(id));
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!game.running || game.enemies.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return undefined;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    lastTsRef.current = 0;

    const tick = (ts) => {
      const field = battlefieldRef.current;
      const enemies = enemiesRef.current;

      if (!field || enemies.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTsRef.current) {
        lastTsRef.current = ts;
      }

      if (gameRef.current.frozen) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const breachedIds = [];

      enemies.forEach((enemy) => {
        enemy.y += gameRef.current.speed * dt;
        const node = enemyNodesRef.current.get(enemy.id);

        if (node) {
          node.style.top = `${enemy.y}px`;
          node.style.left = `${enemy.x}%`;
        }

        const nodeHeight = node?.offsetHeight ?? 88;
        const limit = field.clientHeight - nodeHeight - 18;
        if (enemy.y >= limit) {
          breachedIds.push(enemy.id);
        }
      });

      updateDangerState(enemies, field);

      if (breachedIds.length > 0) {
        onEnemiesReachBase(breachedIds);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [game.running, game.enemies.length]);

  function updateProfile(updater) {
    const next = typeof updater === "function" ? updater(profileRef.current) : updater;
    profileRef.current = next;
    setProfile(next);
    return next;
  }

  function updateGame(updater) {
    const next = typeof updater === "function" ? updater(gameRef.current) : updater;
    gameRef.current = next;
    enemiesRef.current = next.enemies;
    setGame(next);
    return next;
  }

  function upsertReviewWord(word, patch = {}) {
    const id = buildWordId(word);
    const existing = sessionRef.current.reviewMap.get(id) || {
      id,
      en: word.en,
      zh: word.zh,
      zhAliases: Array.isArray(word.zhAliases) ? word.zhAliases : [],
      partOfSpeech: word.partOfSpeech || "暂无",
      defEn: word.defEn || "",
      synonym: word.synonym || "",
      example: word.example || "",
      points: Number(word.points) || gameRef.current.points,
      timesSeen: 0,
      correctCount: 0,
      missedCount: 0,
      assistedCount: 0,
      lastOutcome: "已出现"
    };

    sessionRef.current.reviewMap.set(id, {
      ...existing,
      ...patch,
      en: word.en,
      zh: word.zh,
      zhAliases: Array.isArray(word.zhAliases) ? word.zhAliases : existing.zhAliases,
      partOfSpeech: word.partOfSpeech || existing.partOfSpeech || "暂无",
      defEn: word.defEn || existing.defEn || "",
      synonym: word.synonym || existing.synonym || "",
      example: word.example || existing.example || "",
      points: Number(word.points) || existing.points
    });
  }

  function recordReviewSpawn(word) {
    const id = buildWordId(word);
    const existing = sessionRef.current.reviewMap.get(id);
    upsertReviewWord(word, {
      timesSeen: (existing?.timesSeen || 0) + 1
    });
  }

  function recordReviewOutcome(word, outcome) {
    const id = buildWordId(word);
    const existing = sessionRef.current.reviewMap.get(id);
    const patch = { lastOutcome: outcome };

    if (outcome === "已答对") {
      patch.correctCount = (existing?.correctCount || 0) + 1;
    }
    if (outcome === "已漏掉") {
      patch.missedCount = (existing?.missedCount || 0) + 1;
    }
    if (outcome === "道具处理") {
      patch.assistedCount = (existing?.assistedCount || 0) + 1;
    }

    upsertReviewWord(word, patch);
  }

  function recordMissedWords(words) {
    if (!words.length) return;
    const source = getModeDisplayName(gameRef.current.mode);
    updateProfile((prev) => addMistakesToProfile(prev, words, source));
  }

  function applyMistakePenalty() {
    return updateGame((prev) =>
      applyBattleMomentum({
        ...prev,
        combo: 0,
        mistakeStreak: prev.mistakeStreak + 1
      })
    );
  }

  function markMistakeCorrect(word) {
    const id = buildWordId(word);

    updateProfile((prev) => {
      const mistakes = normalizeMistakeBook(prev.mistakes);
      let changed = false;
      const nextMistakes = [];
      const timestamp = Date.now();

      mistakes.forEach((entry) => {
        if (entry.id !== id) {
          nextMistakes.push(entry);
          return;
        }

        changed = true;
        const nextStreak = entry.correctStreak + 1;
        if (nextStreak < MASTERED_STREAK) {
          nextMistakes.push({
            ...entry,
            correctStreak: nextStreak,
            lastPracticedAt: timestamp
          });
        }
      });

      return changed ? { ...prev, mistakes: nextMistakes } : prev;
    });
  }

  function registerEnemyNode(id, node) {
    if (node) {
      enemyNodesRef.current.set(id, node);
      return;
    }
    enemyNodesRef.current.delete(id);
  }

  function getAudioContext() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function playTone({ freq, duration = 0.1, type = "square", gain = 0.04, slideTo = null, delay = 0 }) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), startAt + duration);
    }

    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  function playSfx(type, meta = {}) {
    try {
      if (type === "spawn") {
        playTone({ freq: 260, duration: 0.06, gain: 0.03, type: "triangle", slideTo: 330 });
        return;
      }
      if (type === "hit") {
        const combo = Number(meta.combo) || 0;
        const bonus = Math.min(combo, 10) * 24;
        playTone({ freq: 760 + bonus, duration: 0.08, gain: 0.06, type: "square", slideTo: 520 + bonus });
        playTone({ freq: 980 + bonus, duration: 0.07, gain: 0.04, type: "triangle", delay: 0.035 });
        playTone({ freq: 620 + bonus * 0.45, duration: 0.09, gain: 0.025, type: "triangle", delay: 0.075 });
        return;
      }
      if (type === "combo") {
        const combo = Number(meta.combo) || 2;
        const freq = Math.min(520 + combo * 36, 1100);
        playTone({ freq, duration: 0.05, gain: 0.045, type: "square", slideTo: freq + 90 });
        return;
      }
      if (type === "wrong") {
        playTone({ freq: 250, duration: 0.05, gain: 0.03, type: "square", slideTo: 210 });
        playTone({ freq: 180, duration: 0.14, gain: 0.045, type: "sawtooth", slideTo: 118, delay: 0.03 });
        return;
      }
      if (type === "damage") {
        playTone({ freq: 150, duration: 0.2, gain: 0.05, type: "sawtooth", slideTo: 70 });
        return;
      }
      if (type === "warning") {
        const critical = meta.level === "critical";
        playTone({ freq: critical ? 420 : 360, duration: 0.07, gain: 0.05, type: "square", slideTo: critical ? 340 : 300 });
        playTone({ freq: critical ? 290 : 240, duration: 0.08, gain: 0.03, type: "triangle", delay: 0.08 });
        return;
      }
      if (type === "buy") {
        playTone({ freq: 520, duration: 0.06, gain: 0.04, type: "triangle" });
        playTone({ freq: 770, duration: 0.08, gain: 0.04, type: "triangle", delay: 0.05 });
        return;
      }
      if (type === "start") {
        playTone({ freq: 330, duration: 0.08, gain: 0.04, type: "triangle" });
        playTone({ freq: 430, duration: 0.08, gain: 0.04, type: "triangle", delay: 0.08 });
        playTone({ freq: 620, duration: 0.12, gain: 0.04, type: "triangle", delay: 0.16 });
        return;
      }
      if (type === "win") {
        playTone({ freq: 520, duration: 0.08, gain: 0.04, type: "triangle" });
        playTone({ freq: 720, duration: 0.1, gain: 0.04, type: "triangle", delay: 0.1 });
        playTone({ freq: 920, duration: 0.14, gain: 0.05, type: "triangle", delay: 0.2 });
        return;
      }
      if (type === "lose") {
        playTone({ freq: 220, duration: 0.12, gain: 0.05, type: "sawtooth" });
        playTone({ freq: 170, duration: 0.18, gain: 0.05, type: "sawtooth", delay: 0.12 });
      }
    } catch (_error) {
      // Audio is optional and should never block gameplay.
    }
  }

  function flashBattlefield() {
    setBattlefieldPulse(true);
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setBattlefieldPulse(false);
    }, 240);
  }

  function flashRewardPulse() {
    setRewardPulse(true);
    if (rewardPulseTimerRef.current) {
      clearTimeout(rewardPulseTimerRef.current);
    }
    rewardPulseTimerRef.current = window.setTimeout(() => {
      setRewardPulse(false);
      rewardPulseTimerRef.current = null;
    }, 220);
  }

  function updateDangerState(enemies, field) {
    if (!field || enemies.length === 0) {
      if (dangerLevelRef.current) {
        dangerLevelRef.current = "";
        setDangerLevel("");
      }
      return;
    }

    let maxThreat = 0;
    enemies.forEach((enemy) => {
      const node = enemyNodesRef.current.get(enemy.id);
      const nodeHeight = node?.offsetHeight ?? 88;
      const limit = field.clientHeight - nodeHeight - 18;
      if (limit <= 0) return;
      maxThreat = Math.max(maxThreat, enemy.y / limit);
    });

    const nextLevel = maxThreat >= 0.88 ? "critical" : maxThreat >= 0.72 ? "warning" : "";
    if (nextLevel === dangerLevelRef.current) return;

    dangerLevelRef.current = nextLevel;
    setDangerLevel(nextLevel);

    if (!nextLevel) return;

    const now = Date.now();
    const cooldown = nextLevel === "critical" ? 650 : 900;
    if (now - warningSfxAtRef.current >= cooldown) {
      warningSfxAtRef.current = now;
      playSfx("warning", { level: nextLevel });
    }
  }

  function triggerComboFlash(combo) {
    const step = getComboFlashStep(combo);
    if (!step) return;

    setComboFlash({
      combo,
      label: `${combo} 连`,
      accent: step.accent,
      subline: step.subline
    });

    if (comboFlashTimerRef.current) {
      clearTimeout(comboFlashTimerRef.current);
    }

    comboFlashTimerRef.current = window.setTimeout(() => {
      setComboFlash(null);
      comboFlashTimerRef.current = null;
    }, 900);
  }

  function spawnBurst(enemy, mode = "hit") {
    const field = battlefieldRef.current;
    const node = enemyNodesRef.current.get(enemy.id);
    if (!field || !node) return;

    const fieldRect = field.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const left = nodeRect.left + nodeRect.width / 2 - fieldRect.left;
    const top =
      mode === "ground"
        ? field.clientHeight - 28
        : nodeRect.top + nodeRect.height / 2 - fieldRect.top;
    const particleCount = mode === "ground" ? 32 : mode === "skip" ? 26 : 22;
    const spread = mode === "ground" ? 150 : mode === "skip" ? 124 : 108;
    const particles = Array.from({ length: particleCount }, () => {
      const dx = (Math.random() - 0.5) * spread;
      const dy = mode === "ground" ? -Math.random() * 110 + Math.random() * 25 : (Math.random() - 0.5) * spread;
      return {
        dx: `${dx}px`,
        dy: `${dy}px`,
        size: `${mode === "ground" ? 4 + Math.random() * 4 : mode === "skip" ? 4 + Math.random() * 3 : 3.5 + Math.random() * 3}px`
      };
    });

    setBursts((prev) => [...prev, { id, left, top, mode, particles }]);

    const timer = window.setTimeout(() => {
      setBursts((prev) => prev.filter((burst) => burst.id !== id));
      burstTimersRef.current.delete(timer);
    }, mode === "ground" ? 640 : 460);

    burstTimersRef.current.add(timer);
  }

  function clearSessionActivity() {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
    }
    if (freezeTimerRef.current) {
      clearTimeout(freezeTimerRef.current);
      freezeTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (dangerLevelRef.current) {
      dangerLevelRef.current = "";
      setDangerLevel("");
    }
    if (comboFlashTimerRef.current) {
      clearTimeout(comboFlashTimerRef.current);
      comboFlashTimerRef.current = null;
    }
    lastTsRef.current = 0;
  }

  function queueSpawnTick(delay) {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
    }

    const wait = delay ?? gameRef.current.spawnDelay;
    spawnTimerRef.current = window.setTimeout(() => {
      const current = gameRef.current;
      if (!current.running) return;

      if (current.spawnedEnemies >= current.totalEnemies) {
        if (current.enemies.length === 0) {
          finishBattle(true);
        }
        return;
      }

      if (current.enemies.length >= current.maxConcurrent) {
        queueSpawnTick(160);
        return;
      }

      spawnEnemy();

      const latest = gameRef.current;
      if (latest.spawnedEnemies < latest.totalEnemies) {
        queueSpawnTick(latest.spawnDelay);
      }
    }, wait);
  }

  function finishBattle(winLike) {
    clearSessionActivity();
    const snapshot = gameRef.current;
    const earned = snapshot.score;
    const review =
      sessionRef.current.reviewMap.size > 0
        ? Array.from(sessionRef.current.reviewMap.values())
        : buildReviewWords(sessionRef.current.seenWords);
    const nextWallet = profileRef.current.wallet + earned;

    updateProfile((prev) => ({
      ...prev,
      wallet: nextWallet,
      lifetimeScore: (prev.lifetimeScore || 0) + earned
    }));

    updateGame((prev) => ({
      ...prev,
      running: false,
      frozen: false,
      enemies: []
    }));

    setReviewWords(review);
    setResultSummary(
      winLike
        ? `防守成功。总击杀 ${snapshot.kills}，本局积分 ${earned}，已写入总积分（当前 ${nextWallet}）。`
        : `基地失守。你仍击杀 ${snapshot.kills} 个怪物，本局积分 ${earned}，已写入总积分（当前 ${nextWallet}）。`
    );
    setScreen("result");
    playSfx(winLike ? "win" : "lose");
  }

  function spawnEnemy() {
    const current = gameRef.current;
    if (current.spawnedEnemies >= current.totalEnemies) {
      if (current.enemies.length === 0) {
        finishBattle(true);
      }
      return;
    }

    const lane = pickLane(current.enemies);
    const word = sessionRef.current.wordPool[current.spawnedEnemies];
    const enemy = {
      id: enemyIdRef.current++,
      laneIndex: lane.laneIndex,
      x: lane.x,
      y: START_Y,
      ...word,
      points: word.points || current.points
    };

    sessionRef.current.seenWords.push(word);
    recordReviewSpawn(word);

    updateGame((prev) => ({
      ...prev,
      spawnedEnemies: prev.spawnedEnemies + 1,
      enemies: [...prev.enemies, enemy]
    }));

    playSfx("spawn");
  }

  function onEnemiesReachBase(enemyIds) {
    const current = gameRef.current;
    const breached = current.enemies.filter((enemy) => enemyIds.includes(enemy.id));
    if (breached.length === 0) return;

    breached.forEach((enemy) => spawnBurst(enemy, "ground"));
    breached.forEach((enemy) => recordReviewOutcome(enemy, "已漏掉"));
    recordMissedWords(breached);
    flashBattlefield();
    playSfx("damage");

    const survivors = current.enemies.filter((enemy) => !enemyIds.includes(enemy.id));
    const nextHp = Math.max(current.hp - breached.length, 0);

    updateGame((prev) =>
      applyBattleMomentum({
        ...prev,
        hp: nextHp,
        combo: 0,
        mistakeStreak: prev.mistakeStreak + 1,
        enemies: prev.enemies.filter((enemy) => !enemyIds.includes(enemy.id))
      })
    );

    setGameMessage({
      text: `${breached.length} 个怪物突破防线，基地 -${breached.length} 血量。`,
      type: "bad"
    });

    if (nextHp <= 0) {
      window.setTimeout(() => finishBattle(false), 280);
      return;
    }

    if (current.spawnedEnemies >= current.totalEnemies && survivors.length === 0) {
      window.setTimeout(() => finishBattle(true), 260);
      return;
    }

    if (current.spawnedEnemies < current.totalEnemies) {
      queueSpawnTick(140);
    }
  }

  function killEnemy(enemyId, reason, options = {}) {
    const current = gameRef.current;
    const enemy = current.enemies.find((item) => item.id === enemyId);
    if (!enemy) return;

    const countsAsCombo = Boolean(options.countsAsCombo);
    const nextCombo = countsAsCombo ? current.combo + 1 : current.combo;
    const nextMistakeStreak = countsAsCombo ? 0 : current.mistakeStreak;
    const nextMomentum = applyBattleMomentum({
      ...current,
      combo: nextCombo,
      mistakeStreak: nextMistakeStreak
    });
    const gained = Math.round(enemy.points * nextMomentum.scoreMultiplier);

    spawnBurst(enemy, reason.includes("秒杀") ? "skip" : "hit");
    if (reason.includes("秒杀")) {
      recordReviewOutcome(enemy, "道具处理");
    } else {
      recordReviewOutcome(enemy, "已答对");
      markMistakeCorrect(enemy);
    }
    flashRewardPulse();
    playSfx("hit", { combo: nextCombo });
    if (countsAsCombo && nextCombo >= 2) {
      playSfx("combo", { combo: nextCombo });
    }

    const survivors = current.enemies.filter((item) => item.id !== enemyId);

    updateGame((prev) =>
      applyBattleMomentum({
        ...prev,
        combo: countsAsCombo ? prev.combo + 1 : prev.combo,
        mistakeStreak: countsAsCombo ? 0 : prev.mistakeStreak,
        kills: prev.kills + 1,
        score: prev.score + gained,
        enemies: prev.enemies.filter((item) => item.id !== enemyId)
      })
    );

    if (countsAsCombo) {
      triggerComboFlash(nextCombo);
    }

    const comboText =
      countsAsCombo && nextCombo >= 2
        ? ` 连击 ${nextCombo}，倍率 x${nextMomentum.scoreMultiplier.toFixed(2)}。`
        : "";
    setGameMessage({ text: `${reason}，+${gained} 分。${comboText}`.trim(), type: "ok" });

    if (current.spawnedEnemies >= current.totalEnemies && survivors.length === 0) {
      window.setTimeout(() => finishBattle(true), 220);
      return;
    }

    if (current.spawnedEnemies < current.totalEnemies) {
      queueSpawnTick(120);
    }
  }

  function startGame(mode, customWords = null, speedOverride = null) {
    const base = difficultyConfig[mode] || difficultyConfig.easy;
    const selectedWords = pickRoundWords(customWords || base.words, mode);
    const words = selectedWords.map((word) => ({
      ...word,
      points: word.points || base.points,
      acceptedAnswers: buildAcceptedAnswers(word)
    }));
    const wave = getWaveConfig(mode, speedOverride);

    sessionRef.current = {
      wordPool: words,
      seenWords: [],
      reviewMap: new Map()
    };

    const baseGame = {
      mode,
      hp: base.hp,
      maxHp: base.hp,
      score: 0,
      kills: 0,
      combo: 0,
      mistakeStreak: 0,
      skipBullets: 0,
      baseSpeed: speedOverride || base.speed,
      speed: speedOverride || base.speed,
      points: base.points,
      baseScoreMultiplier: 1,
      scoreMultiplier: 1,
      totalEnemies: words.length,
      spawnedEnemies: 0,
      enemies: [],
      maxConcurrent: wave.maxConcurrent,
      spawnDelay: wave.spawnDelay,
      frozen: false,
      running: true
    };

    const { nextProfile, nextGame, activated } = applyInventoryBuffs(profileRef.current, baseGame);

    clearSessionActivity();
    setAnswer("");
    setBursts([]);
    setBattlefieldPulse(false);
    setComboFlash(null);
    setScreen("game");
    updateProfile(nextProfile);
    updateGame(nextGame);
    setGameMessage({
      text: `模式：${getModeDisplayName(mode)}，开始守卫基地！${activated.length ? ` 已启用：${activated.join("、")}。` : ""}`,
      type: "ok"
    });
    playSfx("start");
    spawnEnemy();
    if (nextGame.spawnedEnemies < nextGame.totalEnemies) {
      queueSpawnTick(nextGame.spawnDelay);
    }
  }

  function handleModeSelect(mode) {
    setSelectedMode(mode);
    if (mode === "custom") {
      setShowCustom(true);
      setHomeNote("已选中自定义模式。你可以编辑单词列表和怪物速度，然后开始挑战。");
      return;
    }

    setShowCustom(false);
    setHomeNote(`已选中${getModeDisplayName(mode)}。确认后点击开始挑战。`);
  }

  function handleHomeStart() {
    if (selectedMode === "custom") {
      handleCustomStart();
      return;
    }

    startGame(selectedMode);
  }

  function handleCustomStart() {
    const words = parseCustomWords(customWordsText);
    if (words.length < 3) {
      setHomeNote("自定义模式至少需要 3 个单词，格式为 english:中文（可选别名 english:中文|别名1|别名2）。");
      return;
    }

    startGame("custom", words, Number(customSpeed));
  }

  function startMistakePractice() {
    const mistakes = normalizeMistakeBook(profileRef.current.mistakes);
    if (mistakes.length === 0) {
      setHomeNote("错题本还是空的。先玩一局，漏掉的单词会自动收进错题本。");
      setScreen("home");
      return;
    }

    const words = mistakes.map((entry) => ({
      en: entry.en,
      zh: entry.zh,
      zhAliases: entry.zhAliases,
      partOfSpeech: entry.partOfSpeech,
      points: entry.points,
      defEn: entry.defEn || `错题本单词：${entry.en}`,
      synonym: entry.synonym || "暂无",
      example: entry.example || `这次练习重点复习 ${entry.en}。`
    }));

    setShowCustom(false);
    startGame("mistakes", words, 75);
  }

  function markMistakeMastered(id) {
    updateProfile((prev) => ({
      ...prev,
      mistakes: normalizeMistakeBook(prev.mistakes).filter((entry) => entry.id !== id)
    }));
  }

  function buyShopItem(itemId) {
    const item = shopItems.find((entry) => entry.id === itemId);
    if (!item) return;

    if (profileRef.current.wallet < item.cost) {
      setShopMessage({ text: "积分不足，暂时买不了这个道具。", type: "bad" });
      return;
    }

    updateProfile((prev) => ({
      ...prev,
      wallet: prev.wallet - item.cost,
      inventory: {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + 1
      }
    }));
    playSfx("buy");
    setShopMessage({ text: `购买成功：${item.name} +1`, type: "ok" });
  }

  function buySkipInBattle() {
    const current = gameRef.current;
    if (current.score < 30) {
      setGameMessage({ text: "积分不足，至少需要 30 分。", type: "bad" });
      return;
    }

    updateGame((prev) => ({
      ...prev,
      score: prev.score - 30,
      skipBullets: prev.skipBullets + 1
    }));
    playSfx("buy");
    setGameMessage({ text: "兑换成功，秒杀子弹 +1。", type: "ok" });
  }

  function useSkip() {
    const current = gameRef.current;
    if (current.skipBullets <= 0) {
      setGameMessage({ text: "你还没有秒杀子弹。", type: "bad" });
      return;
    }
    if (current.enemies.length === 0) {
      setGameMessage({ text: "当前没有怪物可秒杀。", type: "bad" });
      return;
    }

    const target = [...current.enemies].sort((a, b) => b.y - a.y)[0];

    updateGame((prev) => ({
      ...prev,
      skipBullets: prev.skipBullets - 1
    }));
    killEnemy(target.id, "秒杀子弹命中");
  }

  function useFreezeBomb() {
    const current = gameRef.current;
    const count = profileRef.current.inventory.freezeBomb || 0;

    if (!current.running) {
      setGameMessage({ text: "战斗开始后才能使用冻结脉冲。", type: "bad" });
      return;
    }
    if (count <= 0) {
      setGameMessage({ text: "库存里没有冻结脉冲，可以先去商店购买。", type: "bad" });
      return;
    }
    if (current.enemies.length === 0) {
      setGameMessage({ text: "当前没有怪物，先留着冻结脉冲。", type: "bad" });
      return;
    }

    updateProfile((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        freezeBomb: Math.max((prev.inventory.freezeBomb || 0) - 1, 0)
      }
    }));

    updateGame((prev) => ({
      ...prev,
      frozen: true
    }));

    if (freezeTimerRef.current) {
      clearTimeout(freezeTimerRef.current);
    }
    freezeTimerRef.current = window.setTimeout(() => {
      updateGame((prev) => ({
        ...prev,
        frozen: false
      }));
      freezeTimerRef.current = null;
    }, 3000);

    playSfx("buy");
    setGameMessage({ text: "冻结脉冲启动，场上怪物暂停 3 秒。", type: "ok" });
  }

  function useClearBomb() {
    const current = gameRef.current;
    const count = profileRef.current.inventory.clearBomb || 0;

    if (!current.running) {
      setGameMessage({ text: "战斗开始后才能使用清屏炸弹。", type: "bad" });
      return;
    }
    if (count <= 0) {
      setGameMessage({ text: "库存里没有清屏炸弹，可以先去商店购买。", type: "bad" });
      return;
    }
    if (current.enemies.length === 0) {
      setGameMessage({ text: "当前没有怪物，清屏炸弹先别浪费。", type: "bad" });
      return;
    }

    const targets = [...current.enemies];
    const gained = targets.reduce(
      (total, enemy) => total + Math.round(enemy.points * current.scoreMultiplier),
      0
    );

    targets.forEach((enemy) => {
      spawnBurst(enemy, "skip");
      recordReviewOutcome(enemy, "道具处理");
    });

    updateProfile((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        clearBomb: Math.max((prev.inventory.clearBomb || 0) - 1, 0)
      }
    }));

    updateGame((prev) => ({
      ...prev,
      kills: prev.kills + targets.length,
      score: prev.score + gained,
      enemies: []
    }));

    playSfx("hit");
    setGameMessage({ text: `清屏炸弹清除了 ${targets.length} 个怪物，+${gained} 分。`, type: "ok" });

    if (current.spawnedEnemies >= current.totalEnemies) {
      window.setTimeout(() => finishBattle(true), 260);
      return;
    }

    queueSpawnTick(180);
  }

  function submitAnswer() {
    const current = gameRef.current;
    if (!current.running || current.enemies.length === 0) return;

    const input = normalizeAnswer(answer);
    if (!input) {
      setGameMessage({ text: "请输入中文翻译后再发射。", type: "bad" });
      return;
    }

    const matched = current.enemies.find((enemy) => {
      const accepted = enemy.acceptedAnswers || [normalizeAnswer(enemy.zh)];
      return accepted.includes(input);
    });
    if (matched) {
      killEnemy(matched.id, "命中", { countsAsCombo: true });
      setAnswer("");
      return;
    }

    const penalized = applyMistakePenalty();
    playSfx("wrong");
    const slowText =
      penalized.mistakeStreak >= 2
        ? ` 失误连段 ${penalized.mistakeStreak}，怪物速度降到 ${Math.round((penalized.speed / penalized.baseSpeed) * 100)}%。`
        : "";
    setGameMessage({ text: `没有匹配到场上任意一个单词的翻译。${slowText}`, type: "bad" });
  }

  const inventoryText = useMemo(() => buildInventoryText(profile), [profile]);
  const progressStats = useMemo(() => buildPlayerProgress(profile.lifetimeScore), [profile.lifetimeScore]);
  const levelRoadmap = useMemo(() => buildLevelRoadmap(), []);
  const remaining = Math.max(game.totalEnemies - game.spawnedEnemies + game.enemies.length, 0);
  const progress = game.totalEnemies
    ? Math.min(((game.kills + (game.maxHp - game.hp)) / game.totalEnemies) * 100, 100)
    : 0;

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true" />

      <main className="shell">
        {screen === "home" && (
          <HomeScreen
            profile={profile}
            inventoryText={inventoryText}
            homeNote={homeNote}
            showCustom={showCustom}
            customWordsText={customWordsText}
            customSpeed={customSpeed}
            mistakeCount={profile.mistakes.length}
            progressStats={progressStats}
            selectedMode={selectedMode}
            onWordsChange={setCustomWordsText}
            onSpeedChange={setCustomSpeed}
            onToggleMode={handleModeSelect}
            onStartSelected={handleHomeStart}
            onCustomStart={handleCustomStart}
            onOpenMistakes={() => setScreen("mistakes")}
            onStartMistakePractice={startMistakePractice}
            onOpenProgress={() => setScreen("progress")}
            onOpenShop={() => {
              setShopMessage({ text: "被动道具会在下一局自动加载，主动道具可在战斗中点击使用。", type: "ok" });
              setScreen("shop");
            }}
          />
        )}

        {screen === "progress" && (
          <ProgressRoadScreen
            progressStats={progressStats}
            roadmap={levelRoadmap}
            totalXp={profile.lifetimeScore}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "shop" && (
          <ShopScreen
            wallet={profile.wallet}
            inventory={profile.inventory}
            shopMessage={shopMessage}
            onBuy={buyShopItem}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "mistakes" && (
          <MistakeBookScreen
            mistakes={profile.mistakes}
            onBack={() => setScreen("home")}
            onMarkMastered={markMistakeMastered}
            onStartPractice={startMistakePractice}
          />
        )}

        {screen === "game" && (
          <GameScreen
            answer={answer}
            battlefieldPulse={battlefieldPulse}
            battlefieldRef={battlefieldRef}
            bursts={bursts}
            comboFlash={comboFlash}
            dangerLevel={dangerLevel}
            enemies={game.enemies}
            game={game}
            gameMessage={gameMessage}
            inventory={profile.inventory}
            progress={progress}
            rewardPulse={rewardPulse}
            registerEnemyNode={registerEnemyNode}
            remaining={remaining}
            onAnswerChange={setAnswer}
            onBuySkip={buySkipInBattle}
            onUseClearBomb={useClearBomb}
            onUseFreezeBomb={useFreezeBomb}
            onSubmitAnswer={submitAnswer}
            onUseSkip={useSkip}
          />
        )}

        {screen === "result" && (
          <ResultScreen
            resultSummary={resultSummary}
            reviewWords={reviewWords}
            onBack={() => setScreen("home")}
          />
        )}
      </main>
    </div>
  );
}

function AnimatedNumber({ value, duration = 500 }) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const startValue = display;
    const delta = value - startValue;
    const startAt = performance.now();

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    if (delta === 0) {
      setDisplay(value);
      return undefined;
    }

    const tick = (now) => {
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(startValue + delta * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return <>{display}</>;
}

function HomeScreen({
  profile,
  inventoryText,
  homeNote,
  showCustom,
  customWordsText,
  customSpeed,
  mistakeCount,
  progressStats,
  selectedMode,
  onWordsChange,
  onSpeedChange,
  onToggleMode,
  onStartSelected,
  onCustomStart,
  onOpenMistakes,
  onStartMistakePractice,
  onOpenProgress,
  onOpenShop
}) {
  const selectedModeMeta = HOME_MODE_OPTIONS.find((mode) => mode.id === selectedMode) || HOME_MODE_OPTIONS[0];

  return (
    <section className="screen active home-screen">
      <div className="terminal-window game-menu-shell">
        <header className="terminal-header menu-header">
          <span>单词堡垒</span>
          <span>准备开始</span>
        </header>

        <div className="terminal-body">
          <div className="menu-layout">
            <section className="menu-hero">
              <span className="eyebrow">词义防线</span>
              <h1>单词堡垒</h1>
              <p className="subtitle">选一个关卡，输入中文翻译，守住基地。</p>
            </section>

            <section className="menu-core">
              <span className="ambient-orb orb-a" aria-hidden="true" />
              <span className="ambient-orb orb-b" aria-hidden="true" />
              <span className="ambient-orb orb-c" aria-hidden="true" />

              <div className="core-topline">
                <section className="xp-panel xp-hero-panel">
                  <div className="xp-topline">
                    <div className="xp-chip">
                      <span className="label">等级</span>
                      <strong>
                        Lv <AnimatedNumber value={progressStats.level} duration={700} />
                      </strong>
                    </div>
                    <div className="xp-meta">
                      <span>{progressStats.title}</span>
                      <span>
                        XP <AnimatedNumber value={progressStats.currentXp} duration={700} /> /{" "}
                        <AnimatedNumber value={progressStats.nextXp} duration={700} />
                      </span>
                    </div>
                  </div>
                  <div className="xp-track">
                    <div className="xp-fill" style={{ width: `${Math.max(progressStats.ratio * 100, 6)}%` }} />
                  </div>
                  <div className="xp-actions">
                    <button className="xp-detail-button" onClick={onOpenProgress} type="button">
                      查看成长路线
                    </button>
                  </div>
                </section>

                <div className="start-cluster">
                  <span className="selected-mode-chip">当前关卡：{selectedModeMeta.label}</span>
                  <button className="start-button" onClick={onStartSelected} type="button">
                    开始挑战
                  </button>
                  <p className="start-hint">
                    {selectedMode === "custom" ? "先确认词库和速度，再进入自定义战斗。" : "确认模式后立即开始一局。"}
                  </p>
                </div>
              </div>

              <section className="mode-select-stage">
                <div className="mode-grid">
                  {HOME_MODE_OPTIONS.map((mode) => (
                    <button
                      className={`mode-card${selectedMode === mode.id ? " selected" : ""}`}
                      key={mode.id}
                      onClick={() => onToggleMode(mode.id)}
                      type="button"
                    >
                      <span className="mode-icon">{mode.icon}</span>
                      <span className="mode-name">{mode.label}</span>
                      <span className="mode-desc">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </section>

              {showCustom && (
                <div className="custom-panel">
                  <label className="label" htmlFor="custom-words">
                    自定义词库
                  </label>
                  <textarea
                    id="custom-words"
                    rows="7"
                    value={customWordsText}
                    onChange={(event) => onWordsChange(event.target.value)}
                  />

                  <label className="label" htmlFor="custom-speed">
                    怪物速度
                  </label>
                  <input
                    id="custom-speed"
                    max="160"
                    min="40"
                    type="range"
                    value={customSpeed}
                    onChange={(event) => onSpeedChange(Number(event.target.value))}
                  />
                  <div className="speed-line">当前速度：{customSpeed} 像素/秒</div>

                  <button className="custom-start-button" onClick={onCustomStart} type="button">
                    立即开始自定义关卡
                  </button>
                </div>
              )}
            </section>

            <section className="support-strip">
              <article className="support-card points-card">
                <span className="label">积分</span>
                <strong className="support-value">
                  <AnimatedNumber value={profile.wallet} />
                </strong>
                <p className="support-note">累计积分会同步为等级经验。</p>
              </article>

              <article className="support-card">
                <span className="label">道具</span>
                <p className="support-note">{inventoryText}</p>
                <div className="support-actions">
                  <button className="support-button" onClick={onOpenShop} type="button">
                    商店
                  </button>
                </div>
              </article>

              <article className="support-card">
                <span className="label">错题</span>
                <strong className="support-value">
                  <AnimatedNumber value={mistakeCount} />
                </strong>
                <div className="support-actions">
                  <button className="support-button" onClick={onOpenMistakes} type="button">
                    查看
                  </button>
                  <button className="support-button" onClick={onStartMistakePractice} type="button">
                    练习
                  </button>
                </div>
              </article>

              <article className="support-card muted">
                <span className="label">提示</span>
                <p className="support-note">{homeNote}</p>
              </article>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatMistakeDate(timestamp) {
  if (!timestamp) return "暂无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatWordDetail(value) {
  return value || "暂无";
}

function ProgressRoadScreen({ progressStats, roadmap, totalXp, onBack }) {
  return (
    <section className="screen active">
      <div className="terminal-window">
        <header className="terminal-header">
          <span>成长路线</span>
          <span>Lv {progressStats.level}</span>
        </header>

        <div className="terminal-body">
          <div className="progress-road-head">
            <div>
              <h2>等级与经验规则</h2>
              <p className="subtitle">每一局获得的积分会同时计入总经验。等级越高，下一等级需要的经验越多。</p>
            </div>
            <div className="road-summary-card">
              <span className="label">当前进度</span>
              <strong>
                Lv <AnimatedNumber value={progressStats.level} duration={700} />
              </strong>
              <p>{progressStats.title}</p>
              <p>
                总经验 <AnimatedNumber value={totalXp} duration={800} />
              </p>
            </div>
          </div>

          <section className="road-rule-strip">
            <article className="road-rule-card">
              <span className="label">经验来源</span>
              <strong>每局积分 = 等级经验</strong>
              <p>不管输赢，只要本局结算拿到积分，就会写入成长路线。</p>
            </article>
            <article className="road-rule-card">
              <span className="label">当前等级</span>
              <strong>
                {progressStats.currentXp} / {progressStats.nextXp}
              </strong>
              <p>这是你在当前等级内的进度，不是总经验。</p>
            </article>
            <article className="road-rule-card">
              <span className="label">升级规律</span>
              <strong>120 起步，每级 +70</strong>
              <p>前期升级快，后期会更像荣誉之路，越往后越需要积累。</p>
            </article>
          </section>

          <section className="roadmap-panel">
            <div className="roadmap-track" aria-hidden="true" />
            <div className="roadmap-list">
              {roadmap.map((node) => {
                const reached = totalXp >= node.totalXpToNext;
                const isCurrent =
                  totalXp >= node.totalXpToReach && totalXp < node.totalXpToNext;

                return (
                  <article
                    className={`road-node${reached ? " reached" : ""}${isCurrent ? " current" : ""}`}
                    key={node.level}
                  >
                    <div className="road-badge">
                      <span>Lv</span>
                      <strong>{node.level}</strong>
                    </div>

                    <div className="road-card">
                      <div className="road-card-head">
                        <div>
                          <h3>{node.title}</h3>
                          <p>
                            升到 Lv {node.level + 1} 需要 {node.needXp} 经验
                          </p>
                        </div>
                        <span className="road-state">
                          {isCurrent ? "当前所处等级" : reached ? "已完成" : "未到达"}
                        </span>
                      </div>

                      <div className="road-card-grid">
                        <p>
                          <span>本级区间</span>
                          {node.totalXpToReach} - {node.totalXpToNext - 1} XP
                        </p>
                        <p>
                          <span>累计到达下一等级</span>
                          {node.totalXpToNext} XP
                        </p>
                        <p>
                          <span>说明</span>
                          {isCurrent
                            ? `你还差 ${Math.max(node.totalXpToNext - totalXp, 0)} XP 升到下一级。`
                            : reached
                              ? "这一段成长路线你已经走完了。"
                              : `到达这一等级前，累计还需要 ${Math.max(node.totalXpToReach - totalXp, 0)} XP。`}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <button className="back-button" onClick={onBack} type="button">
            返回主页
          </button>
        </div>
      </div>
    </section>
  );
}

function MistakeBookScreen({ mistakes, onBack, onMarkMastered, onStartPractice }) {
  const normalizedMistakes = normalizeMistakeBook(mistakes);

  return (
    <section className="screen active">
      <div className="terminal-window">
        <header className="terminal-header">
          <span>错题本</span>
          <span>{normalizedMistakes.length} 个待复习单词</span>
        </header>

        <div className="terminal-body">
          <div className="mistake-book-head">
            <div>
              <h2>需要重点复习的词</h2>
              <p className="subtitle">怪物触底的单词会自动保存到这里；连续答对 2 次后会自动移出错题本。</p>
            </div>
            <button disabled={normalizedMistakes.length === 0} onClick={onStartPractice} type="button">
              开始错题练习
            </button>
          </div>

          {normalizedMistakes.length === 0 ? (
            <div className="empty-book">
              <strong>错题本还是空的</strong>
              <p>先玩一局。漏掉的单词会自动进入这里，之后可以集中练习。</p>
            </div>
          ) : (
            <div className="mistake-list">
              {normalizedMistakes.map((entry) => (
                <details className="mistake-card" key={entry.id}>
                  <summary className="mistake-summary">
                    <span className="mistake-word">
                      <h3>{entry.en}</h3>
                      <strong>展开查看意思 / 词性 / 造句</strong>
                    </span>
                    <span className="mistake-meta-grid">
                      <span>错误 {entry.missedCount} 次</span>
                      <span>
                        连续答对 {entry.correctStreak}/{MASTERED_STREAK}
                      </span>
                      <span>来源：{entry.source}</span>
                      <span>最近出错：{formatMistakeDate(entry.lastMissedAt)}</span>
                    </span>
                    <span className="fold-indicator">展开</span>
                  </summary>

                  <div className="mistake-detail-grid">
                    <p className="mistake-detail-card detail-meaning">
                      <span>意思</span>
                      {entry.zh}
                    </p>
                    <p className="mistake-detail-card detail-short">
                      <span>词性</span>
                      {formatWordDetail(entry.partOfSpeech)}
                    </p>
                    <p className="mistake-detail-card detail-answer">
                      <span>可接受答案</span>
                      {buildReviewAnswerText(entry)}
                    </p>
                    <p className="mistake-detail-card detail-wide">
                      <span>造句</span>
                      {formatWordDetail(entry.example)}
                    </p>
                    <p className="mistake-detail-card detail-wide">
                      <span>英文释义</span>
                      {formatWordDetail(entry.defEn)}
                    </p>
                    <p className="mistake-detail-card detail-short">
                      <span>近义词</span>
                      {formatWordDetail(entry.synonym)}
                    </p>
                  </div>

                  <div className="mistake-actions">
                    <button onClick={() => onMarkMastered(entry.id)} type="button">
                      标记为已掌握
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}

          <button className="back-button" onClick={onBack} type="button">
            返回主页
          </button>
        </div>
      </div>
    </section>
  );
}

function ShopScreen({ wallet, inventory, shopMessage, onBuy, onBack }) {
  return (
    <section className="screen active">
      <div className="terminal-window">
        <header className="terminal-header">
          <span>道具商店</span>
          <span>{wallet} 积分</span>
        </header>

        <div className="terminal-body">
          <h2>战前补给</h2>

          <div className="shop-grid">
            {shopItems.map((item) => (
              <article className="shop-card" key={item.id}>
                <div className="shop-card-head">
                  <h3>{item.name}</h3>
                  <span>{item.cost}</span>
                </div>
                <p>{item.desc}</p>
                <div className="shop-meta">
                  <span>拥有：{inventory[item.id] || 0}</span>
                  <button disabled={wallet < item.cost} onClick={() => onBuy(item.id)} type="button">
                    购买
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className={`message ${shopMessage.type}`}>{shopMessage.text}</p>
          <button className="back-button" onClick={onBack} type="button">
            返回主页
          </button>
        </div>
      </div>
    </section>
  );
}

function GameScreen({
  answer,
  battlefieldPulse,
  battlefieldRef,
  bursts,
  comboFlash,
  dangerLevel,
  enemies,
  game,
  gameMessage,
  inventory,
  progress,
  rewardPulse,
  registerEnemyNode,
  remaining,
  onAnswerChange,
  onBuySkip,
  onUseClearBomb,
  onUseFreezeBomb,
  onSubmitAnswer,
  onUseSkip
}) {
  const feedbackTone = gameMessage.type === "bad" ? "error" : gameMessage.text ? "success" : "idle";
  const speedPercent = game.baseSpeed ? Math.round((game.speed / game.baseSpeed) * 100) : 100;
  const comboActive = game.combo >= 2;
  const mistakeSlow = game.mistakeStreak >= 2;
  const momentumText = comboActive
    ? `连击 ${game.combo} | 积分 x${game.scoreMultiplier.toFixed(2)} | 怪物速度 ${speedPercent}%`
    : mistakeSlow
      ? `失误连段 ${game.mistakeStreak} | 怪物减速到 ${speedPercent}%`
      : `当前倍率 x${game.scoreMultiplier.toFixed(2)} | 怪物速度 ${speedPercent}%`;

  return (
    <section className="screen active battle-screen">
      <div className="terminal-window battle-window">
        <header className="terminal-header battle-header">
          <span>战斗中</span>
          <span>守住基地</span>
        </header>

        <div className="terminal-body battle-body">
          <section
            className={`combat-field${battlefieldPulse ? " pulse" : ""}${rewardPulse ? " reward" : ""}${game.frozen ? " frozen" : ""}${dangerLevel ? ` danger-${dangerLevel}` : ""}`}
            ref={battlefieldRef}
          >
            <div className={`combat-hud${battlefieldPulse ? " damage" : ""}`}>
              <div className="combat-hud-main">
                <div className="hud-chip">
                  <span className="hud-label">击杀</span>
                  <strong>
                    <AnimatedNumber value={game.kills} duration={420} />
                  </strong>
                </div>
                <div className="hud-chip">
                  <span className="hud-label">分数</span>
                  <strong>
                    <AnimatedNumber value={game.score} duration={420} />
                  </strong>
                </div>
                <div className={`hud-chip hp-chip${battlefieldPulse ? " flash" : ""}`}>
                  <span className="hud-label">基地</span>
                  <div className="hud-hearts">
                    {Array.from({ length: game.maxHp }).map((_, index) => (
                      <span className={`heart${index < game.hp ? " live" : ""}`} key={`heart-${index}`}>
                        ♥
                      </span>
                    ))}
                  </div>
                </div>
                <div className="hud-chip">
                  <span className="hud-label">剩余</span>
                  <strong>
                    <AnimatedNumber value={remaining} duration={420} />
                  </strong>
                </div>
              </div>

              <div className="hud-progress-strip">
                <span className="hud-label">防守进度</span>
                <div className="hud-progress-bar">
                  <div className="hud-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {comboFlash && (
              <div className={`combo-flash combo-flash-${comboFlash.accent}`}>
                <span className="combo-flash-tag">{comboFlash.subline}</span>
                <strong>{comboFlash.label}</strong>
              </div>
            )}

            {dangerLevel && (
              <div className={`danger-alert danger-alert-${dangerLevel}`}>
                {dangerLevel === "critical" ? "基地告急" : "怪物逼近"}
              </div>
            )}

            <div className="lane-grid" aria-hidden="true">
              {ENEMY_LANES.map((lane, index) => (
                <span className="lane-line" key={`lane-${lane}-${index}`} />
              ))}
            </div>

            {game.frozen && <div className="freeze-badge">冻结中 3 秒</div>}

            {enemies.map((enemy) => (
              <div
                className="enemy combat-enemy"
                key={enemy.id}
                ref={(node) => registerEnemyNode(enemy.id, node)}
                style={{ left: `${enemy.x}%`, top: `${enemy.y}px` }}
              >
                <strong>{enemy.en}</strong>
                <span className="enemy-meta">第 {enemy.laneIndex + 1} 路</span>
              </div>
            ))}

            {bursts.map((burst) => (
              <div
                className={`burst burst-${burst.mode}`}
                key={burst.id}
                style={{ left: `${burst.left}px`, top: `${burst.top}px` }}
              >
                <span className="impact-core" />
                <span className="impact-ring" />
                {burst.particles.map((particle, index) => (
                  <span
                    className="pixel"
                    key={`${burst.id}-${index}`}
                    style={{ "--dx": particle.dx, "--dy": particle.dy, "--size": particle.size }}
                  />
                ))}
              </div>
            ))}

            <div className={`input-hud ${feedbackTone}`}>
              <span aria-hidden="true" className={`input-feedback-flash ${feedbackTone}`} key={`${gameMessage.type}:${gameMessage.text || "idle"}`} />
              <p className={`battle-momentum${comboActive ? " hot" : ""}${mistakeSlow ? " cool" : ""}`}>{momentumText}</p>

              <div className="input-topline">
                <div className="target-feed">
                  {enemies.length === 0 && <span className="target-chip idle">等待刷怪...</span>}
                  {enemies.map((enemy) => (
                    <span className="target-chip" key={`pill-${enemy.id}`}>
                      {enemy.en}
                    </span>
                  ))}
                </div>

                <div className="skill-bar">
                  <button className="skill-slot utility" onClick={onBuySkip} title="花 30 分兑换秒杀子弹" type="button">
                    <span className="skill-icon">$</span>
                    <span className="skill-count">30</span>
                    <span className="skill-text">换弹</span>
                  </button>
                  <button className="skill-slot" onClick={onUseSkip} title="秒杀子弹" type="button">
                    <span className="skill-icon">S</span>
                    <span className="skill-count">{game.skipBullets}</span>
                    <span className="skill-text">秒杀</span>
                  </button>
                  <button className="skill-slot" onClick={onUseFreezeBomb} title="冻结脉冲" type="button">
                    <span className="skill-icon">F</span>
                    <span className="skill-count">{inventory.freezeBomb || 0}</span>
                    <span className="skill-text">冻结</span>
                  </button>
                  <button className="skill-slot danger" onClick={onUseClearBomb} title="清屏炸弹" type="button">
                    <span className="skill-icon">B</span>
                    <span className="skill-count">{inventory.clearBomb || 0}</span>
                    <span className="skill-text">清屏</span>
                  </button>
                </div>
              </div>

              <div className="control-row">
                <div className="answer-row battle-answer-row">
                  <input
                    className="battle-input"
                    placeholder="输入中文翻译，命中任意怪物"
                    type="text"
                    value={answer}
                    onChange={(event) => onAnswerChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onSubmitAnswer();
                      }
                    }}
                  />
                  <button className="fire-button" onClick={onSubmitAnswer} type="button">
                    发射
                  </button>
                </div>

                <div className="battle-message">
                  <span className={`message-dot ${gameMessage.type || "ok"}`} />
                  <p className={`message ${gameMessage.type}`}>{gameMessage.text || "输入中文翻译，按 Enter 或点击发射。"}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function buildReviewAnswerText(word) {
  const answers = [word.zh, ...(ZH_ALIAS_MAP[word.zh] || []), ...(word.zhAliases || [])]
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);

  return answers.join("、") || "暂无";
}

function getReviewStatus(word) {
  if ((word.missedCount || 0) > 0) return { label: "已加入错题本", tone: "bad" };
  if ((word.correctCount || 0) > 0) return { label: "已答对", tone: "ok" };
  if ((word.assistedCount || 0) > 0) return { label: "道具处理", tone: "warn" };
  return { label: word.lastOutcome || "已出现", tone: "neutral" };
}

function buildReviewStatText(word) {
  const parts = [];
  if (word.correctCount) parts.push(`答对 ${word.correctCount} 次`);
  if (word.missedCount) parts.push(`漏掉 ${word.missedCount} 次`);
  if (word.assistedCount) parts.push(`道具处理 ${word.assistedCount} 次`);
  return parts.join("，") || `出现 ${word.timesSeen || 1} 次`;
}

function ResultScreen({ resultSummary, reviewWords, onBack }) {
  return (
    <section className="screen active">
      <div className="terminal-window">
        <header className="terminal-header">
          <span>战斗结算</span>
          <span>单词复习</span>
        </header>

        <div className="terminal-body">
          <h2 className="result-title">本局完成</h2>
          <p className="result-summary">{resultSummary}</p>
          <h3 className="review-title">本局单词表</h3>

          <div className="review-list">
            {reviewWords.length === 0 && <p className="empty-line">本局没有记录到单词。</p>}
            {reviewWords.map((word) => (
              <article className="review-card" key={word.id || word.en}>
                <div className="review-card-head">
                  <div>
                    <h4>{word.en}</h4>
                    <strong>{word.zh}</strong>
                  </div>
                  <div className="review-badges">
                    <span className={`review-status ${getReviewStatus(word).tone}`}>
                      {getReviewStatus(word).label}
                    </span>
                    <span className="review-score">+{word.points || 0} 分</span>
                  </div>
                </div>
                <div className="review-detail-grid">
                  <p>
                    <span>本局结果</span>
                    {buildReviewStatText(word)}
                  </p>
                  <p>
                    <span>可接受答案</span>
                    {buildReviewAnswerText(word)}
                  </p>
                  <p>
                    <span>本词分值</span>
                    {word.points || 0} 分
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button className="back-button" onClick={onBack} type="button">
            返回主页
          </button>
        </div>
      </div>
    </section>
  );
}
