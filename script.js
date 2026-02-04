const heroPhoto = document.getElementById("heroPhoto");
const photoOverlay = document.getElementById("photoOverlay");
const message = document.getElementById("message");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const photoWrap = document.querySelector(".photo-wrap");
const congrats = document.getElementById("congrats");

const snakeOverlay = document.getElementById("snakeOverlay");
const snakeCanvas = document.getElementById("snakeCanvas");
const snakeScore = document.getElementById("snakeScore");
const snakeCtx = snakeCanvas.getContext("2d");
const snakeFail = document.getElementById("snakeFail");
const snakeRetry = document.getElementById("snakeRetry");

const crosswordOverlay = document.getElementById("crosswordOverlay");
const crosswordGrid = document.getElementById("crosswordGrid");
const crosswordCheck = document.getElementById("crosswordCheck");
const crosswordFeedback = document.getElementById("crosswordFeedback");
const crosswordAcross = document.getElementById("crosswordAcross");
const crosswordDown = document.getElementById("crosswordDown");
const stagePrompt = document.getElementById("stagePrompt");
const stagePromptText = document.getElementById("stagePromptText");
const stagePromptButton = document.getElementById("stagePromptButton");
const dateMessage = document.getElementById("dateMessage");
const dateOptions = Array.from(document.querySelectorAll(".date-option"));

const persuasionSequence = [
  {
    src: "IMG_3791.jpg",
    alt: "Holding flowers in a field",
    message:
      "Take your time... but choose wisely. I sure do look like a real sweet heart here.",
  },
  {
    src: "IMG_1417.jpg",
    alt: "Couple selfie at the movies",
    message:
      "Really the flowers didn't do the trick? What about the sunglasses, I look really cool in those",
  },
  {
    src: "IMG_0439.jpg",
    alt: "Wearing sunglasses",
    message:
      "Ok ok ok, I get it, but maybe a look at my jacked-ness will help me out 💪.",
  },
  {
    src: "IMG_3638.jpg",
    alt: "Gym mirror selfie",
    message:
      "Really? None of that worked? Will you at least do it for us? Look how cute we look together 😍",
  },
  {
    src: "IMG_2706.jpg",
    alt: "Bunny on a pumpkin",
    message: "Ok this is your last chance! Do it for the kids at least!",
  },
];

const defaultOverlayText = "Please say yes";

const headImage = new Image();
headImage.src = "head.png";

const daisyImage = new Image();
daisyImage.src = "daisy.png";

const sammyImage = new Image();
sammyImage.src = "sammy.png";

const heartImage = new Image();
heartImage.src = createHeartDataUrl();

const treatImages = [daisyImage, sammyImage];

const crosswordConfig = {
  size: 9,
  words: [
    {
      answer: "KEEYANA",
      row: 3,
      col: 2,
      dir: "across",
      number: 1,
      clue: "Travelled from a far away land, and is very pretty and sweet, also loves chocolar even though she can't have it right now",
    },
    {
      answer: "SAMMY",
      row: 2,
      col: 6,
      dir: "down",
      number: 2,
      clue: "She is originally from portugal",
    },
    {
      answer: "DAISY",
      row: 6,
      col: 2,
      dir: "across",
      number: 3,
      clue: "Was once a boy, and then a girl, and then a boy again",
    },
    {
      answer: "ABLE",
      row: 6,
      col: 3,
      dir: "down",
      number: 4,
      clue: "Some say he is very handsome and jacked",
    },
  ],
};

let noClickCount = 0;
let stage = "normal";
let crosswordSolved = false;
let promptAction = null;

let gameLayer = null;
let movers = [];
let rafId = null;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let collectible = null;
let score = 0;
let gridCount = 16;
let tileSize = 24;
let snakeTimer = null;

const crosswordCells = new Map();
let crosswordInputs = [];

function updateMessage(text) {
  message.innerHTML = `<p>${text}</p>`;
}

function applyPersuasionStep(stepIndex) {
  const safeIndex = Math.min(stepIndex, persuasionSequence.length - 1);
  const step = persuasionSequence[safeIndex];
  if (!step) return;

  heroPhoto.src = step.src;
  heroPhoto.alt = step.alt;
  photoOverlay.textContent = step.overlay ?? defaultOverlayText;
  updateMessage(step.message);
}

applyPersuasionStep(0);

function handleNoClick() {
  if (stage !== "normal") return;
  noClickCount += 1;
  const lastIndex = persuasionSequence.length - 1;
  if (noClickCount > lastIndex) {
    applyPersuasionStep(lastIndex);
    updateMessage(
      "You're supposed to click yes now! This is really your last chance!"
    );
  } else {
    applyPersuasionStep(noClickCount);
  }
  photoWrap.classList.add("sad");
}

