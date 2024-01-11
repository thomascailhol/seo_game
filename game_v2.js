let sp;
let queries;
const gameOverGif = 'https://giphy.com/embed/eJ4j2VnYOZU8qJU3Py';
const winGif = 'https://giphy.com/embed/26tOZ42Mg6pbTUPHW';

document.addEventListener('DOMContentLoaded', (event) => {
  sp =
    supabase.createClient('https://fyggsmdxumjqcmqkdizz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Z2dzbWR4dW1qcWNtcWtkaXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzMzU3NTYsImV4cCI6MjAxNjkxMTc1Nn0.c_-UlBxlaFZZcj9FKr8u33r2TE7KZSt_-MzijCPlB94');
  const startGameButton = document.getElementById('start-game');
  const rulesButton = document.getElementById('rules-button');
  // add event listenier to start game button
  startGameButton.addEventListener('click', function () {
    toggleMenu();
    togglePlayerInput();
  });
  // add event listener to rules button
  rulesButton.addEventListener('click', function () {
    toggleRules();
  });
  const form = document.getElementById('new-player-form'); // Replace with your form's ID
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitPlayerName();
  });
  const rulesWrapper = document.getElementById('rules-wrapper');
  rulesWrapper.addEventListener('click', function () {
    toggleRules();
  });
  collectQueries();
  collectPlayers();
});

class GameSession {
  constructor(query, queryIndex, playerName, context, cards) {
    this.query = query;
    this.cards = cards;
    this.numberOfResults = query.ranking.results.length;
    this.score = 0;
    // this.position = query.ranking.results.length - 5;
    this.position = 21;
    this.usedCards = [];
    this.gameOver = false;
    this.playerName = playerName;
    this.queryIndex = queryIndex;
    this.context = context;
  }

  chooseCard(index) {
    const card = this.cards[index];
    this.usedCards.push(card.uuid);
    if (card.impact === -666) {
      this.position = Math.max(1, Math.min(this.numberOfResults, this.position - card.impact));
      this.endGame('game_over');
    } else {
      this.position = Math.max(1, Math.min(this.numberOfResults, this.position - card.impact));
      console.log('Position:', this.position);
  
      if (this.position === 1 && this.usedCards.length < 6) {
        this.endGame('nailed_it');
      } else if (this.position === 1 && this.usedCards.length === 6) { 
        this.endGame('first_place');
      } else if (this.usedCards.length === 6 && this.position > 10) {
        this.endGame('lost');
      } else if (this.usedCards.length === 6 && this.position <= 3) {
        this.endGame('top_3');
      } else if (this.usedCards.length === 6 && this.position > 3) {
        this.endGame('top_10');
      }
    }
  }
  

  endGame(outcome) {
    this.gameOver = true;
    disableAllCards();
    this.computeFinalScore();

    if (outcome === 'nailed_it') {
      this.displayEndGame('won', `Incroyable ! Tu as terminé le SEO Game en première position en utilisant seulement ${this.usedCards.length} ${this.usedCards.length === 1 ? 'carte' : 'cartes'} ! Tu obtiens ${this.score} points !`);
    } else if (outcome === 'first_place') {
      this.displayEndGame('won', 'Bravo ! Tu as terminé le SEO Game en première position ! Tu obtiens ' + this.score + ' points !');
    } else if (outcome === 'top_3') {
      this.displayEndGame('won', 'Bravo ! Tu as terminé le SEO Game dans le top 3 à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !');
    } else if (outcome === 'top_10') {
      this.displayEndGame('won', 'Pas mal ! Tu as terminé le SEO Game dans le top 10 à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !');
    } else if (outcome === 'game_over') {
      this.displayEndGame('lost', 'Ouch ! Tu as terminé au fin fond des SERPs ' + this.playerName + ' à la position ' + this.position + ' ! C\'est la cata... Fonce voir un membre de l\'équipe hyffen pour te remonter le moral et te donner quelques conseils. (Tu obtiens bien évidemment ' + this.score + ' point !)');
    } else if (outcome === 'lost') {
      this.displayEndGame('lost', 'Tu peux mieux faire ! Tu as terminé le SEO Game à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !');
    }

    submitGameSessionToSupabase(this.playerName, this.query.id, this.usedCards);
  }


