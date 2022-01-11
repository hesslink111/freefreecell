const dragCounts = new Map();
const cardColors = {
  '♥': 'red',
  '♦': 'red',
  '♠': 'black',
  '♣': 'black'
};
const cardNumericValues = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13
};
const cardFaces = {
  'J': '💂',
  'Q': '👸',
  'K': '🤴'
};
const cardNames = {
  'A': 'Ace',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '10': 'Ten',
  'J': 'Jack',
  'Q': 'Queen',
  'K': 'King'
};

function dragStart(event) {
  event.dataTransfer.setData("freecell/card-id", event.target.id);
}

function dragEnter(event) {
  const stack = event.target.closest(".stack");
  const count = incrementDragCount(stack, 1);
}

function dragLeave(event) {
  const stack = event.target.closest(".stack");
  const count = incrementDragCount(stack, -1);
}

function incrementDragCount(stack, increment) {
  const count = Math.max(0, (dragCounts.get(stack) ?? 0) + increment);
  dragCounts.set(stack, count);
  updateHighlight(stack);
}

function resetDragCount(stack) {
  dragCounts.clear();
  for(stack of document.querySelectorAll(".stack")) {
    updateHighlight(stack);
  }
}

function updateHighlight(stack) {
  const count = dragCounts.get(stack) ?? 0
  if(count >= 1) {
    stack.classList.add("highlight");
  } else {
    stack.classList.remove("highlight");
  }
}

function dragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function drop(event) {
  const stack = dragEventTargetStack(event);
  const card = dragEventSourceCard(event);
  resetDragCount(stack);
  const canAccept = cardCanMoveToStack(card, stack);
  if(canAccept) {
    moveCardToStack(card, stack);
  }
}

function dragEventTargetStack(event) {
  return event.target.closest(".stack");
}

function dragEventSourceCard(event) {
  return document.getElementById(event.dataTransfer.getData("freecell/card-id"));
}

function tryMoveCard(event) {
  const card = event.target.closest(".card");
  const aceStacks = document.querySelectorAll(".stack.ace");
  const pileStacks = document.querySelectorAll(".stack.pile");
  const freeStacks = document.querySelectorAll(".stack.free");
  for(const stack of [...aceStacks, ...pileStacks, ...freeStacks]) {
    if(cardCanMoveToStack(card, stack)) {
      moveCardToStack(card, stack);
      return;
    }
  }
}

function cardCanMoveToStack(card, stack) {
  const sourceStack = cardSourceStack(card);
  if(!stackCanDropCard(sourceStack, card)) {
    return false;
  }
  if(stackIsAceStack(stack)) {
    const cardsInStack = stackCards(stack);
    if(cardsInStack.length === 0) {
      return cardValue(card) === 1;
    }
    const topCard = cardsInStack[cardsInStack.length - 1];
    return cardValue(card) === cardValue(topCard) + 1 && cardSuite(card) == cardSuite(topCard);
  } else if(stackIsFreeCellStack(stack)) {
    const cardsInStack = stackCards(stack);
    return cardsInStack.length === 0;
  } else if(stackIsPileStack(stack)) {
    const cardsInStack = stackCards(stack);
    if(cardsInStack.length === 0) {
      return true;
    }
    const topCard = cardsInStack[cardsInStack.length - 1];
    return (cardValue(card) === (cardValue(topCard) - 1)) && cardColor(card) !== cardColor(topCard);
  }
  return false;
}

function moveCardToStack(card, stack) {
  stack.appendChild(card);
  if(stackIsAceStack(stack) && gameWon()) {
    const wins = parseInt(localStorage.getItem("wins") ?? 0) + 1;
    localStorage.setItem("wins", wins);
    updateStats();
  }
}

function gameWon() {
  const stacks = document.querySelectorAll(".stack.ace");
  for(stack of stacks) {
    const cardsInStack = stackCards(stack);
    if(cardsInStack.length !== 13) {
      return false;
    }
  }
  return true;
}

function stackIsAceStack(stack) {
  return stack.classList.contains("ace");
}

function stackIsFreeCellStack(stack) {
  return stack.classList.contains("free");
}

function stackIsPileStack(stack) {
  return stack.classList.contains("pile");
}

function stackCards(stack) {
  return stack.querySelectorAll(".card");
}

function stackCanDropCard(stack, card) {
  const cardsInStack = stackCards(stack);
  if(card !== cardsInStack[cardsInStack.length - 1]) {
    return false;
  }
  return !stackIsAceStack(stack);
}

function cardSourceStack(card) {
  return card.closest(".stack");
}

function cardValue(card) {
  return cardNumericValues[card.querySelector(".value").textContent];
}

function cardColor(card) {
  return cardColors[cardSuite(card)];
}

function cardSuite(card) {
  return card.querySelector(".suite").textContent;
}

function valueIsFace(value) {
  return value in cardFaces;
}

function resetBoard() {
  clearBoard();
  dealCards();
}

function clearBoard() {
  for(const card of document.querySelectorAll(".card")) {
    card.remove();
  }
}

function dealCards() {
  const cards = [];
  for(const suite of Object.keys(cardColors)) {
    for(const value of Object.keys(cardNames)) {
      cards.push(makeCard(value, suite));
    }
  }
  const shuffledCards = [];
  while(cards.length > 0) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    const card = cards[randomIndex];
    shuffledCards.push(card);
    cards.splice(randomIndex, 1);
  }

  const stacks = document.querySelectorAll(".stack.pile");
  let nextStack = 0
  for(const card of shuffledCards) {
    stacks[nextStack].appendChild(card);
    nextStack = (nextStack + 1) % 8;
  }

  const attempts = parseInt(localStorage.getItem("attempts") ?? 0) + 1;
  localStorage.setItem("attempts", attempts);

  updateStats();
}

function makeCard(value, suite) {
  const card = document.createElement("div");
  card.id = value + suite;
  card.classList.add("card");
  card.classList.add(cardColors[suite]);
  card.setAttribute("draggable", true);
  card.ondragstart = dragStart;
  card.ondblclick = tryMoveCard;

  const titleTop = document.createElement("div");
  titleTop.classList.add("title");
  titleTop.classList.add("top");
  const v = document.createElement("span");
  v.classList.add("value");
  v.textContent = value;
  titleTop.appendChild(v);
  const s = document.createElement("span");
  s.classList.add("suite");
  s.textContent = suite;
  titleTop.appendChild(s);
  card.appendChild(titleTop);

  const titleBottom = titleTop.cloneNode(true);
  titleBottom.classList.remove("top");
  titleBottom.classList.add("bottom");
  card.appendChild(titleBottom);

  const inner = document.createElement("div");
  inner.classList.add("inner");
  if(valueIsFace(value)) {
    inner.classList.add("face");
    const face = document.createElement("div");
    face.classList.add("face");
    face.textContent = cardFaces[value];
    inner.appendChild(face);
  }
  const name = document.createElement("div");
  name.classList.add("name");
  name.textContent = cardNames[value];
  inner.appendChild(name);
  card.appendChild(inner);

  return card;
}

function updateStats() {
  const attempts = parseInt(localStorage.getItem("attempts") ?? 0);
  const wins = parseInt(localStorage.getItem("wins") ?? 0);

  document.querySelector(".stat.attempts").textContent = `Attempts: ${attempts}`;
  document.querySelector(".stat.wins").textContent = `Wins: ${wins}`;
  document.querySelector(".stat.rate").textContent = `Rate: ${Math.round(100 * (wins / attempts))}%`;
}
