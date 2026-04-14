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

  return Array.from({ length: numGroups }, (_, i) => {
    const playerCount = base + (i < extra ? 1 : 0);
    const bracketSize = nextPow2(playerCount);
    const day = (i % safeDays) + 1;
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

function seedMainBracketPlayers(groups = [], advancePerGroup = 4) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  if (!safeGroups.length) return [];

  const sorted = [...safeGroups].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  const groupMap = new Map(
    sorted.map((g) => [String(g.id || '').toUpperCase(), Array.isArray(g.advancedPlayers) ? g.advancedPlayers : []])
  );

  const rounds = Math.max(1, Number(advancePerGroup) || 1);
  const branches = sorted.length;
  const picks = [];

  for (let rank = 0; rank < rounds; rank += 1) {
    for (let branch = 0; branch < branches; branch += 1) {
      const source = sorted[branch];
      const sourceLetter = String(source.id || '').toUpperCase();
      const sourcePlayers = groupMap.get(sourceLetter) || [];
      const player = sourcePlayers[rank];
      if (player) {
        picks.push({
          ...player,
          sourceGroup: sourceLetter,
          sourceRank: rank + 1,
          bracketLane: branch + 1,
        });
      }
    }
  }

  return picks;
}

function buildMainBracketFromGroups(groups = [], advancePerGroup = 4) {
  const safeGroups = Array.isArray(groups) ? [...groups] : [];
  const seededPlayers = seedMainBracketPlayers(safeGroups, advancePerGroup);
  const meta = calcMainBracket(safeGroups, advancePerGroup);
  const bracketSize = meta.bracketSize;
  const matches = globalThis.generateBracket
    ? globalThis.generateBracket(bracketSize)
    : [];

  if (Array.isArray(matches) && matches.length && Array.isArray(matches[0])) {
    const lanes = safeGroups.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
    const laneCount = Math.max(1, lanes.length);
    const perLane = Math.max(1, Math.floor(bracketSize / laneCount));

    for (let i = 0; i < Math.floor(bracketSize / 2); i += 1) {
      const p1 = seededPlayers[i * 2] || null;
      const p2 = seededPlayers[i * 2 + 1] || null;
      if (!matches[0][i]) continue;
      matches[0][i].p1 = p1;
      matches[0][i].p2 = p2;
      matches[0][i].winner = null;
      matches[0][i].sourceLane = i % laneCount;
      matches[0][i].sourceRound = Math.floor(i / perLane) + 1;
    }
  }

  return {
    players: seededPlayers,
    matches,
    bracketSize,
    byeCount: bracketSize - seededPlayers.length,
    status: seededPlayers.length ? 'active' : 'locked',
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

function setLargeTournamentState(state = {}) {
  largeTournamentState = buildState(state);
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
  seedMainBracketPlayers,
  buildMainBracketFromGroups,
  buildState,
  initLargeTournamentModule,
  updateLargeTournamentConfig,
  setLargeTournamentState,
  getLargeTournamentState,
  isLargeTournament,
};
