export default {
  /** Fallback when no word-length preference has been persisted. */
  defaultWordLength: 5,

  /**
   * Available word lengths for the settings picker and the dictionary generator.
   * Both consumers must stay in sync - adding a length here requires generating its dictionary file.
   */
  wordLengthOptions: [3, 4, 5, 6, 7],

  /**
   * Base URL for dictionary JSON files.
   * Resolves per word length as `${dictionaryPath}/{wordLength}.json`.
   */
  dictionaryPath: `${import.meta.env.BASE_URL}dictionary`,

  /**
   * Maximum number of guesses allowed per round.
   * Controls grid height and feeds the scoring formula:
   * a correct guess on attempt N earns `maxGuesses − N + 1` points.
   */
  maxGuesses: 6,

  /**
   * On-screen keyboard layout in DOM render order (left-to-right, row by row).
   * `'Delete'` renders as an SVG icon; `'Enter'` renders as plain text.
   * When the swap-buttons setting is active, the two exchange positions -
   * both at initial render and whenever the setting is toggled.
   */
  keys: [
    'Я', 'В', 'Е', 'Р', 'Т', 'Ъ', 'У', 'И', 'О', 'П', 'Ч',
    'А', 'С', 'Д', 'Ф', 'Г', 'Х', 'Й', 'К', 'Л', 'Ш', 'Щ',
    'Delete', 'Ю', 'З', 'Ь', 'Ц', 'Ж', 'Б', 'Н', 'М', 'Enter'
  ],

  /**
   * All user-facing strings, so no hardcoded text lives in component or game code.
   * Values that include runtime data use `{{placeholder}}` tokens swapped in before display.
   * Example letter arrays for the help modal are destructured directly into the template.
   */
  translations: {
    // Alerts
    win: 'Браво. Ти спечели {{reward}} точки! Смело напред.',
    lose: 'Уфф. Твоята дума беше "{{word}}". Загуби {{penalty}} точка!',
    loading: 'Играта се зарежда...',
    loadingError: 'Речникът не можа да се зареди. Натиснете тук, за да опитате отново.',
    notEnoughLetters: 'Няма достатъчно букви!',
    noSuchWord: 'Не съществува такава дума!',
    hardModeCorrectSpot: 'Позиция {{position}} трябва да е "{{letter}}"!',
    hardModeWrongSpot: 'Думата трябва да съдържа "{{letter}}"!',
    // Scoreboard
    score: 'Резултат: ',
    highscore: 'Най-добър резултат: ',
    // Header
    title: 'BG Wordle',
    helpAriaLabel: 'Как се играе',
    settingsAriaLabel: 'Настройки',
    deleteAriaLabel: 'Изтрий буква',
    // Shared modal
    modalClose: 'Затвори',
    // Help modal
    helpTitle: 'Как се играе',
    helpRule1: 'Познайте думата за <strong>6 опита</strong>.',
    helpRule2: 'Всеки опит трябва да е <strong>валидна българска дума от 5 букви</strong>, която съществува в речника.',
    helpRule3: 'Цветът на плочките се променя след всеки опит, за да покаже <strong>колко сте близо</strong> до търсената дума.',
    helpExamplesHeading: 'Примери',
    helpExample1Letters: ['К', 'О', 'Т', 'К', 'А'],
    helpExample1Desc: '<strong>К</strong> е в думата и на <strong>правилното място</strong>.',
    helpExample2Letters: ['Б', 'А', 'Н', 'А', 'Н'],
    helpExample2Desc: '<strong>А</strong> е в думата, но на <strong>грешно място</strong>.',
    helpExample3Letters: ['Ц', 'В', 'Е', 'Т', 'Е'],
    helpExample3Desc: '<strong>Т</strong> не е в думата <strong>на нито едно място</strong>.',
    helpFooter: 'Нова дума се избира след всяка завършена игра. Играйте колкото искате!',
    // Settings modal
    settingsTitle: 'Настройки',
    hardModeTitle: 'Труден режим',
    hardModeDesc: 'Всички разкрити подсказки трябва да се използват в следващите опити',
    darkThemeTitle: 'Тъмна тема',
    swapButtonsTitle: 'Смяна на бутоните',
    swapButtonsDesc: 'Разменя местата на \'Enter\' и \'Изтрий\'',
    wordLengthTitle: 'Дължина на думата',
  },

  score: {
    /** Deducted from score on a loss. Only applied when the current score is positive, so the displayed score never goes below zero. */
    penalty: 1,
  },

  delays: {
    /** Milliseconds of stagger between consecutive tile flips during a guess reveal animation. */
    betweenFlips: 250,
    /** Milliseconds of stagger between consecutive tile jumps during the win animation. */
    betweenJumps: 50,
  },

  alert: {
    /** How long the win notification stays visible (ms) before the auto-dismiss transition begins. */
    rewardDuration: 2500,
    /** How long the loss notification stays visible (ms) before the auto-dismiss transition begins. */
    penaltyDuration: 3000,
  },
};
