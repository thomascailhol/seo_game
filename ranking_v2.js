const sp=supabase.createClient("https://fyggsmdxumjqcmqkdizz.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Z2dzbWR4dW1qcWNtcWtkaXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEzMzU3NTYsImV4cCI6MjAxNjkxMTc1Nn0.c_-UlBxlaFZZcj9FKr8u33r2TE7KZSt_-MzijCPlB94");async function fetchAndDisplayRankings(){try{const{data:e,error:n}=await sp.rpc("get_ranking_v2");if(n)throw n;displayRankings(e)}catch(e){console.error("Error fetching rankings: ",e)}}function displayRankings(e){const n=document.getElementById("ranking-list");n.innerHTML="",e.forEach(((e,t)=>{const i=t+1,s=document.createElement("li");s.className="list-item",s.textContent=`${i}. ${e.name}, Score : ${e.total_score} (${e.total_games} ${1===e.total_games?"partie":"parties"})`,n.appendChild(s)}))}function subscribeToRankingUpdates(){console.log("subscribing");sp.channel("custom-all-channel").on("postgres_changes",{event:"*",schema:"public",table:"Game"},(e=>{console.log("Change received!",e),insertNewResultIntoRanking(e.new)})).subscribe();console.log("subscribed to channels")}function insertNewResultIntoRanking(e){const n=document.getElementById("ranking-list"),t=document.createElement("li");t.className="list-item",t.textContent=`Player: ${e.player_name}, Score: ${e.computed_score}`;let i=!1;for(let s=0;s<n.children.length;s++){let c=parseInt(n.children[s].textContent.split("Score: ")[1]);if(e.computed_score<c){n.insertBefore(t,n.children[s]),i=!0;break}}i||n.appendChild(t),updateRankingPositions()}function updateRankingPositions(){const e=document.getElementById("ranking-list");for(let n=0;n<e.children.length;n++){let t=e.children[n].textContent.split(", Score:")[0].split(": ")[1].trim(),i=e.children[n].textContent.split("Score: ")[1];e.children[n].textContent=`${n+1}. Player: ${t}, Score: ${i}`}}console.log(sp),document.addEventListener("DOMContentLoaded",(function(){fetchAndDisplayRankings(),setInterval(fetchAndDisplayRankings,5e3)}));