  computeFinalScore() {
    if (this.position === 1 && this.usedCards.length < 6) {
      this.score = queries[this.queryIndex].ranking.results.length * (6 - this.usedCards.length);
    } else if (this.position === 1) {
      this.score = queries[this.queryIndex].ranking.results.length;
    } else if (this.position === queries[this.queryIndex].ranking.results.length) {
      this.score = 0;
    } else if (this.usedCards.some(card => card.impact === -666)) {
      this.score = 0; // If the user picked a card with an impact of -666, set the score to 0
    } else {
      this.score = queries[this.queryIndex].ranking.results.length - this.position;
    }
  }  

  displayEndGame(outcome, message) {
    const endGame = document.getElementById('end-game');
    endGame.classList.remove('hidden');
    const endGameMessage = document.getElementById('end-game-message');
    endGameMessage.textContent = message;
    const endGameGif = document.getElementById('end-game-gif');
    if (outcome === 'won') {
      endGameGif.src = winGif;
    } else if (outcome === 'lost') {
      endGameGif.src = gameOverGif;
    }
  }
}

// Call the function

async function fetchQueries() {
  const queryTable = sp.from('Query_v2');

  try {
    const result = await queryTable.select('*');
    return result.data; // Return the data
  } catch (error) {
    console.error('Error retrieving queries from Supabase:', error);
    throw error; // Re-throw the error to be handled elsewhere if needed
  }
}

// Call the function using await (inside an async function) or then() if you prefer
async function collectQueries() {
  try {
    queries = await fetchQueries();
  } catch (error) {
    // Handle errors here if needed
    console.error('Error collecting queries:', error);
  }
}

async function fetchPlayers() {
  try {
    const { data, error } = await sp.rpc('get_players');

    if (error) throw error;

    // find playerName column value from games
    return data;
  } catch (err) {
    console.error('Error retrieving players from Supabase:', err);
    throw err; // Re-throw the error to be handled elsewhere if needed
  }
}

async function collectPlayers() {
  try {
    players = await fetchPlayers();
    insertPlayersNames(players);
  } catch (error) {
    // Handle errors here if needed
    console.error('Error collecting players:', error);
  }
}

let currentSession;

function displayQueries(playerName) {
  const queriesWrapper = document.getElementById('queries-wrapper');
  queriesWrapper.classList.remove('hidden');
  const queriesContainer = document.getElementById('queries-container');
  queriesContainer.innerHTML = '';

  queries.forEach((query, index) => {
    const queryButton = document.createElement('a');
    queryButton.className = 'query';
    queryButton.textContent = query.name;
    queryButton.addEventListener('click', function () {
      startNewSession(index, playerName);
    });

    queriesContainer.appendChild(queryButton);
  });
}

function insertPlayersNames(players) {
  const playersNames = document.getElementById('players-names');
  playersNames.innerHTML = '';
  players.forEach(player => {
    const playerName = document.createElement('p');
    playerName.classList.add('player-name');
    playerName.textContent = player.name;
    playersNames.appendChild(playerName);
    // Add an event listtner to set the player name value of the session to the text content of the playerName paragraph
    playerName.addEventListener('click', function () {
      // call submitPlayerName with the name of the clicked player
      submitPlayerName(player.name);
    });
  });
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('hidden');
  const gameGrid = document.getElementById('game-grid');
  gameGrid.classList.toggle('hidden');
}

function togglePlayerInput() {
  const playerInput = document.getElementById('player-wrapper');
  playerInput.classList.toggle('hidden');
}

function submitPlayerName(playerName) {
  if (playerName) {
    displayQueries(playerName);
    togglePlayerInput();
  } else {
    const playerNameInput = document.getElementById('player-name');
    const playerName = playerNameInput.value;
    displayQueries(playerName);
    togglePlayerInput();
  }
}

function toggleRules() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('hidden');
  const rules = document.getElementById('rules-wrapper');
  rules.classList.toggle('hidden');
}

async function startNewSession(queryIndex, playerName) {
  const selectedQuery = queries[queryIndex];
  const cards = await collectCards(queries[queryIndex].id);
  currentSession = new GameSession(selectedQuery, queryIndex, playerName, selectedQuery.context, cards);

  hideQueries();
  // displayCards(queries[currentSession.queryIndex].id);
  displayContext(selectedQuery.context);
  // displayQuery(selectedQuery['name']);
  currentSession.score = 0;
  // updateScoreDisplay();
  updateRankingDisplay();
}

