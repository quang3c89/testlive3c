const LARGE_TOURNAMENT_DEFAULTS = {
  totalPlayers: 80,
  maxPerGroup: 20,
  totalDays: 3,
  advancePerGroup: 4,
};

const GROUP_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function nextPow2(n) {
  let p = 1;
  const target = Math.max(1, Number(n) || 1);
  while (p < target) p *= 2;
  return p;
}

function autoSplitGroups(totalPlayers, maxPerGroup = 20, totalDays = 3) {
  const safeTotal = Math.max(2, Number(totalPlayers) || 2);
  const safeMax = Math.max(2, Number(maxPerGroup) || 20);
  const safeDays = Math.max(2, Number(totalDays) || 3);

  let numGroups = Math.ceil(safeTotal / safeMax);
  if (numGroups < 2) numGroups = 2;

  const base = Math.floor(safeTotal / numGroups);
  const extra = safeTotal % numGroups;
  const dayBuckets = Math.max(1, safeDays - 1);

  return Array.from({ length: numGroups }, (_, i) => {
    const playerCount = base + (i < extra ? 1 : 0);
    const bracketSize = nextPow2(playerCount);
    const day = Math.min(safeDays, Math.floor((i / numGroups) * dayBuckets) + 1);
    return {
      id: GROUP_LABELS[i] || `G${i + 1}`,
      name: `Bảng ${GROUP_LABELS[i] || i + 1}`,
      playerCount,
      bracketSize,
      byeCount: bracketSize - playerCount,
      day,
      players: [],
      matches: [],
      advancedPlayers: [],
      status: 'pending',
    };
  });
}

function validateAdvanceCount(advancePerGroup, groups = []) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  if (!safeGroups.length) return Math.max(1, Number(advancePerGroup) || 1);
  const minGroupSize = Math.min(...safeGroups.map((g) => Math.max(1, Number(g.playerCount) || 1)));
  return Math.max(1, Math.min(Number(advancePerGroup) || 1, minGroupSize));
}

function calcMainBracket(groups = [], advancePerGroup = 4) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeAdvance = validateAdvanceCount(advancePerGroup, safeGroups);
  const totalAdvance = safeGroups.length * safeAdvance;
  const bracketSize = nextPow2(totalAdvance || 2);
  return {
    totalAdvance,
    bracketSize,
    byeCount: bracketSize - totalAdvance,
  };
}

function buildState(config = {}) {
  const totalPlayers = Math.max(2, Number(config.totalPlayers) || LARGE_TOURNAMENT_DEFAULTS.totalPlayers);
  const maxPerGroup = Math.max(2, Number(config.maxPerGroup) || LARGE_TOURNAMENT_DEFAULTS.maxPerGroup);
  const totalDays = Math.max(2, Number(config.totalDays) || LARGE_TOURNAMENT_DEFAULTS.totalDays);

  const groups = Array.isArray(config.groups) && config.groups.length
    ? config.groups
    : autoSplitGroups(totalPlayers, maxPerGroup, totalDays);

  const advancePerGroup = validateAdvanceCount(
    Number(config.advancePerGroup) || LARGE_TOURNAMENT_DEFAULTS.advancePerGroup,
    groups
  );

  const mainMeta = calcMainBracket(groups, advancePerGroup);

  return {
    totalPlayers,
    maxPerGroup,
    totalDays,
    advancePerGroup,
    groups,
    mainBracket: {
      bracketSize: mainMeta.bracketSize,
      byeCount: mainMeta.byeCount,
      players: Array.isArray(config?.mainBracket?.players) ? config.mainBracket.players : [],
      matches: Array.isArray(config?.mainBracket?.matches) ? config.mainBracket.matches : [],
      status: config?.mainBracket?.status || 'locked',
    },
  };
}

let largeTournamentState = buildState(LARGE_TOURNAMENT_DEFAULTS);

function initLargeTournamentModule(config = {}) {
  largeTournamentState = buildState(config);
  return getLargeTournamentState();
}

function updateLargeTournamentConfig(patch = {}) {
  largeTournamentState = buildState({ ...largeTournamentState, ...patch });
  return getLargeTournamentState();
}

function getLargeTournamentState() {
  return JSON.parse(JSON.stringify(largeTournamentState));
}

function isLargeTournament(totalPlayers) {
  return Number(totalPlayers) > 64;
}

globalThis.Live3CLargeTournament = {
  nextPow2,
  autoSplitGroups,
  validateAdvanceCount,
  calcMainBracket,
  buildState,
  initLargeTournamentModule,
  updateLargeTournamentConfig,
  getLargeTournamentState,
  isLargeTournament,
};
