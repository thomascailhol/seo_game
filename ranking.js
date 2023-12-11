const sp = supabase.createClient('https://fyggsmdxumjqcmqkdizz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Z2dzbWR4dW1qcWNtcWtkaXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzMzU3NTYsImV4cCI6MjAxNjkxMTc1Nn0.c_-UlBxlaFZZcj9FKr8u33r2TE7KZSt_-MzijCPlB94');

console.log(sp)


document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayRankings();
    // subscribeToRankingUpdates(); // Set up real-time subscription
});

async function fetchAndDisplayRankings() {
    try {
        // const { data, error } = await sp.from('Game').select('*').order('final_position', { ascending: true });
        const { data, error } = await sp.rpc('get_ranking');

        if (error) throw error;

        displayRankings(data);
    } catch (err) {
        console.error('Error fetching rankings: ', err);
    }
}

function displayRankings(rankings) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = ''; // Clear existing list items

    rankings.forEach((ranking, index) => {
        const position = index + 1; // Position in the ranking
        const listItem = document.createElement('li');
        listItem.className = 'list-item';
        listItem.textContent = `${position}. ${ranking.name}, Score : ${ranking.total_score} (${ranking.total_games} ${ranking.total_games === 1 ? 'partie' : 'parties'})`;
        // Customize the textContent as needed

        rankingList.appendChild(listItem);
    });
}

function subscribeToRankingUpdates() {
		console.log('subscribing')
    const channels = sp.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'Game' },
    (payload) => {
      console.log('Change received!', payload)
      insertNewResultIntoRanking(payload.new);
    }
  )
  .subscribe()
  console.log('subscribed to channels')
}

function insertNewResultIntoRanking(newResult) {
    const rankingList = document.getElementById('ranking-list');
    const newListItem = document.createElement('li');
    newListItem.className = 'list-item';
    // Initially, set text without position; it will be updated later
    newListItem.textContent = `Player: ${newResult.player_name}, Score: ${newResult.computed_score}`;

    // Find the correct position for the new result
    let inserted = false;
    for (let i = 0; i < rankingList.children.length; i++) {
        let currentItemScore = parseInt(rankingList.children[i].textContent.split('Score: ')[1]);
        if (newResult.computed_score < currentItemScore) {
            rankingList.insertBefore(newListItem, rankingList.children[i]);
            inserted = true;
            break;
        }
    }

    // If the item has not been inserted, append it at the end
    if (!inserted) {
        rankingList.appendChild(newListItem);
    }

    // Update the position for each item in the list
    updateRankingPositions();
}

function updateRankingPositions() {
    const rankingList = document.getElementById('ranking-list');
    for (let i = 0; i < rankingList.children.length; i++) {
        let playerName = rankingList.children[i].textContent.split(', Score:')[0].split(': ')[1].trim();
        let score = rankingList.children[i].textContent.split('Score: ')[1];
        rankingList.children[i].textContent = `${i + 1}. Player: ${playerName}, Score: ${score}`;
    }
}