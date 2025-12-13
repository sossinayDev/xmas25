let params = {};
let userid = "";

let today = 0;

const server = "https://pixelnet.xn--ocaa-iqa.ch/xmas25-api";

let leaderboard = {};

const leaderboard_entry = `<span>{place} <strong>{username}</strong> <i>{score}</i></span><br><br>`

const append_on_connection = `
<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Almendra:ital,wght@0,400;0,700;1,400;1,700&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
</head>
`;

function hide_id(id) {
    document.getElementById(id).style.display = "none";
}
function show_id(id) {
    document.getElementById(id).style.display = "block";
}

async function serv(request) {
    request.auth = auth;
    const response = await fetch(server, {
        "method": "POST",
        "body": JSON.stringify(request)
    });
    console.log(response);
    return (await response.json());
}

function capitalize(userid) {
    return userid.substr(0, 1).toUpperCase() + userid.substr(1).toLowerCase()
}

let answer = null;
function set_answer(a) {
    answer = a;
    document.querySelectorAll(".option").forEach(option => {
        option.className = option.className.replaceAll(" selected", "");
    });
    document.querySelector(`#option${answer}`).className += " selected";
}
function update_answer() {
    let result = [];
    document.querySelectorAll(".optionselector").forEach(selector => {
        result.push(selector.value);
    });
    answer = result;
}
async function send_answer(silent = false, no_feedback = false) {
    if (answer === null) {
        alert("Bitte wähle zuerst eine Antwort aus!");
        return;
    }
    let doit = false;
    if (!silent) {
        if (confirm("Bist du sicher? Deine Antwort kann nicht mehr geändert werden!")) {
            doit = true;
        }
    }
    else {
        doit = true;
    }
    if (doit) {
        let result = await serv({
            "type": "submit_challenge",
            "answer": answer
        });
        console.log(result);

        if (no_feedback) {
            return;
        }
        let rtext = `
<h1>Fehler!</h1>
<p>Entschuldige, es ist ein Fehler aufgetreten. Bitte versuche es später erneut.</p>`;
        if (result.type == "validation_completed") {
            if (result.success && result.points == result.max_points) {
                rtext = `
<h1>Erledigt!</h1>
<p>Deine Antwort wurde erfolgreich übermittelt.</p>
<p>Du hast richtig geantwortet und erhältst <strong>${result.points}</strong> Punkte.<br>Komm morgen wieder, um das nächste Törchen zu öffnen!</p>
            `;
            }
            else if (result.points > 0) {
                rtext = `
<h1>Erledigt!</h1>
<p>Deine Antwort wurde erfolgreich übermittelt.</p>
<p>Du hast nur teilweise richtig geantwortet und erhältst <strong>${result.points}</strong> Punkte.<br>Komm morgen wieder, um das nächste Törchen zu öffnen!</p>
            `;
            }
            else {
                rtext = `
<h1>Erledigt!</h1>
<p>Deine Antwort wurde erfolgreich übermittelt.</p>
<p>Du hast falsch geantwortet und erhältst leider keine Punkte...<br>Komm morgen wieder, um das nächste Törchen zu öffnen!</p>
            `;
            }
        }
        else if (result.type == "already_completed") {
            rtext = `
<h1>Bereits erledigt!</h1>
<p>Du hast diese Aufgabe schon erledigt.</p>`;
        }
        document.querySelector("#result").innerHTML = rtext;

        update_leaderboard();
        document.querySelector("#minigame").style.transform = "rotateY(90deg)";
        await delay(0.3);
        document.querySelector("#minigame").style.display = "none";
        document.querySelector("#result").style.transform = "rotateY(-90deg)";
        document.querySelector("#result").style.display = "flex";
        await delay(0.1);

        document.querySelector("#result").style.transform = "rotateY(0deg)";
    }
}

let position = 0;
async function update_leaderboard() {
    leaderboard = await serv({
        "type": "get_leaderboard"
    });

    // Convert leaderboard object to [playerid, data] pairs and sort by score desc
    const sorted = Object.entries(leaderboard)
        .sort((a, b) => (b[1].score || 0) - (a[1].score || 0));

    let parent = document.querySelector("#leaderboard")
    parent.innerHTML = "";
    let i = 1;
    sorted.forEach(([playerid, data]) => {
        if (playerid == userid) {
            position = i;
        }
        console.log(playerid, data.score, data.finished_todays);
        parent.innerHTML += leaderboard_entry.replaceAll("{username}", capitalize(playerid)).replaceAll("{score}", data.score).replaceAll("{place}", i)
        i += 1;
    });
}

async function openDoor() {
    document.querySelector("#door").className += " opened";
    await delay(0.3);
    document.querySelector("#door").style.display = "none";
    document.querySelector("#minigame").style.display = "flex";
    document.querySelector("#minigame").className = document.querySelector("#minigame").className.replaceAll("hidden", "");
    await delay(0.1);
    document.querySelector("#minigame").style.transform = "rotateY(0deg)";
}

