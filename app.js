// Endless follow-the-word typing: stream + type along, mark-and-continue errors.

const COMMON = (
  'time people way day man thing woman life child world school state family student group country ' +
  'problem hand part place case week company system program question work night point home water room ' +
  'mother area money story fact month right study book eye job word business issue side kind head ' +
  'house service friend father power hour game line end member law car community name team minute ' +
  'idea kid body music mile river word light heart sound water story again never under while last ' +
  'long great little own other old right big high such same tell does set want air well also play ' +
  'small end put home read hand port large spell add even land here must big high such follow act ' +
  'why ask men change went light kind off need house picture try again animal point mother world ' +
  'near build self earth father head stand own page should country found answer school grow study ' +
  'still learn plant cover food sun four between state keep eye never last let thought city tree ' +
  'cross farm hard start might story saw far sea draw left late run while press close night real ' +
  'life few north open seem together next white children begin got walk example ease paper group ' +
  'always music those both mark often letter until mile river car feet care second book carry took ' +
  'science eat room friend began idea fish mountain stop once base hear horse cut sure watch color ' +
  'face wood main enough plain girl usual young ready above ever red list though feel talk bird ' +
  'soon body dog family direct pose leave song measure door product black short numeral class wind ' +
  'question happen complete ship area half rock order fire south problem piece told knew pass since ' +
  'top whole king space heard best hour better during hundred five remember step early hold west ' +
  'ground interest reach fast verb sing listen six table travel less morning ten simple several vowel ' +
  'toward war lay against pattern slow center love person money serve appear road map rain rule ' +
  'govern pull cold notice voice unit power town fine certain fly fall lead cry dark machine note ' +
  'wait plan figure star box noun field rest correct able pound done beauty drive stood contain ' +
  'front teach week final gave green oh quick develop ocean warm free minute strong special mind ' +
  'behind clear tail produce fact street inch multiply nothing course stay wheel full force blue ' +
  'object decide surface deep moon island foot yet busy test record boat common gold possible plane ' +
  'stead dry wonder laugh thousand ago ran check game shape equate hot miss brought heat snow ' +
  'tire bring yes distant fill east paint language among grand ball yet wave drop heart present ' +
  'heavy dance engine position arm wide sail material size vary settle speak weight general ice ' +
  'matter circle pair include divide syllable felt grand ball yet wave drop heart present heavy ' +
  'dance engine calm dream quiet endless river light morning simply magic brave swift gentle kind ' +
  'honest merry quick steady eager happy lucky jolly vivid calm bright fresh cool warm gladasy'
).split(/\s+/).filter(Boolean);

const wordsEl = document.getElementById('words');
const boardEl = document.getElementById('board');
const hintEl = document.getElementById('focusHint');
const hidden = document.getElementById('hidden');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('acc');
const restartBtn = document.getElementById('restart');
const toggle = document.getElementById('themeToggle');
const root = document.documentElement;

const REFILL_BELOW = 40; // keep at least this many untyped words ahead
const BATCH = 25;        // words to append per refill
const PRUNE_AFTER = 60;  // prune typed words once past this index
const PRUNE_COUNT = 30;

let words = [];      // [{ text, el, letters: [span], status: [null|'correct'|'wrong'|'missing'], extras: span[] }]
let wi = 0;          // current word index
let li = 0;          // current letter position (incl. extras)
let sentenceLeft = 0;
let totalKeys = 0;
let correctKeys = 0;
let correctChars = 0; // currently-correct letters on screen (drives wpm)
let startTime = null;
let caretEl = null;

function randWord() {
  return COMMON[(Math.random() * COMMON.length) | 0];
}

// Group words into sentence-like runs: Capitalized start, period at end.
function nextWordText() {
  let w = randWord();
  if (sentenceLeft <= 0) {
    sentenceLeft = 6 + ((Math.random() * 7) | 0);
    w = w[0].toUpperCase() + w.slice(1);
  }
  sentenceLeft -= 1;
  if (sentenceLeft === 0) w += '.';
  return w;
}

function buildWord(text) {
  const el = document.createElement('span');
  el.className = 'word';
  const letters = [];
  const status = [];
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'letter';
    s.textContent = ch;
    el.appendChild(s);
    letters.push(s);
    status.push(null);
  }
  return { text, el, letters, status, extras: [] };
}

function addWords(n) {
  for (let i = 0; i < n; i++) {
    const w = buildWord(nextWordText());
    words.push(w);
    wordsEl.appendChild(w.el);
  }
}

function makeCaret() {
  caretEl = document.createElement('span');
  caretEl.id = 'caret';
}

function placeCaret() {
  const w = words[wi];
  if (!w) return;
  const ref = w.letters[li] || null;
  w.el.insertBefore(caretEl, ref);
  w.el.classList.add('current');
  if (caretEl.scrollIntoView) {
    caretEl.scrollIntoView({ block: 'nearest' });
  }
}

