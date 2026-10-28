// Log In pages — any sign-in option signs the reader in and returns them
// to the page they came from (or the feed if they opened this page directly).
const RETURN_KEY = 'return-to';

// ===========================
// Theme toggle — same behavior as app.js on the other pages
// ===========================
const themeToggle = document.querySelector('.theme-toggle');

function updateToggleLabel() {
  const isLight = document.documentElement.dataset.theme === 'light';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
}

themeToggle.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  if (next === 'light') {
    root.dataset.theme = 'light';
  } else {
    delete root.dataset.theme;
  }
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateToggleLabel();
});

updateToggleLabel();

// Back on the first Log In page returns to the page the reader came from
const firstBack = document.querySelector('.page-login-start .nav-back');

if (firstBack) {
  try {
    const returnTo = sessionStorage.getItem(RETURN_KEY);
    if (returnTo) firstBack.href = returnTo;
  } catch (e) {}
}

function finishSignIn() {
  let returnTo = 'feed.html';
  try {
    sessionStorage.setItem('signed-in', 'true');
    returnTo = sessionStorage.getItem(RETURN_KEY) || returnTo;
    sessionStorage.removeItem(RETURN_KEY);
  } catch (e) {}
  window.location.href = returnTo;
}

// Apple / Google
document.querySelectorAll('[data-auth]').forEach((provider) => {
  provider.addEventListener('click', finishSignIn);
});

// Email — the button turns on as soon as anything is typed;
// a valid address goes on to the code screen
const EMAIL_KEY = 'sign-in-email';
const emailForm = document.querySelector('.email-sign-in');

if (emailForm) {
  const emailInput = emailForm.querySelector('.form-input');
  const submitButton = emailForm.querySelector('[type="submit"]');

  emailInput.addEventListener('input', () => {
    submitButton.disabled = emailInput.value.trim() === '';
  });

  emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!emailInput.reportValidity()) return;
    try { sessionStorage.setItem(EMAIL_KEY, emailInput.value.trim()); } catch (e) {}
    window.location.href = 'login-code.html';
  });
}

// ===========================
// One-time code — each digit moves focus to the next square,
// Backspace steps back, a pasted code fills every square.
// Any six digits are accepted and lead on to Terms and Policies.
// ===========================
const otc = document.querySelector('.otc');

if (otc) {
  const digits = [...otc.querySelectorAll('.otc-digit')];

  try {
    const email = sessionStorage.getItem(EMAIL_KEY);
    if (email) document.querySelector('.otc-email').textContent = email;
  } catch (e) {}

  // One square at a time carries the active (lime) border: the one waiting for input
  const setActive = (target) => {
    target.focus();
    digits.forEach((d) => d.classList.toggle('is-active', d === target));
  };

  // Ready for input: the cursor waits in the first empty square,
  // also when the page is restored with the Back button
  const focusFirstEmpty = () => setActive(digits.find((d) => d.value === '') || digits[digits.length - 1]);
  focusFirstEmpty();
  window.addEventListener('pageshow', focusFirstEmpty);

  const checkComplete = () => {
    if (digits.every((d) => d.value !== '')) window.location.href = 'login-terms.html';
  };

  const fillFrom = (index, text) => {
    const numbers = text.replace(/\D/g, '').split('');
    numbers.forEach((n, i) => { if (digits[index + i]) digits[index + i].value = n; });
    const next = digits[Math.min(index + numbers.length, digits.length - 1)];
    setActive(next);
    checkComplete();
  };

  digits.forEach((digit, index) => {
    digit.addEventListener('input', () => {
      const value = digit.value.replace(/\D/g, '');
      digit.value = '';
      if (value) fillFrom(index, value);
    });

    digit.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && digit.value === '' && index > 0) {
        digits[index - 1].value = '';
        setActive(digits[index - 1]);
        event.preventDefault();
      }
    });

    // Clicking a square to fix a digit moves the lime border there
    digit.addEventListener('focus', () => setActive(digit));

    digit.addEventListener('paste', (event) => {
      event.preventDefault();
      fillFrom(index, event.clipboardData.getData('text'));
    });
  });

  // "Resent code" — clears the squares for a fresh code
  document.querySelector('.otc-resend').addEventListener('click', () => {
    digits.forEach((d) => { d.value = ''; });
    setActive(digits[0]);
  });
}

// ===========================
// Terms and Policies — Continue unlocks once the box is checked,
// then signs the reader in
// ===========================
const termsForm = document.querySelector('.terms-form');

if (termsForm) {
  const termsCheckbox = termsForm.querySelector('.terms-checkbox');
  const continueButton = termsForm.querySelector('[type="submit"]');

  // The browser may restore the checkbox when coming back to the page
  const syncContinue = () => { continueButton.disabled = !termsCheckbox.checked; };
  termsCheckbox.addEventListener('change', syncContinue);
  window.addEventListener('pageshow', syncContinue);

  termsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (termsCheckbox.checked) finishSignIn();
  });
}
