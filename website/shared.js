function refreshScheme() {
    let root = document.querySelector(":root"),
        icons = document.querySelectorAll(".scheme-icon");
    if (!localStorage.getItem("scheme")) localStorage.setItem("scheme", "dark");

    switch (localStorage.getItem("scheme")) {
        case "light":
            root.style.setProperty("--text-color", "black");
            root.style.setProperty("--text-color-alt", "darkgray");
            root.style.setProperty("--header-color", "seagreen");
            root.style.setProperty("--fun-highligher-color", "lightgreen");
            root.style.setProperty("--hightlight-color", "seagreen");
            root.style.setProperty("--hightlight-color-alt", "seagreen");
            root.style.setProperty("--background-color", "white");
            root.style.setProperty("--background-color-alt", "lightgray");
            icons.forEach(icon => {
                icon.classList.add("bi-brightness-high");
                icon.classList.remove("bi-moon");
            })
            break;
        case "dark":
        default:
            root.style.setProperty("--text-color", "white");
            root.style.setProperty("--text-color-alt", "rgb(170, 170, 170)");
            root.style.setProperty("--header-color", "lightgreen");
            root.style.setProperty("--fun-highligher-color", "seagreen");
            root.style.setProperty("--hightlight-color", "seagreen");
            root.style.setProperty("--hightlight-color-alt", "lightgreen");
            root.style.setProperty("--background-color", "#36393f");
            root.style.setProperty("--background-color-alt", "#2f3136");
            icons.forEach(icon => {
                icon.classList.add("bi-moon");
                icon.classList.remove("bi-brightness-high");
            })
            break;
    }
}

function swapScheme() {
    if (localStorage.getItem("scheme") == "light") localStorage.setItem("scheme", "dark");
    else localStorage.setItem("scheme", "light");
    refreshScheme();
}

function enterToClick(event) {
    let keycode = (event.keyCode) ? event.keyCode : event.which;
    if (keycode == "13") document.activeElement.click();
}

function foldMenu(id) {
    let element = document.getElementById(id);
    (element.getAttribute("folded") == "true") ? element.setAttribute("folded", false): element.setAttribute("folded", true);
}

function copy(inputId, tooltipId = null) {
    let input = document.getElementById(inputId),
        tooltips = document.querySelectorAll(".tooltiptext");

    input.select();
    input.setSelectionRange(0, 99999); // For mobile 

    navigator.clipboard.writeText(input.value);
    tooltips.forEach(element => {
        element.innerHTML = "Copied";
    });
}

function resetCopyTooltip() {
    let tooltips = document.querySelectorAll(".tooltiptext");
    tooltips.forEach(element => {
        element.innerHTML = "Copy to clipboard";
    });
}

function timeDifference(date) {
    let msPerMinute = 60 * 1000,
        msPerHour = msPerMinute * 60,
        msPerDay = msPerHour * 24,
        msPerMonth = msPerDay * 30,
        msPerYear = msPerDay * 365,

        elapsed = new Date() - date;

    if (elapsed < msPerMinute) {
        return Math.round(elapsed / 1000) + ' seconds ago';
    } else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + ' minutes ago';
    } else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + ' hours ago';
    } else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + ' days ago';
    } else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + ' months ago';
    } else {
        return Math.round(elapsed / msPerYear) + ' years ago';
    }
}

refreshScheme();