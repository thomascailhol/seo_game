let sp;

document.addEventListener('DOMContentLoaded', (event) => {
  sp = 
    supabase.createClient('https://fyggsmdxumjqcmqkdizz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Z2dzbWR4dW1qcWNtcWtkaXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzMzU3NTYsImV4cCI6MjAxNjkxMTc1Nn0.c_-UlBxlaFZZcj9FKr8u33r2TE7KZSt_-MzijCPlB94');
  console.log(sp);
  const startGameButton = document.getElementById('start-game');
  const rulesButton = document.getElementById('rules-button');
  // add event listenier to start game button
  startGameButton.addEventListener('click', function () {
      console.log('display queries');
      toggleMenu();
      togglePlayerInput();
  });
  // add event listener to rules button
  rulesButton.addEventListener('click', function () {
      console.log('display rules');
      toggleRules();
  });
  const form = document.getElementById('new-player-form'); // Replace with your form's ID
  form.addEventListener('submit', function(event) {
      event.preventDefault();
      submitPlayerName();
  });
});

class GameSession {
  constructor(query, queryIndex, playerName) {
      this.query = query;
      this.score = 0;
      this.position = 15;
      this.usedCards = [];
      this.gameOver = false;
      this.playerName = playerName;
      this.queryIndex = queryIndex;
  }

  chooseCard(index) {
      const card = this.query.cards[index];
      this.usedCards.push(card);

      this.position = Math.max(1, Math.min(15, this.position - card.impact)); // minus because the goal is to go first
      
      if (this.position === 1) {
          this.endGame('won');
      } else if (this.position === 15 || this.usedCards.length >= 6) {
          this.endGame('lost');
      }
  }

  endGame(outcome) {
      this.gameOver = true;
      disableAllCards();
      computeFinalScore();

      console.log('Your score is ' + this.score)
      if (outcome === 'won') {
          console.log('You won!');
      } else {
          console.log('You lost!');
      }

      submitGameSessionToSupabase(this.playerName, this.position, this.usedCards.length, this.score, this.query.name, this.score);
  }


  computeFinalScore() {
    if (this.position === 1) {
      this.score = 15;
    } else if (this.position === (queries[this.queryIndex].ranking.length + 1)) {
      this.score = 0;
    } else {
      this.score = (queries[this.queryIndex].ranking.length + 1) - this.position;
    }
  }
}

const queries = [
{
      name: 'learn digital marketing',
      cards: [
          { id: 1, name: 'Optimize for Educational Keywords', description: 'Focus on keywords related to digital marketing courses and tutorials.', impact: 3, color: '#000' },
          { id: 2, name: 'Develop Engaging Course Content', description: 'Create engaging and informative content for digital marketing learners.', impact: 4, color: '#000' },
          { id: 3, name: 'Utilize Video Tutorials', description: 'Incorporate video tutorials to enhance learning experiences.', impact: 2, color: '#000' },
          { id: 4, name: 'Leverage Influencer Collaborations', description: 'Collaborate with digital marketing influencers for wider reach.', impact: 3, color: '#000' },
          { id: 5, name: 'Implement User-Friendly Design', description: 'Ensure the website is easy to navigate for all users.', impact: 2, color: '#000' },
          { id: 6, name: 'Use Irrelevant Keywords', description: 'Sprinkle some random keywords like \'unicorn\' for that magical SEO touch.', impact: -2, color: '#000' },
          { id: 7, name: 'Ignore Mobile Optimization', description: 'Who needs mobile users anyway? Desktop is where it’s at!', impact: -3, color: '#000' },
          { id: 8, name: 'Spammy Backlinks Galore', description: 'Get backlinks from every corner of the internet, relevance optional.', impact: -2, color: '#000' },
          { id: 9, name: 'Overuse Jargon', description: 'Use complex digital marketing jargon to confuse and impress.', impact: -1, color: '#000' },
          { id: 10, name: 'Duplicate Content', description: 'Why create new content when you can copy-paste?', impact: -4, color: '#000' },
          { id: 11, name: 'Engage with Alumni Reviews', description: 'Encourage alumni to leave reviews for credibility.', impact: 2, color: '#000' },
          { id: 12, name: 'Host Interactive Webinars', description: 'Increase engagement through live webinars and Q&A sessions.', impact: 3, color: '#000' },
          { id: 13, name: 'Create Downloadable Resources', description: 'Offer downloadable ebooks and worksheets for extra learning.', impact: 2, color: '#000' },
          { id: 14, name: 'Optimize Course Descriptions', description: 'Write clear and compelling descriptions for each course.', impact: 3, color: '#000' },
          { id: 15, name: 'Use Data-Driven Insights', description: 'Analyze website data to continuously improve your strategies.', impact: 2, color: '#000' }
      ],
      ranking: [
          { id: 1, title: 'Digital Marketing Pro Courses', url: 'https://www.digitalmarketingpro.com', description: 'Master digital marketing with our advanced professional courses.' },
          { id: 2, title: 'Easy Learn Digital', url: 'https://www.easylearndigital.com', description: 'Beginner-friendly digital marketing courses to kickstart your career.' },
          { id: 3, title: 'Market Masters Academy', url: 'https://www.marketmastersacademy.com', description: 'Learn from the masters to become a digital marketing expert.' },
          { id: 4, title: 'Techie Marketeers', url: 'https://www.techmarketeers.com', description: 'Tech-savvy digital marketing courses for the modern learner.' },
          { id: 5, title: 'Creative Digital School', url: 'https://www.creativedigitalschool.com', description: 'Blend creativity and technology with our unique digital marketing curriculum.' },
          { id: 6, title: 'NextGen Marketers', url: 'https://www.nextgenmarketers.com', description: 'Future-proof your marketing skills with our cutting-edge courses.' },
          { id: 7, title: 'Marketing Wizardry', url: 'https://www.marketingwizardry.com', description: 'Cast a spell on your audience with magical marketing techniques.' },
          { id: 8, title: 'SEO Mastery Hub', url: 'https://www.seomasteryhub.com', description: 'Become an SEO master with our comprehensive training programs.' },
          { id: 9, title: 'Social Media Gurus', url: 'https://www.socialmediagurus.com', description: 'Learn the secrets of social media marketing from industry gurus.' },
          { id: 10, title: 'Influencer Marketing Insights', url: 'https://www.influencermarketinginsights.com', description: 'Dive into the world of influencer marketing and elevate your strategy.' },
          { id: 11, title: 'Digital Ads Academy', url: 'https://www.digitaladsacademy.com', description: 'Expert training in crafting successful digital advertising campaigns.' },
          { id: 12, title: 'Content Marketing Corner', url: 'https://www.contentmarketingcorner.com', description: 'Learn how to create content that captivates and converts.' },
          { id: 13, title: 'Email Marketing Experts', url: 'https://www.emailmarketingexperts.com', description: 'Master the art of email marketing for maximum engagement.' },
          { id: 14, title: 'Analytics for Marketers', url: 'https://www.analyticsformarketers.com', description: 'Use analytics to drive your digital marketing decisions and strategies.' }
      ]
  }
];

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
      queryButton.addEventListener('click', function() {
          startNewSession(index, playerName);
      });

      queriesContainer.appendChild(queryButton);
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

