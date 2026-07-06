const input = document.getElementById("question");

const placeholders = [

"Need a lawyer?",

"Planning a vacation?",

"Buying your first home?",

"Need help moving overseas?",

"Looking for a new job?",

"Need the best laptop?",

"How can I save money?",

"Find the best restaurant nearby.",

"What can I do today?"

];

let current = 0;

setInterval(() => {

current++;

if(current >= placeholders.length){

current = 0;

}

input.placeholder = placeholders[current];

},4000);

document
.getElementById("oneButton")
.addEventListener("click",()=>{

const question = input.value.trim();

if(question===""){

alert("Tell ONE how it can make your life easier.");

return;

}

alert(
"Prototype V1\n\nYou asked:\n\n" +
question +
"\n\nNext version will begin planning and researching automatically."
);

});
