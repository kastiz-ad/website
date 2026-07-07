/*
=====================================
Kastiz ONE
Version 3
=====================================
*/

const input = document.getElementById("searchInput");
const suggestion = document.getElementById("suggestionText");

const logoO = document.querySelector(".logo-o");
const logoN = document.querySelector(".logo-n");
const logoE = document.querySelector(".logo-e");

const locationText = document.getElementById("locationText");

/* =====================================
   Auto Focus
===================================== */

window.addEventListener("load", () => {

    input.focus();

    startLogoAnimation();

    startSuggestionAnimation();

    detectLocation();

});

/* =====================================
   Animated ONE Logo
===================================== */

function startLogoAnimation() {

    function play() {

        logoO.classList.remove("visible", "pulse");
        logoN.classList.remove("visible", "pulse");
        logoE.classList.remove("visible", "pulse");

        setTimeout(() => {

            logoO.classList.add("visible");

        }, 200);

        setTimeout(() => {

            logoN.classList.add("visible");

        }, 850);

        setTimeout(() => {

            logoE.classList.add("visible");

        }, 1500);

        setTimeout(() => {

            logoO.classList.add("pulse");
            logoN.classList.add("pulse");
            logoE.classList.add("pulse");

        }, 2200);

    }

    play();

    setInterval(play, 6000);

}

/* =====================================
   Animated Suggestions
===================================== */

const suggestions = [

    "Ask anything",

    "Summarize documents",

    "Translate instantly",

    "Search the web",

    "Generate images",

    "Write better emails",

    "Plan your next trip",

    "Analyze data",

    "Brainstorm ideas",

    "Learn something new",

    "Code with AI",

    "Compare products",

    "Create presentations",

    "Explain difficult topics",

    "Practice English",

    "Discover nearby places"

];

let current = 0;

function showSuggestion(text) {

    suggestion.style.opacity = 0;

    setTimeout(() => {

        if (input.value.length === 0) {

            suggestion.textContent = text;

            suggestion.style.opacity = 1;

        }

    }, 250);

}

function startSuggestionAnimation() {

    showSuggestion(suggestions[current]);

    setInterval(() => {

        if (input.value.length > 0) return;

        current++;

        if (current >= suggestions.length) {

            current = 0;

        }

        showSuggestion(suggestions[current]);

    }, 2600);

}

input.addEventListener("input", () => {

    if (input.value.length > 0) {

        suggestion.style.opacity = 0;

    } else {

        suggestion.style.opacity = 1;

    }

});

/* =====================================
   Submit
===================================== */

document.querySelector(".search-container").addEventListener("submit", function (e) {

    e.preventDefault();

    const query = input.value.trim();

    if (!query) return;

    console.log("Search:", query);

    // Future:
    // window.location.href = "/search?q=" + encodeURIComponent(query);

});

/* =====================================
   AI Pill
===================================== */

document.querySelector(".ai-pill").addEventListener("click", () => {

    input.focus();

});

/* =====================================
   Location
===================================== */

function detectLocation() {

    if (!navigator.geolocation) {

        locationText.textContent = "";

        return;

    }

    navigator.geolocation.getCurrentPosition(

        async position => {

            try {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                );

                const data = await response.json();

                const address = data.address || {};

                const city =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.county ||
                    "";

                const state =
                    address.state ||
                    "";

                const country =
                    address.country ||
                    "";

                const parts = [city, state, country].filter(Boolean);

                if (parts.length > 0) {

                    locationText.textContent =
                        "Your location: " + parts.join(", ");

                } else {

                    locationText.textContent = "";

                }

            } catch (e) {

                locationText.textContent = "";

            }

        },

        () => {

            locationText.textContent = "";

        }

    );

}

/* =====================================
   Keyboard Shortcut
===================================== */

document.addEventListener("keydown", (e) => {

    if (e.key === "/" && document.activeElement !== input) {

        e.preventDefault();

        input.focus();

    }

});

/* =====================================
   Escape Clears Search
===================================== */

input.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        input.value = "";

        suggestion.style.opacity = 1;

    }

});
