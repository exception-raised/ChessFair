
export function log() {

}

export function log_with_loading_bar(input, interval = 250) {
    const P = ["\\", "|", "/", "-"];
    let x = 0;

    const loadingInterval = setInterval(() => {
        process.stdout.write(`\r${P[x++ % P.length]} ${input}`);
    }, interval);

    return {
        stop() {
            clearInterval(loadingInterval);
            process.stdout.write(`✓ ${input}\n`);
        }
    }
}


