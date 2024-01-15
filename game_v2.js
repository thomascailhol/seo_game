const sp = supabase.createClient('https://fyggsmdxumjqcmqkdizz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Z2dzbWR4dW1qcWNtcWtkaXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzMzU3NTYsImV4cCI6MjAxNjkxMTc1Nn0.c_-UlBxlaFZZcj9FKr8u33r2TE7KZSt_-MzijCPlB94');
const gameOverGif = 'https://giphy.com/embed/eJ4j2VnYOZU8qJU3Py';
const winGif = 'https://giphy.com/embed/26tOZ42Mg6pbTUPHW';

document.addEventListener('DOMContentLoaded', (event) => {
  const startGameButton = document.getElementById('start-game');
  const rulesButton = document.getElementById('rules-button');
  const form = document.getElementById('new-player-form');
  const rulesWrapper = document.getElementById('rules-wrapper');
  let queries = [];

  startGameButton.addEventListener('click', () => {
    toggleMenu();
    togglePlayerInput();
  });

  rulesButton.addEventListener('click', () => {
    toggleRules();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitPlayerName();
  });

  rulesWrapper.addEventListener('click', () => {
    toggleRules();
  });

  collectQueries();

  function collectQueries() {
    fetchQueries()
      .then((data) => {
        queries = data;
      })
      .catch((error) => {
        console.error('Error collecting queries:', error);
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
    if (!playerName) {
      const playerNameInput = document.getElementById('player-name');
      playerName = playerNameInput.value;
    }
    displayQueries(playerName);
    togglePlayerInput();
  }

  function toggleRules() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('hidden');
    const rules = document.getElementById('rules-wrapper');
    rules.classList.toggle('hidden');
  }

  function displayQueries(playerName) {
    const queriesWrapper = document.getElementById('queries-wrapper');
    queriesWrapper.classList.remove('hidden');
    const queriesContainer = document.getElementById('queries-container');
    queriesContainer.innerHTML = '';

    queries.forEach((query, index) => {
      const queryButton = document.createElement('a');
      queryButton.className = 'query';
      queryButton.textContent = query.name;
      queryButton.addEventListener('click', () => {
        startNewSession(index, playerName);
      });

      queriesContainer.appendChild(queryButton);
    });
  }

  async function fetchQueries() {
    const queryTable = sp.from('Query_v2');

    try {
      const result = await queryTable.select('*');
      return result.data;
    } catch (error) {
      console.error('Error retrieving queries from Supabase:', error);
      throw error;
    }
  }

  async function startNewSession(queryIndex, playerName) {
    const selectedQuery = queries[queryIndex];
    const cards = await collectCards(selectedQuery.id);
    const currentSession = new GameSession(selectedQuery, queryIndex, playerName, selectedQuery.context, cards);

    hideQueries();
    displayContext(selectedQuery.context);
    updateRankingDisplay(currentSession);
  }

  function hideQueries() {
    const queryDisplay = document.getElementById('queries-wrapper');
    queryDisplay.textContent = '';
  }

  function displayContext(context) {
    const container = document.getElementById('game-cards-container');
    const contextContainer = document.createElement('div');
    contextContainer.classList.add('context');
    contextContainer.textContent = context;
    container.insertAdjacentElement('afterbegin', contextContainer);
  }

  async function collectCards(queryId) {
    try {
      const cards = await fetchCards(queryId);
      displayCards(cards);
      return cards;
    } catch (error) {
      console.error('Error collecting cards:', error);
    }
  }

  async function fetchCards(queryId) {
    const cardTable = sp.from('Card_v2');

    try {
      const { data, error } = await cardTable.select('*').eq('query_id', queryId);

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error retrieving cards from Supabase:', err);
      throw err;
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

      gameCardInner.innerHTML = ``;
      gameCardInner.appendChild(gameCardTitleWrapper);
      gameCardInner.appendChild(gameCardDescriptionWrapper);
      gameCard.appendChild(impactWrapper);

      gameCard.addEventListener('click', cardClickHandler);

      container.appendChild(gameCard);
    });
  }

  function cardClickHandler(event) {
    const cardElement = event.currentTarget;
    const index = parseInt(cardElement.getAttribute('data-index'), 10);

    onCardChoice(index, cardElement);
  }

  function onCardChoice(index, cardElement) {
    if (currentSession.gameOver) {
      return;
    }

    const impact = currentSession.cards[index].impact;
    currentSession.chooseCard(index);

    cardElement.querySelector('.game-card-inner').classList.add('used');

    const impactWrapper = cardElement.querySelector('.impact-wrapper');
    const impactScore = document.createElement('p');
    impactScore.classList.add('impact-score');

    if (impact <= 0) {
      impactScore.classList.add('text-pink');
    } else {
      impactScore.classList.add('text-blue');
    }
    impactScore.textContent = impact;
    impactWrapper.appendChild(impactScore);

    cardElement.removeEventListener('click', cardClickHandler);

    updateRankingDisplay(currentSession);
  }

  function updateRankingDisplay(currentSession) {
    const googleResultsDiv = document.getElementById('ranking-display');
    googleResultsDiv.innerHTML = '';
    updateUsedCardsCount(currentSession);

    const results = [...queries[currentSession.queryIndex].ranking.results];
    userSite = results.find(result => result.userSite);
    results.splice(results.indexOf(userSite), 1);

    const userSitePosition = currentSession.position;

    results.splice(userSitePosition - 1, 0, userSite);

    results.forEach((result, index) => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'google-result';

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = (index + 1) + '. ' + result.title;

      const url = document.createElement('div');
      url.className = 'url';
      url.textContent = result.url;

      const description = document.createElement('div');
      description.className = 'description';
      description.textContent = result.description;

      resultDiv.appendChild(title);
      resultDiv.appendChild(url);
      resultDiv.appendChild(description);

      if (result.userSite) {
        resultDiv.classList.add('user-position');
        const userSiteScrollPosition = document.createElement('div');
        userSiteScrollPosition.classList.add('user-site-scroll-position');
        resultDiv.appendChild(userSiteScrollPosition);
      }

      googleResultsDiv.appendChild(resultDiv);
    });

    const resultsGridColumn = document.getElementById('results-grid-column');
    resultsGridColumn.classList.add('overflow-y-scroll');

    const userSiteElement = document.querySelector('.user-site-scroll-position');
    setTimeout(() => {
      userSiteElement.scrollIntoView({ behavior: 'smooth' });
    }, 3);
  }

  function updateUsedCardsCount(currentSession) {
    const usedCardsCount = document.getElementById('used-cards-count');
    usedCardsCount.textContent = currentSession.usedCards.length;
  }
});

