const input = document.getElementById("question");
const button = document.getElementById("oneButton");

const placeholders = [

"How can I make your life easier?",

"Find me a lawyer.",

"Book me the cheapest flight.",

"Plan my vacation.",

"Find my next apartment.",

"Compare insurance plans.",

"Find the best mortgage.",

"Help me move overseas.",

"Find me a doctor.",

"I need a dentist.",

"Find the best restaurant nearby.",

"Recommend a new laptop.",

"Help me buy a car.",

"Save me money.",

"Find me a new job.",

"Plan my honeymoon.",

"Register my company.",

"Build me a website.",

"Find the best deal.",

"Make my life easier."

];

let current = 0;
let placeholderTimer;

// Focus automatically
window.onload = () => {
    input.focus();
};

// Change placeholder
function changePlaceholder() {

    if (input.value !== "") return;

    current++;

    if (current >= placeholders.length) {

        current = 0;

    }

    input.placeholder = placeholders[current];

}

// First message stays for 10 seconds
setTimeout(() => {

    placeholderTimer = setInterval(changePlaceholder, 5000);

},10000);

// Stop changing while typing
input.addEventListener("input", () => {

    if(input.value !== ""){

        clearInterval(placeholderTimer);

    }else{

        placeholderTimer = setInterval(changePlaceholder,5000);

    }

});

// Press ENTER
input.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){

        e.preventDefault();

        button.click();

    }

});

// Temporary buttons

document.getElementById("micButton").onclick=()=>{

    alert("Voice Search\n\nComing soon.");

};

document.getElementById("imageButton").onclick=()=>{

    alert("Image Search\n\nComing soon.");

};

document.getElementById("aiButton").onclick=()=>{

    alert("AI Mode\n\nONE Pro feature coming soon.");

};

// ONE IT

button.addEventListener("click",()=>{

    const question=input.value.trim();

    if(question===""){

        input.focus();

        return;

    }

    alert(

`ONE is thinking...

Searching trusted sources...

Comparing the best options...

Building your execution plan...


You asked:

"${question}"


Version 3 will replace this popup with real results.`

    );

});