function clearCurrentMark() {
  const w = words[wi];
  if (w) w.el.classList.remove('current');
}

function stats() {
  const mins = startTime ? (Date.now() - startTime) / 60000 : 0;
  const wpm = mins > 0 ? Math.round(correctChars / 5 / mins) : 0;
  const acc = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;
  wpmEl.textContent = `${wpm} wpm`;
  accEl.textContent = `${acc}% acc`;
}

setInterval(stats, 500);

function ensureStarted() {
  if (startTime === null) startTime = Date.now();
}

function typeChar(ch) {
  ensureStarted();
  const w = words[wi];
  if (!w) return;
  totalKeys += 1;
  if (li < w.text.length) {
    const ok = ch === w.text[li];
    w.status[li] = ok ? 'correct' : 'wrong';
    w.letters[li].classList.add(ok ? 'correct' : 'wrong');
    if (ok) {
      correctKeys += 1;
      correctChars += 1;
    }
    li += 1;
  } else {
    // Extra letter past word end: marked wrong, removable with backspace.
    const s = document.createElement('span');
    s.className = 'letter extra wrong';
    s.textContent = ch;
    w.el.appendChild(s);
    w.letters.push(s);
    w.extras.push(s);
    li += 1;
  }
  placeCaret();
  stats();
}

function submitWord() {
  const w = words[wi];
  if (!w || li === 0) return; // ignore leading / double spaces
  ensureStarted();
  totalKeys += 1;
  // Untyped remainder counts as missed (visible, keeps stream honest).
  let allGood = true;
  for (let i = li; i < w.text.length; i++) {
    if (w.status[i] !== 'correct') allGood = false;
    if (w.status[i] === null) {
      w.status[i] = 'missing';
      w.letters[i].classList.add('missing');
    }
  }
  if (allGood && w.extras.length === 0) correctKeys += 1;
  clearCurrentMark();
  wi += 1;
  li = 0;
  if (words.length - wi < REFILL_BELOW) addWords(BATCH);
  if (wi > PRUNE_AFTER) prune();
  placeCaret();
  stats();
}

function backspace() {
  const w = words[wi];
  if (!w) return;
  if (li > 0) {
    li -= 1;
    if (li < w.text.length) {
      if (w.status[li] === 'correct') correctChars -= 1;
      w.status[li] = null;
      w.letters[li].classList.remove('correct', 'wrong', 'missing');
    } else {
      const s = w.extras.pop();
      if (s) s.remove();
      w.letters.pop();
    }
  } else if (wi > 0) {
    // Step back into the previous word to fix it.
    clearCurrentMark();
    wi -= 1;
    li = words[wi].letters.length;
  }
  placeCaret();
  stats();
}

function prune() {
  for (let i = 0; i < PRUNE_COUNT; i++) {
    const w = words[i];
    if (w && w.el.parentNode === wordsEl) wordsEl.removeChild(w.el);
  }
  words.splice(0, PRUNE_COUNT);
  wi -= PRUNE_COUNT;
}

function reset() {
  words = [];
  wordsEl.innerHTML = '';
  wi = 0;
  li = 0;
  sentenceLeft = 0;
  totalKeys = 0;
  correctKeys = 0;
  correctChars = 0;
  startTime = null;
  makeCaret();
  addWords(REFILL_BELOW + BATCH);
  placeCaret();
  stats();
  focusInput();
}

function focusInput() {
  hidden.focus({ preventScroll: true });
  syncFocusHint();
}

function syncFocusHint() {
  const focused = document.activeElement === hidden;
  hintEl.classList.toggle('hidden', focused);
  wordsEl.classList.toggle('blurred', !focused);
}

// Single handler covers desktop + mobile keyboards (incl. autocorrect off).
hidden.addEventListener('input', (e) => {
  const t = e.inputType || '';
  if (t.startsWith('delete')) {
    backspace();
  } else {
    const data = e.data != null ? e.data : hidden.value;
    if (data) {
      for (const ch of data) {
        if (ch === ' ' || ch === '\u00a0') submitWord();
        else if (ch.length === 1 && !/\p{C}/u.test(ch)) typeChar(ch);
      }
    }
  }
  hidden.value = '';
  syncFocusHint();
});

hidden.addEventListener('blur', syncFocusHint);
hidden.addEventListener('focus', syncFocusHint);
boardEl.addEventListener('click', focusInput);
document.addEventListener('click', (e) => {
  if (!restartBtn.contains(e.target) && !toggle.contains(e.target)) focusInput();
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  reset();
});

// Theme: follow OS by default, manual toggle overrides.
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}
toggle.addEventListener('click', (e) => {
  e.stopPropagation();
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  focusInput();
});

reset();