function handleYesClick() {
  if (stage !== "normal") return;
  const lastIndex = persuasionSequence.length - 1;
  const currentIndex = Math.min(noClickCount, lastIndex);
  if (currentIndex < lastIndex) {
    updateMessage("Bruh your not supposed to click yes yet, just play along and click no 🤦‍♂️");
    photoOverlay.textContent = "Too fast";
    return;
  }

  showPrompt(
    "you really think you can just say yes now after saying no all those times?!?!\n\nYou got to earn it now, quick, catch the Golden \"Yes\" (aka Daisy)!",
    "I'm a wizard!",
    startSnitchGame
  );
}

yesBtn.addEventListener("click", handleYesClick);
noBtn.addEventListener("click", handleNoClick);

function startSnakeGame() {
  stage = "snake";
  document.body.classList.add("game-mode");
  snakeOverlay.hidden = false;
  snakeFail.hidden = true;
  updateMessage("Level 2: Collect 20 treats to unlock the crossword.");
  photoOverlay.textContent = "Snake time";
  initSnakeGame();
  snakeTimer = window.setInterval(stepSnake, 120);
}

function initSnakeGame() {
  resizeSnakeCanvas();
  score = 0;
  updateSnakeScore();
  snake = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  spawnCollectible();
  drawSnake();
}

function resizeSnakeCanvas() {
  const maxSize = Math.min(window.innerWidth, window.innerHeight) - 140;
  const size = Math.max(280, Math.min(560, maxSize));
  const adjusted = Math.floor(size / gridCount) * gridCount;
  snakeCanvas.width = adjusted;
  snakeCanvas.height = adjusted;
  tileSize = adjusted / gridCount;
}

function updateSnakeScore() {
  snakeScore.textContent = String(score);
}

function spawnCollectible() {
  let spot;
  do {
    spot = {
      x: Math.floor(Math.random() * gridCount),
      y: Math.floor(Math.random() * gridCount),
    };
  } while (snake.some((segment) => segment.x === spot.x && segment.y === spot.y));

  const img = treatImages[Math.floor(Math.random() * treatImages.length)];
  collectible = { ...spot, img };
}

function drawSnake() {
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  if (collectible) {
    drawSprite(collectible.img, collectible.x, collectible.y, "#f8b6c8");
  }

  snake.forEach((segment) => {
    drawSprite(headImage, segment.x, segment.y, "#f3c089");
  });
}

function drawSprite(img, gridX, gridY, fallbackColor) {
  const x = gridX * tileSize;
  const y = gridY * tileSize;

  if (img && img.complete && img.naturalWidth > 0) {
    snakeCtx.drawImage(img, x, y, tileSize, tileSize);
  } else {
    snakeCtx.fillStyle = fallbackColor;
    snakeCtx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
  }
}

function stepSnake() {
  direction = { ...nextDirection };
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  if (
    nextHead.x < 0 ||
    nextHead.x >= gridCount ||
    nextHead.y < 0 ||
    nextHead.y >= gridCount
  ) {
    failSnake();
    return;
  }

  const willGrow =
    collectible && nextHead.x === collectible.x && nextHead.y === collectible.y;
  const body = willGrow ? snake : snake.slice(0, -1);

  if (body.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    failSnake();
    return;
  }

  snake.unshift(nextHead);

  if (willGrow) {
    score += 1;
    updateSnakeScore();

    if (score >= 20) {
      finishSnakeGame();
      showPrompt(
        "Ok maybe you are worthy of being my Valentine, but you must pass this final test.\n\nProve your knowledge of this household!",
        "I have a big brain!",
        startCrossword
      );
      return;
    }

    spawnCollectible();
  } else {
    snake.pop();
  }

  drawSnake();
}

function finishSnakeGame() {
  if (snakeTimer) {
    clearInterval(snakeTimer);
    snakeTimer = null;
  }
  snakeOverlay.hidden = true;
}

function failSnake() {
  if (snakeTimer) {
    clearInterval(snakeTimer);
    snakeTimer = null;
  }
  snakeFail.hidden = false;
  updateMessage("You failed the snake challenge. Try again!");
}

function handleSnakeKey(event) {
  if (stage !== "snake") return;

  const key = event.key.toLowerCase();
  const directions = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (Object.prototype.hasOwnProperty.call(directions, key)) {
    event.preventDefault();
  }

  const next = directions[key];
  if (!next) return;

  if (direction.x + next.x === 0 && direction.y + next.y === 0) {
    return;
  }

  nextDirection = next;
}

window.addEventListener("keydown", handleSnakeKey);