class GameSession {
  constructor(query, queryIndex, playerName, context, cards) {
    this.query = query;
    this.cards = cards;
    this.numberOfResults = query.ranking.results.length;
    this.score = 0;
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

    let message = '';

    if (outcome === 'nailed_it') {
      message = `Incroyable ! Tu as terminé le SEO Game en première position en utilisant seulement ${this.usedCards.length} ${this.usedCards.length === 1 ? 'carte' : 'cartes'} ! Tu obtiens ${this.score} points !`;
    } else if (outcome === 'first_place') {
      message = 'Bravo ! Tu as terminé le SEO Game en première position ! Tu obtiens ' + this.score + ' points !';
    } else if (outcome === 'top_3') {
      message = 'Bravo ! Tu as terminé le SEO Game dans le top 3 à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !';
    } else if (outcome === 'top_10') {
      message = 'Pas mal ! Tu as terminé le SEO Game dans le top 10 à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !';
    } else if (outcome === 'game_over') {
      message = 'Ouch ! Tu as terminé au fin fond des SERPs ' + this.playerName + ' à la position ' + this.position + ' ! C\'est la cata... Fonce voir un membre de l\'équipe hyffen pour te remonter le moral et te donner quelques conseils. (Tu obtiens bien évidemment ' + this.score + ' point !)';
    } else if (outcome === 'lost') {
      message = 'Tu peux mieux faire ! Tu as terminé le SEO Game à la position ' + this.position + ' ! Tu obtiens ' + this.score + ' points !';
    }

    this.displayEndGame(outcome, message);
    submitGameSessionToSupabase(this.playerName, this.query.id, this.usedCards);
  }

  computeFinalScore() {
    if (this.position === 1 && this.usedCards.length < 6) {
      this.score = this.query.ranking.results.length * (6 - this.usedCards.length);
    } else if (this.position === 1) {
      this.score = this.query.ranking.results.length;
    } else if (this.position === this.query.ranking.results.length) {
      this.score = 0;
    } else if (this.usedCards.some(card => card.impact === -666)) {
      this.score = 0;
    } else {
      this.score = this.query.ranking.results.length - this.position;
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

function disableAllCards() {
  const cards = document.getElementsByClassName('game-card');

  for (let card of cards) {
    card.classList.add('used');
    card.removeEventListener('click', cardClickHandler);
  }
}

function submitGameSessionToSupabase(playerName, query, cards) {
  const gameSessionsTable = sp.from('Game_v2');

  gameSessionsTable.insert([
    { player_name: playerName, query_id: query, cards: cards }
  ])
    .select()
    .then(result => {
      console.log('Game session submitted successfully:', result);
      let game_id = result.data[0].id;
    })
    .catch(error => {
      console.error('Error submitting game session to Supabase:', error);
    });
}