import { env } from 'node:process';

const SLEEP_IN_MILLIS = 50;

function sleep(millis: number) {
    return new Promise((resolve) => setTimeout(resolve, millis));
}

// selbst-signiertes Zertifikat ignorieren
// https://github.com/orgs/nodejs/discussions/44038
env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const options: RequestInit = {
    headers: {
        Accept: 'application/json',
    },
};

for (let index = 1; ; index++) {
    let id;
    if (index % 2 === 0) {
        id = 20;
    } else if (index % 3 === 0) {
        id = 30;
    } else if (index % 5 === 0) {
        id = 40;
    } else if (index % 7 === 0) {
        id = 50;
    } else {
        id = 1;
    }
    console.log(`id=${id}`);

    const url = `https://localhost:3000/rest/${id}`;

    // https://nodejs.org/dist/latest-v23.x/docs/api/globals.html#fetch
    const response = await fetch(url, options);
    if (response.status !== 200) {
        console.error(`Fehler bei id=${id}`);
    }

    sleep(SLEEP_IN_MILLIS);
}