function submitPlayerName() {
  const playerNameInput = document.getElementById('player-name');
  const playerName = playerNameInput.value;
  console.log('Player name:', playerName);
  displayQueries(playerName);
  togglePlayerInput();
  // toggleMenu();
}

function toggleRules() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('hidden');
  const rules = document.getElementById('rules');
  rules.classList.toggle('hidden');
}

function startNewSession(queryIndex, playerName) {
  const selectedQuery = queries[queryIndex];
  console.log('Starting new session with query:', selectedQuery);
  currentSession = new GameSession(selectedQuery, queryIndex, playerName);

  hideRules();
  hideQueries();
  displayCards(selectedQuery['cards']);
  // displayQuery(selectedQuery['name']);
  currentSession.score = 0;
  // updateScoreDisplay();
  updateRankingDisplay();
}

function updateUsedCardsCount() {
  const usedCardsCount = document.getElementById('used-cards-count');
  usedCardsCount.textContent = currentSession.usedCards.length;
}

function onCardChoice(index, cardElement) {
  const impact = currentSession.query.cards[index].impact;
  currentSession.chooseCard(index);

  cardElement.classList.add('used');
  
  const impactWrapper = cardElement.querySelector('.impact-wrapper');
  // add a paragraph inside impact wrapper sith class impact-score
  const impactScore = document.createElement('p');
  impactScore.classList.add('impact-score');
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
  console.log("Impact: " + card.impact  + " Score: " + currentSession.score)
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

  const results = [...queries[0].ranking]; // Clone the ranking array
  const userSite = {
      id: 15, // Assign a unique ID for the user's site
      title: 'Your Site', // Custom title for the user's site
      url: 'https://www.yoursite.com', // Custom URL for the user's site
      description: 'Your site description.', // Custom description
      userSite: true // Flag to identify the user's site
  };

  // Assuming that the maximum number of moves to win is 6 (as per your game logic)
  const maxMoves = 6;

  // Calculate the moves made so far
  const movesMade = currentSession.usedCards.length;

  const cumulativeImpact = currentSession.usedCards.reduce((total, card) => total + card.impact, 0);

  // Determine the user's site position based on cumulative impact
  // The impact is subtracted from a starting point (e.g., 15), and bounds are enforced
  const userSitePosition = Math.max(1, Math.min(15, 15 - cumulativeImpact));

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
      gameCardInner.appendChild(impactWrapper); // Add impactWrapper to gameCardInner

      gameCard.addEventListener('click', cardClickHandler);

      container.appendChild(gameCard);
  });
}

function cardClickHandler(event) {
  if (currentSession.gameOver) {
      console.log('The game is over. Please start a new game.');
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

function submitGameSessionToSupabase(playerName, finalPosition, cardsUsed, score, query, total_impact) {
  const gameSessionsTable = sp.from('Game');

  gameSessionsTable.insert([
      { player_name: playerName, final_position: finalPosition, cards_used: cardsUsed, computed_score: score, query: query, total_impact: total_impact }
  ]).then(result => {
      console.log('Game session submitted to Supabase:', result);
  }).catch(error => {
      console.error('Error submitting game session to Supabase:', error);
  });
}