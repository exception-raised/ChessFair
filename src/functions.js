
export function log() {

}

export function log_with_loading_bar(input, interval = 250) {
    const P = ["\\", "|", "/", "-"];
    let x = 0;

    const loading_interval = setInterval(() => {
        process.stdout.write(`\r${P[x++ % P.length]} ${input}`);
    }, interval);

    return {
        stop() {
            clearInterval(loading_interval);
            process.stdout.write(`✓ ${input}\n`);
        }
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


