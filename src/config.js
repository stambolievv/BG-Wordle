export default {
  wordLength: 5,
  gridLength: 30,
  keys: [
    'Я', 'В', 'Е', 'Р', 'Т', 'Ъ', 'У', 'И', 'О', 'П', 'Ч',
    'А', 'С', 'Д', 'Ф', 'Г', 'Х', 'Й', 'К', 'Л', 'Ш', 'Щ',
    'Enter', 'Ю', 'З', 'Ь', 'Ц', 'Ж', 'Б', 'Н', 'М', 'Delete'
  ],
  templates: {
    win: 'Браво. Ти спечели {{reward}} точки! Смело напред.',
    lose: 'Уфф. Твоята дума беше "{{word}}". Загуби {{penalty}} точка!',
    notEnoughLetters: 'Няма достатъчно букви!',
    noSuchWord: 'Не съществува такава дума!',
    score: 'Резултат: ',
    highscore: 'Най-добър резултат: ',
  },
  score: {
    reward: 2,
    penalty: 1,
  },
  delays: {
    betweenFlips: 250,
    betweenJumps: 50,
  },
  alert: {
    rewardDuration: 2000,
    penaltyDuration: 2000,
  },
};
