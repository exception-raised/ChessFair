
import axios from 'axios';
import { log_with_loading_bar } from './functions.js';
import promptSync from 'prompt-sync';


const prompt = promptSync({ sigint: true });


export class app {

    #m_url = "https://api.chess.com/pub/player/";
    #m_archives = {};
    #m_username = "";
    #m_player_set = new Set();
    #m_batch_size = 30;
    #m_batch_delay = 900;


    async #fetch_archives() {
        const archive_timer = log_with_loading_bar(" Fetching archives...");
        try {
            const response = await axios.get(`${this.#m_url}${this.#m_username}/games/archives`);
            
            if (response.status == 200) {
                this.#m_archives = response.data;
                
                archive_timer.stop();
                console.log("✓ Archives fetched successfully.");
                return;
            }
        } catch (error) {
            console.error("Failed to get archives: ", error.response.data.message);
        }
    }
    

    async #get_player_status(username){

        try {
            const response = await axios.get(`${this.#m_url}${username}`);            
            return response.data.status;
        } catch (error) {
            console.error(`Error fetching status for ${username}:`, error);
        }
    }

    async #fill_player_set() {
        const archive_timer = log_with_loading_bar(" Filling player set...");
        try {
            await this.#fetch_archives();
    
            const archiveUrls = this.#m_archives.archives;
            const totalArchives = archiveUrls.length;
            let processedArchives = 0;
    
            const archiveResponses = await Promise.all(
                archiveUrls.map(async (archiveUrl) => {
                    const response = await axios.get(archiveUrl);
                    
                    processedArchives++;
                    process.stdout.write(`\rProcessed ${processedArchives}/${totalArchives} archives...`);
    
                    return response;
                })
            );
    
            archiveResponses.forEach(response => {
                response.data.games.forEach(game => {
                    const { white, black } = game;
                    if (white.username !== this.#m_username) {
                        this.#m_player_set.add(white.username);
                    }
                    if (black.username !== this.#m_username) {
                        this.#m_player_set.add(black.username);
                    }
                });
            });
    
            archive_timer.stop();
            console.log(`\n✓ Player set filled successfully with ${this.#m_player_set.size} players.`);
        } catch (error) {
            archive_timer.stop();
            console.error("Failed to fill player set: ", error.response?.data?.message || error.message);
        }
    }
    
    async #process_batches() {
        const usernames = Array.from(this.#m_player_set);
        let banned_users = [];

        for (let i = 0; i < usernames.length; i += this.#m_batch_size) {
            const batch = usernames.slice(i, i + this.#m_batch_size);

            const status_promises = batch.map(async (username) => {
                const status = await this.#get_player_status(username);
                if (status === "closed:fair_play_violations") {
                    banned_users.push(username); 
                    
                    process.stdout.write(`${banned_users.length} found...`);
                }
            });

            await Promise.all(status_promises);

            if (i + this.#m_batch_size < usernames.length) {
                await this.sleep(this.#m_batch_delay);
            }
        }
        return banned_users;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async #process_archives() {
        console.time("Archive Processing Time");
    
        const process_timer = log_with_loading_bar(" Processing archives...");
    
        await this.#fill_player_set();

        const banned_users = await this.#process_batches();
    
        try {

            
            process_timer.stop();
            console.log("\n✓ Archive processing completed.");
            
            if (banned_users.length > 0) {
                console.log(`\nBanned users (${banned_users.length}):`);
                banned_users.forEach(username => {
                    const profileLink = `https://www.chess.com/member/${username}`;
                    console.log(`- ${username}: ${profileLink}`);
                });
            } else {
                console.log("No banned users found.");
            }
        } catch (error) {
            process_timer.stop();
            console.error("Error during archive processing:", error.message);
        }
    
        console.timeEnd("Archive Processing Time");
    }
    
    

    async start() {
        console.log("Welcome to ChessFair!");
        console.log("Please note, the time required to process all players depends on the number of games you've played. Due to Chess.com rate limits, the application processes users in batches, which may introduce some delays.");
        this.#m_username = prompt("To begin, please enter the Chess.com username you'd like to analyze: ");
        
        await this.#process_archives();
    }
}

