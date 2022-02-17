import dictionary from './data/dictionary.js';

const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

const keyboard = document.getElementById('keyboard');
const guessGrid = document.getElementById('guess-grid');
const notification = document.getElementById('notification');

const targetWord = dictionary[Math.floor(Math.random() * dictionary.length)];
console.log(`%c Думата ти е %c"${targetWord}"%c, но защо %cмамиш%c?`, 'color:orange;font-size:1.4rem', 'color:lime;font-size:1.6rem;font-weight:bolder', 'color:orange;font-size:1.4rem;', 'color:red;font-size:1.4rem;', 'color:orange;font-size:1.4rem');

startInteraction();

// Handle Interaction
function startInteraction() {
  document.addEventListener('click', handleMouseClick);
  document.addEventListener('keydown', handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener('click', handleMouseClick);
  document.removeEventListener('keydown', handleKeyPress);
}

//Handle Active Tiles
function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

// Handle Inputs
function handleMouseClick(e) {
  if (e.target.matches('[data-key]')) { return pressKey(e.target.dataset.key); }

  if (e.target.matches('[data-enter]')) { return submitGuess(); }

  if (e.target.matches('[data-delete]') || e.target.matches('svg') || e.target.matches('path')) { return deleteKey(); }
}

function handleKeyPress(e) {
  if (e.key.match(/^[а-я]$/)) { return pressKey(e.key.toLocaleUpperCase()); }

  if (e.key == 'Enter') { return submitGuess(); }

  if (e.key == 'Backspace' || e.key == 'Delete') { return deleteKey(); }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();

  if (activeTiles.length >= WORD_LENGTH) { return; }

  const nextTile = guessGrid.querySelector(':not([data-letter])');
  nextTile.textContent = key;
  nextTile.dataset.letter = key;
  nextTile.dataset.state = 'active';
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  const guess = activeTiles.reduce((word, tile) => word + tile.dataset.letter, '');

  if (activeTiles.length != WORD_LENGTH) {
    showAlert('Няма достатъчно букви!');
    shakeTiles(activeTiles);
    return;
  }

  if (!dictionary.includes(guess)) {
    showAlert('Не съществува такава дума!');
    shakeTiles(activeTiles);
    return;
  }

  stopInteraction();

  activeTiles.forEach((tile, index, array) => flipTile(tile, index, array, guess));
}

function deleteKey() {
  const activeTiles = getActiveTiles();

  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile == null) { return; }

  lastTile.textContent = '';
  delete lastTile.dataset.letter;
  delete lastTile.dataset.state;
}

// Handle Animations
function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter;
  const key = keyboard.querySelector(`[data-key="${letter}"]`);

  setTimeout(() => {
    tile.classList.add('flip');
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  tile.addEventListener('transitionend', () => {
    tile.classList.remove('flip');

    if (targetWord[index] == letter) {
      tile.dataset.state = 'correct';
      key.classList.add('correct');
    } else if (targetWord.includes(letter)) {
      tile.dataset.state = 'wrong-location';
      key.classList.add('wrong-location');
    } else {
      tile.dataset.state = 'wrong';
      key.classList.add('wrong');
    }

    if (index == array.length - 1) {
      tile.addEventListener('transitionend', () => {
        startInteraction();
        checkWinLose(guess, array);
      }, { once: true });
    }

  }, { once: true });
}

function shakeTiles(tiles) {
  tiles.forEach(tile => {

    tile.classList.add('shake');

    tile.addEventListener('animationend', () => {
      tile.classList.remove('shake');
    }, { once: true });

  });
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {

    setTimeout(() => {

      tile.classList.add('dance');

      tile.addEventListener('animationend', () => {
        tile.classList.remove('dance');
      }, { once: true });
    }, (index * DANCE_ANIMATION_DURATION) / 5);

  });
}

// Handle Win/Lose Scenario 
function checkWinLose(guess, tiles) {
  if (guess == targetWord) {
    showAlert('Печелиш!!!', 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(':not([data-letter])');
  if (remainingTiles.length == 0) {
    showAlert(targetWord.toUpperCase(), null);
    stopInteraction();
  }
}

// Handle Alerts
function showAlert(message, duration = 1000) {
  const alert = document.createElement('div');
  alert.textContent = message;
  alert.classList.add('alert');
  notification.appendChild(alert);

  if (duration == null) { return; }

  setTimeout(() => {
    alert.classList.add('hide');
    alert.addEventListener('transitionend', alert.remove());
  }, duration);
}