async function show_finish() {
    let me = await serv({ type: "get_me" });
    console.log(me);
    let openedDoors = me.finished_challenges.length;
    let points = me.score;

    let otherPlayerList = await serv({ type: "get_leaderboard" });
    let otherPlayers = Object.keys(otherPlayerList).length - 1;
    let otherPlayerScore = -points;

    Object.keys(otherPlayerList).forEach(player => {
        otherPlayerScore += otherPlayerList[player].score;
    });


    let a = document.querySelector("#finish_content").innerHTML
    a = a.replaceAll("{openedDoors}", (openedDoors))
    a = a.replaceAll("{points}", (points))
    a = a.replaceAll("{otherPlayers}", (otherPlayers))
    a = a.replaceAll("{totalPlayerPoints}", (otherPlayerScore))
    a = a.replaceAll("{position}", (position));
    console.log(a)
    document.querySelector("#finish_content").innerHTML = a
}

async function show_upcoming() {
    console.log("Showing info: upcoming")
    let me = await serv({ type: "get_me" });
    console.log(me);
    let a = `<h1>Hallo ${me.userid}!</h1><p>Es ist noch nicht Dezember, bitte hab noch etwas Geduld...</p>`
    document.querySelector("#finish_content").innerHTML = a
}

async function initxmas() {
    init_utils();

    // RANDOM WALLPAPER
    document.querySelector("body").style.backgroundImage = `url("static/img/wp/${parseInt(Math.random() * 9 + 1)}.jpg")`

    // AUTHENTICATION
    params = get_parameters();
    userid = params.userid;
    usertoken = params.usertoken;
    today = new Date().getDate();
    if (["dev_easy", "dev_hard"].includes(userid)) {
        today = "debug";
    }


    if (!userid || !usertoken) {
        console.log("No authentication provided in url, using local storage");
        let d = JSON.parse(localStorage.getItem("weihnachtsgame_last"));
        if (Object.keys(d).includes("userid") && Object.keys(d).includes("usertoken")) {
            userid = d.userid;
            usertoken = d.usertoken;
        }
        else {
            console.error("No authentication data found!");
        }
    }
    else {
        localStorage.setItem("weihnachtsgame_last", JSON.stringify({
            userid: userid,
            usertoken: usertoken
        }));
    }

    auth = {
        "userid": userid,
        "usertoken": usertoken,
        "today": today
    };

    if (new Date().getMonth() == 11) {
        // LEADERBOARD AND AUTH CHECK
        leaderboard = await serv({
            "type": "get_leaderboard"
        });

        if (leaderboard.error == 403) {
            console.error("Invaid authentication");
        }
        else if (!leaderboard.error) {
            console.log("Success!");
            update_leaderboard();
            setInterval(update_leaderboard, 10000);
        }


        let title = `Weihnachtsgame`;
        let title_short = `- Weihnachtsgame`;
        document.querySelector("#title").textContent = title;
        document.querySelector("title").textContent = title_short;



        if (today < 11 || today == "debug") {
            document.querySelector("head").innerHTML += `<link rel="icon" href="static/img/icons/${today}.png">`;
        }
        else if (today < 21) {
            document.querySelector("head").innerHTML += `<link rel="icon" href="static/img/icons/${today}.png">`;
            document.querySelector("#title").textContent += ` - ${21 - today} Tage übrig!`;
        }
        else {
            await show_finish()
            document.querySelector("head").innerHTML += `<link rel="icon" href="static/img/icons/end.png">`;
            document.querySelector("title").textContent = "Weihnachtsgame";
            document.querySelector("#title").textContent = `Event vorbei!`;
            document.querySelector("#minigame_cover").style.display = "none";
            document.querySelector("#game_over").style.visibility = "visible";
            document.querySelector("#game_over").style.display = "flex";
        }

        document.getElementById("door_label").textContent = `${today}`;

        // MINIGAME LOADING
        let minigame = await serv({
            "type": "get_challenge"
        });
        console.log(minigame.content);
        // document.querySelector("#minigame").src = `data:text/html,${encodeURIComponent(minigame.content)}`;
        document.querySelector("#minigame").innerHTML = minigame.content;
        let me = await serv({
            "type": "get_me"
        });
        console.log(me);
        if (me.finished_challenges.includes(today)) {
            document.querySelector("#send_button").textContent = "Bereits erledigt";
            document.querySelector("#send_button").disabled = true;
            document.querySelector("#send_button").style.cursor = "not-allowed";
        }

        await delay(1);
        console.log("Trying to get minigame js...");
        let script = document.createElement('script');
        script.src = `static/js/tag${today}/main.js`;
        document.head.appendChild(script);
    }
    else {
        await show_upcoming()
        document.querySelector("head").innerHTML += `<link rel="icon" href="static/img/icons/end.png">`;
        document.querySelector("title").textContent = "Weihnachtsgame";
        document.querySelector("#title").textContent = `Event noch nicht gestartet!`;
        document.querySelector("#minigame_cover").style.display = "none";
        document.querySelector("#game_over").style.visibility = "visible";
        document.querySelector("#game_over").style.display = "flex";
    }
}

window.onload = initxmas;