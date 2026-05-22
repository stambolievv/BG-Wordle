export default {
  wordLength: 5,
  gridLength: 30,
  keys: [
    'Я', 'В', 'Е', 'Р', 'Т', 'Ъ', 'У', 'И', 'О', 'П', 'Ч',
    'А', 'С', 'Д', 'Ф', 'Г', 'Х', 'Й', 'К', 'Л', 'Ш', 'Щ',
    'Delete', 'Ю', 'З', 'Ь', 'Ц', 'Ж', 'Б', 'Н', 'М', 'Enter'
  ],
  translations: {
    // Alerts
    win: 'Браво. Ти спечели {{reward}} точки! Смело напред.',
    lose: 'Уфф. Твоята дума беше "{{word}}". Загуби {{penalty}} точка!',
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
  },
  score: {
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
