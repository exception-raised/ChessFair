import axios from 'axios';
import promptSync from 'prompt-sync';


const prompt = promptSync({ sigint: true });


console.log("Welcome to ChessFair.");

const playerStatusCache = {};

async function fetchArchives() {
  try {
    const response = await axios.get("https://api.chess.com/pub/player/PLAYER_NAME_HERE/games/archives");
    return response.data;
  } catch (error) {
    console.error('Error fetching archives:', error);
  }
}

async function getPlayerStatus(username) {
  if (playerStatusCache[username]) {
    return playerStatusCache[username]; 
  }

  try {
    const response = await axios.get(`https://api.chess.com/pub/player/${username}`);
    const status = response.data.status;
    
    playerStatusCache[username] = status;
    return status;
  } catch (error) {
    console.error(`Error fetching status for ${username}:`, error);
  }
}

async function processArchives() {
  const archives = await fetchArchives(); 

  let playerUsernames = new Set(); 
  
  for (const archive of archives.archives) {
    const response = await axios.get(archive);

    for (const game of response.data.games) {
      const whiteUsername = game.white.username;
      const blackUsername = game.black.username;

      if (whiteUsername !== "PLAYER_NAME_HERE") {
        playerUsernames.add(whiteUsername);
      }
      if (blackUsername !== "PLAYER_NAME_HERE") {
        playerUsernames.add(blackUsername);
      }
    }
  }

  for (const username of playerUsernames) {
    const status = await getPlayerStatus(username);
    if (status === "closed:fair_play_violations") {
      console.log(`${username}: ${status}`);
      
    }
  }
}

// processArchives();
