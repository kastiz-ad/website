const input = document.getElementById("question");
const button = document.getElementById("oneButton");

const placeholders = [
    "Need a lawyer?",
    "Book the cheapest flight.",
    "Find me a new apartment.",
    "Buy my first home.",
    "Find the best mortgage.",
    "Compare insurance plans.",
    "Need a new job?",
    "Write my resume.",
    "Help me move overseas.",
    "Find the best laptop.",
    "Recommend a new phone.",
    "Where should I eat tonight?",
    "Find the best restaurant nearby.",
    "Book a hotel.",
    "Plan my weekend.",
    "Find me a doctor.",
    "I need a dentist.",
    "Find a good school.",
    "Start a business.",
    "Register my company.",
    "Help me save money.",
    "Invest my savings.",
    "Compare credit cards.",
    "Find a tax accountant.",
    "Create a workout plan.",
    "Plan my wedding.",
    "Find a babysitter.",
    "Translate this document.",
    "Explain this contract.",
    "Help me buy a car.",
    "How to learn a new language?.",
    "What's the smartest option?",
    "Make my life easier."
    "What can I do today?"
];

let current = 0;

setInterval(() => {
    current++;

    if (current >= placeholders.length) {
        current = 0;
    }

    input.placeholder = placeholders[current];
}, 4000);

// Press ENTER to ONE it
input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        button.click();
    }
});

button.addEventListener("click", () => {

    const question = input.value.trim();

    if (question === "") {
        alert("Tell ONE how it can make your life easier.");
        return;
    }

    alert(
`ONE is thinking...

Searching trusted sources...

Comparing the best options...

Building your execution plan...

────────────────────────

You asked:

"${question}"

Prototype V1

Next step:
We'll replace this popup with the real ONE search engine and results page.`
    );

});
