// Bookworm chatbot logic: Bookworm asks the starter questions, then recommends books

const WELCOME = "Hi! I’m Bookworm and I am here to help start your reading experience. What are you looking for?";
const QUESTIONS = ["What genres are you interested in?","Do you want to read a series or single book?","Do you have a specific author in mind?"];
const RULES = "You are Bookworm 📚, a friendly, welcoming, and warm chatbot. Your one job is to help people find a book to read based on their interests. Keep replies short (under 120 words), suggest 1-3 real books with a one-line reason each, and ask a gentle follow-up question. Never pitch or recommend a book based on its price. Stay on the topic of finding books.";

const chat = document.getElementById("chat"), f = document.getElementById("f"),
      input = document.getElementById("in"), go = document.getElementById("go");
let history = [], answers = [], step = 0, sample = null, busy = false;

function add(text, who){
  const d = document.createElement("div");
  d.className = "msg " + who; d.textContent = text;
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
}
function start(){
  history = []; answers = []; step = 0; chat.innerHTML = "";
  add(WELCOME, "bot"); add(QUESTIONS[0], "bot");
}
start();
(async () => { try { sample = await claude.use("sample"); } catch(e) { sample = null; } })();

async function send(text){
  text = text.trim();
  if(!text || busy) return;
  add(text, "me"); input.value = "";

  // Bookworm asks the starter questions one at a time
  if(step < QUESTIONS.length){
    answers.push(QUESTIONS[step] + " " + text);
    step++;
    if(step < QUESTIONS.length){ setTimeout(() => add(QUESTIONS[step], "bot"), 400); return; }
    history.push({role:"user", content:"Here are my answers to your questions:\n" + answers.join("\n") + "\nPlease suggest some books for me."});
  } else {
    history.push({role:"user", content:text});
  }

  busy = true; go.disabled = true;
  const bubble = add("Thinking… 📖", "bot");
  try{
    if(!sample) sample = await claude.use("sample");
    if(!sample) throw {code:"unavailable"};
    const turns = history.map((m,i) => i===0 ? {role:m.role, content: RULES + "\n\n" + m.content} : m);
    const r = await sample(turns, {cache:false, onText:({text}) => { bubble.textContent = text; chat.scrollTop = chat.scrollHeight; }});
    bubble.textContent = r.text;
    history.push({role:"assistant", content:r.text});
  }catch(e){
    history.pop();
    bubble.textContent = (e && e.code === "not_granted")
      ? "I need your permission to chat. Please allow it and try again! 📚"
      : "Oops, I couldn’t reach my bookshelf. Please try again in a moment.";
    if(step >= QUESTIONS.length && history.length === 0){ step = QUESTIONS.length - 1; answers.pop(); setTimeout(() => add(QUESTIONS[step], "bot"), 400); }
  }
  busy = false; go.disabled = false; input.focus();
}
document.getElementById("restart").onclick = () => { busy = false; go.disabled = false; input.value = ""; start(); };
f.addEventListener("submit", e => { e.preventDefault(); send(input.value); });