function displayContext(context) {
  const container = document.getElementById('game-cards-container');
  const contextContainer = document.createElement('div');
  contextContainer.classList.add('context');
  contextContainer.textContent = context;
  container.insertAdjacentElement('afterbegin', contextContainer);
}

function updateUsedCardsCount() {
  const usedCardsCount = document.getElementById('used-cards-count');
  usedCardsCount.textContent = currentSession.usedCards.length;
}

function onCardChoice(index, cardElement) {
  const impact = currentSession.cards[index].impact;
  currentSession.chooseCard(index);
  // find card element child with id game-card-inner and add class used
  cardElement.querySelector('.game-card-inner').classList.add('used');

  const impactWrapper = cardElement.querySelector('.impact-wrapper');
  // add a paragraph inside impact wrapper sith class impact-score
  const impactScore = document.createElement('p');
  impactScore.classList.add('impact-score');
  // add a class to the impact score depending on the impact if negative add text-pink and if positive add text-blue
  if (impact <= 0) {
    impactScore.classList.add('text-pink');
  } else {
    impactScore.classList.add('text-blue');
  }
  impactScore.textContent = impact;
  impactWrapper.appendChild(impactScore);

  // cardElement.classList.remove('game-card');
  cardElement.removeEventListener('click', cardClickHandler);

  // updateGameState(index);

  // checkForEndGame();

  // updateScoreDisplay();
  updateRankingDisplay();
}

function hideQueries() {
  const queryDisplay = document.getElementById('queries-wrapper');
  queryDisplay.textContent = '';
}

function updateGameState(index) {
  // currentSession.score = currentSession.position - queries;
}

function checkForEndGame() {
  if (currentSession.position <= 1) {
    currentSession.endGame('won');
  } else if (currentSession.usedCards.length >= 6) {
    currentSession.endGame('lost');
  }
}

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('score-display');
  scoreDisplay.textContent = "Score: " + currentSession.score;
}

function displayQuery(query) {
  const queryDisplay = document.getElementById('query');
  queryDisplay.textContent = query;
}

function updateRankingDisplay() {
  const googleResultsDiv = document.getElementById('ranking-display');
  googleResultsDiv.innerHTML = '';
  updateUsedCardsCount();

  const results = [...queries[currentSession.queryIndex].ranking.results];
  userSite = results.find(result => result.userSite);
  // remove userSite from results
  results.splice(results.indexOf(userSite), 1);
  // const userSite = {
  //   id: 15, // Assign a unique ID for the user's site
  //   title: 'Your Site', // Custom title for the user's site
  //   url: 'https://www.yoursite.com', // Custom URL for the user's site
  //   description: 'Your site description.', // Custom description
  //   userSite: true // Flag to identify the user's site
  // };

  // // Assuming that the maximum number of moves to win is 6 (as per your game logic)
  // const maxMoves = 6;

  // // Calculate the moves made so far
  // const movesMade = currentSession.usedCards.length;

  // const cumulativeImpact = currentSession.usedCards.reduce((total, card) => total + card.impact, 0);

  // // Determine the user's site position based on cumulative impact
  // // The impact is subtracted from a starting point (e.g., 15), and bounds are enforced
  // const numberOfResults = results.length;
  // const userSitePosition = Math.max(1, Math.min(numberOfResults, numberOfResults - cumulativeImpact));
  const userSitePosition = currentSession.position;

  // Insert the user's site at the calculated position
  results.splice(userSitePosition - 1, 0, userSite);

  results.forEach((result, index) => {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'google-result';

    // Create elements for title, URL, and description
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = (index + 1) + '. ' + result.title;

    const url = document.createElement('div');
    url.className = 'url';
    url.textContent = result.url;

    const description = document.createElement('div');
    description.className = 'description';
    description.textContent = result.description;

    // Append elements to the resultDiv
    resultDiv.appendChild(title);
    resultDiv.appendChild(url);
    resultDiv.appendChild(description);

    // Highlight the user's site
    if (result.userSite) {
      resultDiv.classList.add('user-position'); // Add a class for custom styling
      // add n empty div inside the resultDiv taht would be positioned absolutely 80px up from the top
      const userSiteScrollPosition = document.createElement('div');
      userSiteScrollPosition.classList.add('user-site-scroll-position');
      resultDiv.appendChild(userSiteScrollPosition);
    }

    googleResultsDiv.appendChild(resultDiv);
  });

  // add overflow-y scroll to game-grid-column
  const resultsGridColumn = document.getElementById('results-grid-column');
  resultsGridColumn.classList.add('overflow-y-scroll');

  // scroll to user's site
  const userSiteElement = document.querySelector('.user-site-scroll-position');
  // set timeout to wait for the results to be rendered
  setTimeout(() => {
    userSiteElement.scrollIntoView({ behavior: 'smooth' });
  }, 3);
}

