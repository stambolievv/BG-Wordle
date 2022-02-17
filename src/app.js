import dictionary from './data/dictionary.js';

const game = {
  targetWord: dictionary[Math.floor(Math.random() * dictionary.length)],
  score: 0,
  highscore: Number(localStorage.getItem('bg-wordle-highscore')) || 0,
  wordLength: 5,
  flipDuration: 500,
  danceDuration: 500,
  cheat: (word) => console.log(`%cДумата ти е %c"${word}"%c, но защо %cмамиш%c?`, 'color:orange;font-size:1.4rem', 'color:lime;font-size:1.6rem;font-weight:bolder', 'color:orange;font-size:1.4rem;', 'color:red;font-size:1.4rem;', 'color:orange;font-size:1.4rem')
};

const keyboard = document.getElementById('keyboard');
const guessGrid = document.getElementById('guess-grid');
const notification = document.getElementById('notification');
const score = document.getElementById('score');
const highscore = document.getElementById('highscore');

score.textContent = `SCORE: ${game.score}`;
highscore.textContent = `HIGHSCORE: ${game.highscore}`;
game.cheat(game.targetWord);

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
  return guessGrid.querySelectorAll('[data-state="active-spot"]');
}

// Handle Inputs
function handleMouseClick(e) {
  if (e.target.matches('[data-key]')) { return pressKey(e.target.dataset.key); }

  if (e.target.matches('[data-enter]')) { return submitGuess(); }

  if (e.target.matches('[data-delete]')) { return deleteKey(); }
}

function handleKeyPress(e) {
  if (e.key.match(/^[а-я]$/)) { return pressKey(e.key.toLocaleUpperCase()); }

  if (e.key == 'Enter') { return submitGuess(); }

  if (e.key == 'Backspace' || e.key == 'Delete') { return deleteKey(); }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();

  if (activeTiles.length >= game.wordLength) { return; }

  const nextTile = guessGrid.querySelector(':not([data-letter])');
  nextTile.textContent = key;
  nextTile.dataset.letter = key;
  nextTile.dataset.state = 'active-spot';
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()];
  const guess = activeTiles.reduce((word, tile) => word + tile.dataset.letter, '');

  if (activeTiles.length != game.wordLength) {
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
  }, (index * game.flipDuration) / 2);

  tile.addEventListener('transitionend', () => {
    tile.classList.remove('flip');

    if (game.targetWord[index] == letter) {
      tile.dataset.state = 'correct-spot';
      key.classList.add('correct-spot');
    } else if (game.targetWord.includes(letter)) {
      tile.dataset.state = 'wrong-spot';
      key.classList.add('wrong-spot');
    } else {
      tile.dataset.state = 'missing-spot';
      key.classList.add('missing-spot');
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
    }, (index * game.danceDuration) / 5);

  });
}

// Handle Win/Lose Scenario 
function checkWinLose(guess, tiles) {
  if (guess == game.targetWord) {
    game.score += 2;
    showAlert('Браво. Ти спечели 2 точки! Смело напред.', 3000, true);
    danceTiles(tiles);
    stopInteraction();
    checkScore();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(':not([data-letter])');
  if (remainingTiles.length == 0) {
    if (game.score > 0) { game.score -= 1; }
    showAlert(`Уфф. Твоята дума беше "${game.targetWord}". Загуби 1 точка!`, 3000, true);
    stopInteraction();
    checkScore();
    return;
  }
}

function checkScore() {
  if (game.score > game.highscore) {
    localStorage.setItem('bg-wordle-highscore', game.score);
    game.highscore = game.score;
  }

  score.textContent = `SCORE: ${game.score}`;
  highscore.textContent = `HIGHSCORE: ${game.highscore}`;
}

// Handle Alerts
function showAlert(message, duration = 1000, gameover = false) {
  const alert = document.createElement('div');
  alert.textContent = message;
  alert.classList.add('alert');
  notification.appendChild(alert);

  setTimeout(() => {
    alert.classList.add('hide');
    alert.addEventListener('transitionend', alert.remove());

    if (gameover) {
      [...keyboard.querySelectorAll('.key')].map(key => {
        return key.className = 'key';
      });

      [...guessGrid.querySelectorAll('.tile')].forEach(tile => {
        tile.textContent = '';
        delete tile.dataset.letter;
        delete tile.dataset.state;
        return;
      });

      game.targetWord = dictionary[Math.floor(Math.random() * dictionary.length)];

      game.cheat(game.targetWord);
      startInteraction();
    }
  }, duration);
}
