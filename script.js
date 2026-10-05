// Bookworm chatbot logic

const WELCOME = "Hi! I’m Bookworm and I am here to help start your reading experience. What are you looking for?";
const STARTERS = [
  "What genres are you interested in?",
  "Do you want to read a series or single book?",
  "Do you have a specific author in mind?"
];
const RULES = "You are Bookworm 📚, a friendly, welcoming, and warm chatbot. Your one job is to help people find a book to read based on their interests. Keep replies short (under 120 words), suggest 1-3 real books with a one-line reason each, and ask a gentle follow-up question. Never pitch or recommend a book based on its price. Stay on the topic of finding books.";

const chat = document.getElementById("chat"),
      chips = document.getElementById("chips"),
      f = document.getElementById("f"),
      input = document.getElementById("in"),
      go = document.getElementById("go");
const history = [];
let sample = null, busy = false;

// Add a message bubble to the chat
function add(text, who) {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}

// Show the welcome message and the starter question buttons
add(WELCOME, "bot");
STARTERS.forEach(q => {
  const b = document.createElement("button");
  b.className = "chip";
  b.type = "button";
  b.textContent = q;
  b.onclick = () => send(q);
  chips.appendChild(b);
});

// Connect to Claude (works on the claude.ai link only)
(async () => {
  try { sample = await claude.use("sample"); } catch (e) { sample = null; }
})();

// Send a message and show Bookworm's reply
async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  chips.style.display = "none";
  add(text, "me");
  input.value = "";
  history.push({ role: "user", content: text });
  busy = true;
  go.disabled = true;
  const bubble = add("Thinking… 📖", "bot");
  try {
    if (!sample) sample = await claude.use("sample");
    if (!sample) throw { code: "unavailable" };
    const turns = history.map((m, i) =>
      i === 0 ? { role: m.role, content: RULES + "\n\nUser says: " + m.content } : m
    );
    const r = await sample(turns, {
      cache: false,
      onText: ({ text }) => {
        bubble.textContent = text;
        chat.scrollTop = chat.scrollHeight;
      }
    });
    bubble.textContent = r.text;
    history.push({ role: "assistant", content: r.text });
  } catch (e) {
    history.pop();
    bubble.textContent = (e && e.code === "not_granted")
      ? "I need your permission to chat. Please allow it and try again! 📚"
      : "Oops, I couldn’t reach my bookshelf. Please try again in a moment.";
  }
  busy = false;
  go.disabled = false;
  input.focus();
}

// Restart button: clear the chat and bring back the starter questions
document.getElementById("restart").onclick = () => {
  history.length = 0;
  chat.innerHTML = "";
  add(WELCOME, "bot");
  chips.style.display = "flex";
  input.value = "";
  busy = false;
  go.disabled = false;
};

// Send when the form is submitted
f.addEventListener("submit", e => {
  e.preventDefault();
  send(input.value);
});
