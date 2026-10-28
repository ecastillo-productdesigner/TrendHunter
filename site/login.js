// Browser-only sign-in prototype. Email uses the demo code 123456;
// no email, password or consent is sent to a server.
const RETURN_KEY = 'return-to';
const EMAIL_KEY = 'sign-in-email';
const CHALLENGE_KEY = 'sign-in-challenge';
const CODE_LIFETIME = 15 * 60 * 1000;
const DEMO_CODE = '123456';

function readChallenge() {
  try { return JSON.parse(sessionStorage.getItem(CHALLENGE_KEY)); } catch { return null; }
}

function saveChallenge(challenge) {
  try { sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge)); } catch {}
}

function showError(input, message, visible) {
  message.hidden = !visible;
  input.setAttribute('aria-invalid', String(visible));
}

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
    sessionStorage.removeItem(CHALLENGE_KEY);
  } catch (e) {}
  window.location.href = returnTo;
}

// Apple / Google
document.querySelectorAll('.auth-button[data-auth]').forEach((provider) => {
  provider.addEventListener('click', finishSignIn);
});

// Email — only a valid address enables submission. Inline errors replace
// browser validation bubbles so the ready and error states share the DS.
const emailForm = document.querySelector('.email-sign-in');

if (emailForm) {
  const emailInput = emailForm.querySelector('.form-input');
  const submitButton = emailForm.querySelector('[type="submit"]');
  const error = document.getElementById('email-error');
  const valid = () => emailInput.value.trim() !== '' && emailInput.validity.valid;
  const syncEmail = () => {
    submitButton.disabled = !valid();
    if (valid() || !emailInput.value) showError(emailInput, error, false);
  };

  emailInput.addEventListener('input', syncEmail);
  emailInput.addEventListener('blur', () => {
    showError(emailInput, error, emailInput.value.trim() !== '' && !valid());
  });
  window.addEventListener('pageshow', syncEmail);
  syncEmail();

  emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!valid()) {
      showError(emailInput, error, true);
      emailInput.focus();
      return;
    }
    const email = emailInput.value.trim();
    try { sessionStorage.setItem(EMAIL_KEY, email); } catch {}
    saveChallenge({ email, expiresAt: Date.now() + CODE_LIFETIME, verified: false });
    window.location.href = 'login-code.html';
  });
}

// ===========================
// One-time code — each digit moves focus to the next square,
// Backspace steps back, a pasted code fills every square.
// The demo code is 123456. Other complete codes show the supplied error state.
// ===========================
const otc = document.querySelector('.otc');

if (otc) {
  const digits = [...otc.querySelectorAll('.otc-digit')];
  const error = document.getElementById('code-error');
  const status = document.getElementById('code-status');
  let challenge = readChallenge();
  if (!challenge?.email) window.location.replace('login-email.html');

  try {
    const email = challenge?.email;
    if (email) document.querySelector('.otc-email').textContent = email;
  } catch (e) {}

  // One square at a time carries the active (lime) border: the one waiting for input
  const setActive = (target) => {
    if (document.activeElement !== target) target.focus();
    digits.forEach((d) => d.classList.toggle('is-active', d === target));
  };

  // Ready for input: the cursor waits in the first empty square,
  // also when the page is restored with the Back button
  const focusFirstEmpty = () => setActive(digits.find((d) => d.value === '') || digits[digits.length - 1]);
  focusFirstEmpty();
  window.addEventListener('pageshow', focusFirstEmpty);

  const clearError = () => {
    error.hidden = true;
    digits.forEach(digit => digit.setAttribute('aria-invalid', 'false'));
  };

  const failCode = (message) => {
    error.textContent = message;
    error.hidden = false;
    status.textContent = '';
    digits.forEach(digit => {
      digit.value = '';
      digit.setAttribute('aria-invalid', 'true');
    });
    setActive(digits[0]);
  };

  const checkComplete = () => {
    if (!digits.every(digit => digit.value !== '')) return;
    if (Date.now() >= (challenge?.expiresAt || 0)) {
      failCode('Your code has expired. Request a new code.');
    } else if (digits.map(digit => digit.value).join('') !== DEMO_CODE) {
      failCode('You entered an incorrect code. Please try again.');
    } else {
      saveChallenge({ ...challenge, verified: true });
      window.location.href = 'login-terms.html';
    }
  };

  const fillFrom = (index, text) => {
    const numbers = text.replace(/\D/g, '').split('');
    if (numbers.length) clearError();
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
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        setActive(digits[index - 1]);
      } else if (event.key === 'ArrowRight' && index < digits.length - 1) {
        event.preventDefault();
        setActive(digits[index + 1]);
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
    challenge = { ...challenge, expiresAt: Date.now() + CODE_LIFETIME, verified: false };
    saveChallenge(challenge);
    clearError();
    status.textContent = 'A new code has been sent.';
    digits.forEach((d) => { d.value = ''; });
    setActive(digits[0]);
  });
}

// The alternative shown on the code screen uses the same prototype session.
const passwordForm = document.querySelector('.password-sign-in');
if (passwordForm) {
  const challenge = readChallenge();
  if (!challenge?.email) window.location.replace('login-email.html');
  const input = passwordForm.querySelector('.form-input');
  const error = document.getElementById('password-error');
  const button = passwordForm.querySelector('[type="submit"]');
  input.addEventListener('input', () => {
    button.disabled = input.value === '';
    showError(input, error, false);
  });
  passwordForm.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value !== 'demo') {
      showError(input, error, true);
      input.focus();
      return;
    }
    saveChallenge({ ...challenge, verified: true });
    window.location.href = 'login-terms.html';
  });
}

// ===========================
// Terms and Policies — Continue unlocks once the box is checked,
// then signs the reader in
// ===========================
const termsForm = document.querySelector('.terms-form');

if (termsForm) {
  if (!readChallenge()?.verified) window.location.replace('login-code.html');
  const termsCheckbox = termsForm.querySelector('.terms-checkbox');
  const continueButton = termsForm.querySelector('[type="submit"]');
  const error = document.getElementById('terms-error');

  // The browser may restore the checkbox when coming back to the page
  // aria-disabled keeps validation discoverable when an unchecked Continue is pressed.
  const syncContinue = () => {
    continueButton.setAttribute('aria-disabled', String(!termsCheckbox.checked));
    if (termsCheckbox.checked) showError(termsCheckbox, error, false);
  };
  termsCheckbox.addEventListener('change', syncContinue);
  window.addEventListener('pageshow', syncContinue);
  syncContinue();

  termsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (termsCheckbox.checked) finishSignIn();
    else {
      showError(termsCheckbox, error, true);
      termsCheckbox.focus();
    }
  });
}
