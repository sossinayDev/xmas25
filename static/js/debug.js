function init_debug() {
    console.log("Debug mode initialized.");

    document.querySelectorAll("div").forEach(div => {
        div.style.backgroundColor = rand_color();
    });
}

