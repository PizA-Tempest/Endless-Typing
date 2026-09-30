const pad = document.getElementById('pad');
const wordEl = document.getElementById('wordCount');
const charEl = document.getElementById('charCount');
const toggle = document.getElementById('themeToggle');

// Theme: follow OS by default, manual toggle overrides.
const root = document.documentElement;
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
}

toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
});

// No persistence by design — fresh on every load.
pad.value = '';

pad.addEventListener('input', () => {
  const text = pad.value;
  charEl.textContent = `${text.length} chars`;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  wordEl.textContent = `${words} words`;
});
