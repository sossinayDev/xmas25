let current_i = 0;

let timer_start = 0

let score = 0;
let active = false;


let timer_interval = null;

function start(){
    show_id("game_info");
    show_id("game_buttons");
    hide_id("start_button");
    active = true;
    answer = [];
    document.getElementById("image").src=`static/img/tag9/snowball-${snowballs[current_i].val}.png`
    timer_start = new Date().getTime();
    timer_interval = setInterval(update_timer, 10);
}

function update_timer(){
    let time = new Date().getTime()-timer_start;
    time /= 1000;
    document.getElementById("minigame_title").textContent = `${score} - Schneballwerfen - ${30-Math.round(time,2)}s`;
    if (time  > 30){
        clearInterval(timer_interval);
        send_answer(true);
        active = false;
        document.getElementById("image").src="static/img/tag9/snowball.png"
    }
}

async function button(location){
    console.log(location)
    if (!active){
        return;
    }
    let time = new Date().getTime()-timer_start;
    answer.push({"time":time,"val":location})
    if (location == snowballs[current_i].val){
        score += 1;
        current_i += 1;
        document.getElementById("image").src="static/img/tag9/snowball.png"
        active = false;
        await delay(snowballs[current_i].delay/4);
        active = true;
    }
    else {
        current_i += 1;
        score -= 2;
        if (score < 0){
            score = 0;
        }
        document.getElementById("image").src="static/img/tag9/snowball.png"
        active = false;
        await delay(snowballs[current_i].delay/4);
        active = true;
    }
    document.getElementById("image").src=`static/img/tag9/snowball-${snowballs[current_i].val}.png`
}

const snowballs = JSON.parse(document.getElementById("snowball_data").textContent.replaceAll("'",'"'));