function startSnitchGame() {
  stage = "snitch";
  document.body.classList.add("snitch-mode");
  document.body.classList.add("game-mode");
  updateMessage("Level 1: Catch Daisy to begin!");
  photoOverlay.textContent = "Catch Daisy";

  gameLayer = document.createElement("div");
  gameLayer.className = "game-layer";
  document.body.appendChild(gameLayer);

  const snitch = document.createElement("button");
  snitch.className = "snitch";
  snitch.setAttribute("aria-label", "Daisy");
  snitch.addEventListener("click", handleSnitchCaught);
  const snitchLabel = document.createElement("span");
  snitchLabel.className = "snitch-label";
  snitchLabel.textContent = "Yes";
  snitch.appendChild(snitchLabel);
  gameLayer.appendChild(snitch);

  const noButtonCount = 250;
  for (let i = 0; i < noButtonCount; i += 1) {
    const noFly = document.createElement("button");
    noFly.className = "flying-no";
    noFly.textContent = "No";
    noFly.addEventListener("click", () => {
      noFly.remove();
      movers = movers.filter((mover) => mover.el !== noFly);
    });
    gameLayer.appendChild(noFly);
  }

  setupMovers();
  rafId = requestAnimationFrame(stepFlyers);
}

function setupMovers() {
  if (!gameLayer) return;
  const elements = Array.from(gameLayer.querySelectorAll(".snitch, .flying-no"));
  movers = elements.map((el) => {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;
    const speedBase = el.classList.contains("snitch") ? 10 : 1.7;
    const vx = (Math.random() * 2 - 1) * speedBase;
    const vy = (Math.random() * 2 - 1) * speedBase;
    return {
      el,
      size,
      x: Math.random() * maxX,
      y: Math.random() * maxY,
      vx: vx === 0 ? speedBase : vx,
      vy: vy === 0 ? -speedBase : vy,
    };
  });
}

function stepFlyers() {
  movers.forEach((mover) => {
    const maxX = window.innerWidth - mover.size;
    const maxY = window.innerHeight - mover.size;
    mover.x += mover.vx;
    mover.y += mover.vy;

    if (mover.x <= 0 || mover.x >= maxX) {
      mover.vx *= -1;
      mover.x = Math.max(0, Math.min(mover.x, maxX));
    }
    if (mover.y <= 0 || mover.y >= maxY) {
      mover.vy *= -1;
      mover.y = Math.max(0, Math.min(mover.y, maxY));
    }

    mover.el.style.transform = `translate(${mover.x}px, ${mover.y}px)`;
  });

  rafId = requestAnimationFrame(stepFlyers);
}

function stopSnitchGame() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (gameLayer) {
    gameLayer.remove();
    gameLayer = null;
  }
  document.body.classList.remove("snitch-mode");
}

function handleSnitchCaught() {
  stopSnitchGame();
  showPrompt(
    "you thought that was all?\n\nYou must now collect all the jimbo and daisies in order to prove your readiness.",
    "I'm hungry!",
    startSnakeGame
  );
}

function buildCrossword() {
  crosswordGrid.innerHTML = "";
  crosswordCells.clear();
  crosswordInputs = [];
  crosswordGrid.style.gridTemplateColumns = `repeat(${crosswordConfig.size}, 1fr)`;

  const letters = new Map();
  const numbers = new Map();

  crosswordConfig.words.forEach((word) => {
    numbers.set(`${word.row},${word.col}`, word.number);
    [...word.answer].forEach((letter, index) => {
      const row = word.row + (word.dir === "down" ? index : 0);
      const col = word.col + (word.dir === "across" ? index : 0);
      const key = `${row},${col}`;
      letters.set(key, letter);
    });
  });

  for (let row = 1; row <= crosswordConfig.size; row += 1) {
    for (let col = 1; col <= crosswordConfig.size; col += 1) {
      const key = `${row},${col}`;
      const cell = document.createElement("div");

      if (letters.has(key)) {
        cell.className = "crossword-cell";
        const input = document.createElement("input");
        input.maxLength = 1;
        input.setAttribute("aria-label", `Row ${row} column ${col}`);
        input.autocomplete = "off";
        input.spellcheck = false;
        input.addEventListener("input", handleCrosswordInput);

        if (numbers.has(key)) {
          const number = document.createElement("span");
          number.className = "crossword-number";
          number.textContent = numbers.get(key);
          cell.appendChild(number);
        }

        cell.appendChild(input);
        crosswordCells.set(key, { input, letter: letters.get(key) });
        crosswordInputs.push(input);
      } else {
        cell.className = "crossword-cell block";
      }

      crosswordGrid.appendChild(cell);
    }
  }

  renderClues();
}

function handleCrosswordInput(event) {
  const input = event.target;
  input.value = input.value.toUpperCase().slice(0, 1);
  input.classList.remove("wrong", "correct");

  if (input.value && input.value.length === 1) {
    const index = crosswordInputs.indexOf(input);
    if (index >= 0 && index < crosswordInputs.length - 1) {
      crosswordInputs[index + 1].focus();
    }
  }
}

