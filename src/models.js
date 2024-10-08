
import axios from 'axios';
import { log_with_loading_bar, sleep } from './functions.js';
import promptSync from 'prompt-sync';
import cli from 'cli-progress'
import colors from 'ansi-colors'

const prompt = promptSync({ sigint: true });


export class app {

    #m_url = "https://api.chess.com/pub/player/";
    #m_archives = {};
    #m_username = "";
    #m_player_set = new Set();
    #m_batch_size = 30;
    #m_batch_delay = 1000;


    async #fetch_archives() {
        const archive_timer = log_with_loading_bar("Fetching archives...");
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
            console.error(`Error fetching status for ${username}:`);
        }
    }

    async #fill_player_set() {
        try {
            await this.#fetch_archives();
    
            const archives = this.#m_archives.archives;
            const total_archives = archives.length;
            let processed_archives = 0;
    
            const player_set_bar = new cli.SingleBar({
                format: 'Processing ' + colors.greenBright('[{bar}]') + '{percentage}% | ' + colors.cyanBright('{value}/{total} archives'),
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true,
                noTTYOutput: true,
            }, cli.Presets.shades_classic);

            const archive_responses = await Promise.all(
                archives.map(async (archiveUrl) => {
                    const response = await axios.get(archiveUrl);
                    

                    player_set_bar.start(total_archives, processed_archives);

                    processed_archives++;
    
                    player_set_bar.update(processed_archives);

                    return response;
                })
            );

            player_set_bar.stop();
            archive_responses.forEach(response => {
                response.data.games.forEach(game => {
                    const { white, black } = game;
                    if (white.username !== this.#m_username) {
                        this.#m_player_set.add(white.username);
                        return;
                    }
                    if (black.username !== this.#m_username) {
                        this.#m_player_set.add(black.username);
                        return;
                    }
                });
            });
    
            console.log(`\n✓ Player set filled successfully with ${this.#m_player_set.size} players.`);
        } catch (error) {
            console.error("Failed to fill player set: ", error.response?.data?.message || error.message);
        }
    }
    
  
    async #process_batches() {
        const usernames = Array.from(this.#m_player_set);
        let banned_users = [];
        const total_users = usernames.length;

        const batch_progress_bar = new cli.SingleBar({
            format: 'Processing ' + colors.greenBright('[{bar}]') + '{percentage}% | ' + colors.cyanBright('{value}/{total} Users') +  ' | ' + colors.redBright('Banned: {bannedCount}') +  ' | ' + colors.magentaBright('ETA: {eta_formatted}'),
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            noTTYOutput: true,
        }, cli.Presets.shades_classic);

        batch_progress_bar.start(total_users, 0, { bannedCount: 0 });

        for (let i = 0; i < total_users; i += this.#m_batch_size) {
            const batch = usernames.slice(i, i + this.#m_batch_size);

            const status_promises = batch.map(async (username) => {
                const status = await this.#get_player_status(username);
                if (status === "closed:fair_play_violations") {
                    banned_users.push(username); 
                }
            });

            await Promise.all(status_promises);

            batch_progress_bar.update(i + batch.length, { bannedCount: banned_users.length });

            if (i + this.#m_batch_size < total_users) {
                await sleep(this.#m_batch_delay);
            }
        }

        batch_progress_bar.update(total_users, { bannedCount: banned_users.length });
        batch_progress_bar.stop();

        return banned_users;
    }

    async #process_archives() {
        console.time("Archive Processing Time");
        
        await this.#fill_player_set();

        const banned_users = await this.#process_batches();
    
        try {

            
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

