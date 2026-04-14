const largeTournamentState = {
  totalPlayers: 0,
  totalDays: 3,
  advancePerGroup: 4,
  groups: [],
  mainBracket: {
    bracketSize: 0,
    byeCount: 0,
    players: [],
    matches: [],
    status: 'locked'
  }
};

function initLargeTournamentModule(config = {}) {
  const nextState = {
    ...largeTournamentState,
    ...config,
    groups: Array.isArray(config.groups) ? config.groups : [],
    mainBracket: {
      ...largeTournamentState.mainBracket,
      ...(config.mainBracket || {})
    }
  };

  return nextState;
}

function isLargeTournament(totalPlayers) {
  return Number(totalPlayers) > 64;
}

globalThis.Live3CLargeTournament = {
  initLargeTournamentModule,
  isLargeTournament
};

export {
  largeTournamentState,
  initLargeTournamentModule,
  isLargeTournament
};