function startCrossword() {
  stage = "crossword";
  updateMessage("Level 3: Solve the mini crossword.");
  photoOverlay.textContent = "Crossword time";
  crosswordFeedback.textContent = "Click here once you're done!";
  crosswordOverlay.hidden = false;
  crosswordCells.forEach(({ input }) => {
    input.value = "";
    input.classList.remove("wrong", "correct");
  });
  const firstInput = crosswordInputs[0];
  if (firstInput) {
    firstInput.focus();
  }
}

function checkCrossword() {
  let solved = true;
  crosswordCells.forEach(({ input, letter }) => {
    const value = input.value.trim().toUpperCase();
    if (value === letter) {
      input.classList.add("correct");
      input.classList.remove("wrong");
    } else {
      solved = false;
      if (value.length > 0) {
        input.classList.add("wrong");
      }
    }
  });

  if (solved) {
    crosswordSolved = true;
    crosswordOverlay.hidden = true;
    showCongrats();
  } else {
    crosswordFeedback.textContent = "Not quite yet — keep going.";
  }
}

crosswordCheck.addEventListener("click", checkCrossword);

snakeRetry.addEventListener("click", () => {
  if (stage !== "snake") return;
  snakeFail.hidden = true;
  initSnakeGame();
  snakeTimer = window.setInterval(stepSnake, 120);
});

function showCongrats() {
  stage = "congrats";
  congrats.hidden = false;
  document.body.classList.remove("game-mode");
}

window.addEventListener("resize", () => {
  if (stage === "snake") {
    resizeSnakeCanvas();
    drawSnake();
  }
  if (stage === "snitch") {
    setupMovers();
  }
});

buildCrossword();

dateOptions.forEach((option) => {
  option.addEventListener("click", () => {
    dateOptions.forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });
    option.classList.add("selected");
    option.setAttribute("aria-pressed", "true");
    if (dateMessage) {
      dateMessage.hidden = false;
    }
    launchConfetti();
  });
});

function launchConfetti() {
  const existing = document.querySelector(".confetti-layer");
  if (existing) {
    existing.remove();
  }

  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);

  const colors = ["#f05474", "#f7b267", "#ffd166", "#8cd3ff", "#a3f7bf", "#cbb7f4"];
  const pieceCount = 140;

  for (let i = 0; i < pieceCount; i += 1) {
    const piece = document.createElement("div");
    const size = 6 + Math.random() * 8;
    const left = Math.random() * 100;
    const duration = 2.6 + Math.random() * 1.8;
    const delay = Math.random() * 0.2;
    const drift = (Math.random() * 100 - 50).toFixed(1);

    piece.className = "confetti";
    piece.style.left = `${left}vw`;
    piece.style.setProperty("--size", `${size}px`);
    piece.style.setProperty("--color", colors[i % colors.length]);
    piece.style.setProperty("--duration", `${duration}s`);
    piece.style.setProperty("--delay", `${delay}s`);
    piece.style.setProperty("--drift", `${drift}px`);
    layer.appendChild(piece);
  }

  window.setTimeout(() => {
    layer.remove();
  }, 4200);
}

stagePromptButton.addEventListener("click", () => {
  stagePrompt.hidden = true;
  const action = promptAction;
  promptAction = null;
  if (typeof action === "function") {
    action();
  }
});

function showPrompt(text, buttonLabel, onContinue) {
  stage = "prompt";
  promptAction = onContinue;
  stagePromptText.textContent = text;
  stagePromptButton.textContent = buttonLabel;
  stagePrompt.hidden = false;
  document.body.classList.add("game-mode");
}

function renderClues() {
  if (!crosswordAcross || !crosswordDown) return;
  crosswordAcross.innerHTML = "";
  crosswordDown.innerHTML = "";

  const acrossWords = crosswordConfig.words
    .filter((word) => word.dir === "across")
    .sort((a, b) => a.number - b.number);
  const downWords = crosswordConfig.words
    .filter((word) => word.dir === "down")
    .sort((a, b) => a.number - b.number);

  acrossWords.forEach((word) => {
    const li = document.createElement("li");
    li.value = word.number;
    li.textContent = word.clue;
    crosswordAcross.appendChild(li);
  });

  downWords.forEach((word) => {
    const li = document.createElement("li");
    li.value = word.number;
    li.textContent = word.clue;
    crosswordDown.appendChild(li);
  });
}

function createHeartDataUrl() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f05474";
  ctx.beginPath();
  ctx.moveTo(32, 54);
  ctx.bezierCurveTo(10, 40, 6, 18, 22, 14);
  ctx.bezierCurveTo(30, 12, 32, 18, 32, 18);
  ctx.bezierCurveTo(32, 18, 34, 12, 42, 14);
  ctx.bezierCurveTo(58, 18, 54, 40, 32, 54);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL("image/png");
}
