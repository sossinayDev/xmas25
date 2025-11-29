async function is_online() {
    if (!navigator.onLine) return false;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/generate_204', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeout);
        return true;
    } catch (e) {
        return false;
    }
}

async function delay(sec){
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}


function rand_color() {
    return `rgb(${parseInt(Math.random() * 255)},${parseInt(Math.random() * 255)},${parseInt(Math.random() * 255)})`;
}


function get_parameters() {
    let result = {};
    let urlString = document.location.href;
    let paramString = urlString.split('?')[1];
    let queryString = new URLSearchParams(paramString);
    for (let pair of queryString.entries()) {
        result[pair[0]]=pair[1];
    }
    return result;
}


async function init_utils() {
    console.log("Loading data...");

    if (await is_online()) {
        document.querySelector("head").innerHTML += append_on_connection;
    }

    // init_debug();
}