function generateFakeGoogleResults(count) {
  const fakeResults = [];
  for (let i = 0; i < count; i++) {
    fakeResults.push('Result ' + (i + 1));
  }
  return fakeResults;
}

async function fetchCards(query_id) {
  const cardTable = sp.from('Card_v2');

  try {
    let { data, error } = await cardTable
      .select("*")
      .eq('query_id', query_id)

    if (error) throw error;

    // find playerName column value from games
    return data;
  } catch (err) {
    console.error('Error retrieving cards from Supabase:', err);
    throw err; // Re-throw the error to be handled elsewhere if needed
  }
}

async function collectCards(query_id) {
  try {
    cards = await fetchCards(query_id)
    console.log(cards)
    displayCards(cards);
    return cards;
  } catch (error) {
    // Handle errors here if needed
    console.error('Error collecting cards:', error);
  }
}

function displayCards(cards) {
  const container = document.getElementById('game-cards-container');

  container.innerHTML = '';

  cards.forEach((card, cardIndex) => {
    const gameCard = document.createElement('div');
    gameCard.classList.add('game-card');

    const gameCardInner = document.createElement('div');
    gameCardInner.classList.add('game-card-inner');

    const gameCardTitleWrapper = document.createElement('div');
    gameCardTitleWrapper.classList.add('game-card-title-wrapper');

    const gameCardDescriptionWrapper = document.createElement('div');
    gameCardDescriptionWrapper.classList.add('game-card-description-wrapper');

    const impactWrapper = document.createElement('div');
    impactWrapper.classList.add('impact-wrapper');

    gameCard.appendChild(gameCardInner);
    gameCard.setAttribute('data-index', cardIndex);

    const title = `
      <p class="game-card-title">${card.name}</h3>
      `;

    gameCardTitleWrapper.innerHTML = title;

    const description = `
      <p class="game-card-description">${card.description}</p>
      `;

    gameCardDescriptionWrapper.innerHTML = description;

    gameCardInner.innerHTML = ``
    gameCardInner.appendChild(gameCardTitleWrapper); // Add gameCardTitleWrapper to gameCardInner
    gameCardInner.appendChild(gameCardDescriptionWrapper); // Add gameCardDescriptionWrapper to gameCardInner
    gameCard.appendChild(impactWrapper); // Add impactWrapper to gameCardInner

    gameCard.addEventListener('click', cardClickHandler);

    container.appendChild(gameCard);
  });
}

function cardClickHandler(event) {
  if (currentSession.gameOver) {
    return;
  }

  const cardElement = event.currentTarget;
  const index = parseInt(cardElement.getAttribute('data-index'), 10);

  onCardChoice(index, cardElement);
}

function disableAllCards() {
  const cards = document.getElementsByClassName('game-card');
  for (let card of cards) {
    card.classList.add('used');
    card.removeEventListener('click', cardClickHandler);
  }
}

function hideRules() {
  const rules = document.getElementById('rules');
  rules.classList.add('hidden');
}

function submitGameSessionToSupabase(playerName, query, cards) {
  const gameSessionsTable = sp.from('Game_v2');

  gameSessionsTable.insert([
    { player_name: playerName, query_id: query, cards: cards }
  ]).select()
  .then(result => {
    // Handle success
    console.log('Game session submitted successfully:', result);
    let game_id = result.data[0].id;
  })
  .catch(error => {
    // Handle error
    console.error('Error submitting game session to Supabase:', error);
  });
}