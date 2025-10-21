(function() {
  let currentUser = null;

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/whoami', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          currentUser = { email: data.email };
          return true;
        }
      }
      currentUser = null;
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      currentUser = null;
      return false;
    }
  }

  function injectNav() {
    const header = document.querySelector('header') || document.querySelector('body');

    if (!header) return;

    let navContainer = document.getElementById('aa-nav');
    if (!navContainer) {
      navContainer = document.createElement('div');
      navContainer.id = 'aa-nav';
      navContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000;';

      if (header.tagName === 'HEADER') {
        header.appendChild(navContainer);
      } else {
        document.body.appendChild(navContainer);
      }
    }

    const navLinks = document.createElement('div');
    navLinks.style.cssText = 'display: flex; gap: 20px; align-items: center; background: rgba(255, 255, 255, 0.95); padding: 12px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);';

    const links = [
      { text: 'Home', href: '/' },
      { text: 'Apps', href: '/apps/' },
      { text: 'Contact', href: '/contact/' },
    ];

    if (currentUser) {
      links.push({ text: 'Dashboard', href: '/dashboard' });
    }

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.style.cssText = 'text-decoration: none; color: #333; font-weight: 500; transition: color 0.2s;';
      a.onmouseover = () => a.style.color = '#666';
      a.onmouseout = () => a.style.color = '#333';
      navLinks.appendChild(a);
    });

    if (currentUser) {
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Log Out';
      logoutBtn.style.cssText = 'background: #333; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background 0.2s;';
      logoutBtn.onmouseover = () => logoutBtn.style.background = '#555';
      logoutBtn.onmouseout = () => logoutBtn.style.background = '#333';
      logoutBtn.onclick = handleLogout;
      navLinks.appendChild(logoutBtn);
    } else {
      const loginBtn = document.createElement('button');
      loginBtn.textContent = 'Log In';
      loginBtn.style.cssText = 'background: #333; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: background 0.2s;';
      loginBtn.onmouseover = () => loginBtn.style.background = '#555';
      loginBtn.onmouseout = () => loginBtn.style.background = '#333';
      loginBtn.onclick = showLoginModal;
      navLinks.appendChild(loginBtn);
    }

    navContainer.innerHTML = '';
    navContainer.appendChild(navLinks);
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  }

  function showLoginModal() {
    const overlay = document.createElement('div');
    overlay.id = 'aa-login-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background: white; padding: 40px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);';

    const title = document.createElement('h2');
    title.textContent = 'Log In';
    title.style.cssText = 'margin: 0 0 24px 0; font-size: 1.5rem;';

    const form = document.createElement('div');
    form.id = 'aa-login-form';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email address';
    emailInput.id = 'aa-email-input';
    emailInput.style.cssText = 'width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; margin-bottom: 16px; box-sizing: border-box;';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Send Code';
    submitBtn.style.cssText = 'width: 100%; background: #333; color: white; border: none; padding: 12px; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: background 0.2s; margin-bottom: 12px;';
    submitBtn.onmouseover = () => submitBtn.style.background = '#555';
    submitBtn.onmouseout = () => submitBtn.style.background = '#333';
    submitBtn.onclick = handleRequestCode;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'width: 100%; background: transparent; color: #666; border: 1px solid #ddd; padding: 12px; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: all 0.2s;';
    cancelBtn.onmouseover = () => { cancelBtn.style.background = '#f5f5f5'; cancelBtn.style.color = '#333'; };
    cancelBtn.onmouseout = () => { cancelBtn.style.background = 'transparent'; cancelBtn.style.color = '#666'; };
    cancelBtn.onclick = closeLoginModal;

    const message = document.createElement('div');
    message.id = 'aa-login-message';
    message.style.cssText = 'margin-bottom: 16px; padding: 12px; border-radius: 4px; display: none;';

    form.appendChild(message);
    form.appendChild(emailInput);
    form.appendChild(submitBtn);
    form.appendChild(cancelBtn);

    modal.appendChild(title);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    emailInput.focus();
  }

  function closeLoginModal() {
    const overlay = document.getElementById('aa-login-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  function showMessage(text, isError = false) {
    const message = document.getElementById('aa-login-message');
    if (message) {
      message.textContent = text;
      message.style.display = 'block';
      message.style.background = isError ? '#fee' : '#efe';
      message.style.color = isError ? '#c33' : '#363';
      message.style.border = isError ? '1px solid #fcc' : '1px solid #cfc';
    }
  }

  async function handleRequestCode() {
    const emailInput = document.getElementById('aa-email-input');
    const email = emailInput.value.trim();

    if (!email) {
      showMessage('Please enter your email address', true);
      return;
    }

    const submitBtn = document.querySelector('#aa-login-form button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showCodeStep(email);
      } else {
        showMessage(data.error || 'Failed to send code. Please try again.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Code';
      }
    } catch (error) {
      console.error('Request code error:', error);
      showMessage('Network error. Please try again.', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Code';
    }
  }

  function showCodeStep(email) {
    const form = document.getElementById('aa-login-form');
    form.innerHTML = '';

    const message = document.createElement('div');
    message.id = 'aa-login-message';
    message.style.cssText = 'margin-bottom: 16px; padding: 12px; border-radius: 4px; background: #efe; color: #363; border: 1px solid #cfc;';
    message.textContent = `We sent a 6-digit code to ${email}. Please check your inbox.`;

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.placeholder = '6-digit code';
    codeInput.id = 'aa-code-input';
    codeInput.maxLength = 6;
    codeInput.style.cssText = 'width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1.5rem; margin-bottom: 16px; box-sizing: border-box; text-align: center; letter-spacing: 4px;';

    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = 'Verify Code';
    verifyBtn.style.cssText = 'width: 100%; background: #333; color: white; border: none; padding: 12px; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: background 0.2s; margin-bottom: 12px;';
    verifyBtn.onmouseover = () => verifyBtn.style.background = '#555';
    verifyBtn.onmouseout = () => verifyBtn.style.background = '#333';
    verifyBtn.onclick = () => handleVerifyCode(email);

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.style.cssText = 'width: 100%; background: transparent; color: #666; border: 1px solid #ddd; padding: 12px; border-radius: 4px; font-size: 1rem; cursor: pointer; transition: all 0.2s;';
    backBtn.onmouseover = () => { backBtn.style.background = '#f5f5f5'; backBtn.style.color = '#333'; };
    backBtn.onmouseout = () => { backBtn.style.background = 'transparent'; backBtn.style.color = '#666'; };
    backBtn.onclick = () => { closeLoginModal(); showLoginModal(); };

    form.appendChild(message);
    form.appendChild(codeInput);
    form.appendChild(verifyBtn);
    form.appendChild(backBtn);

    codeInput.focus();
  }

  async function handleVerifyCode(email) {
    const codeInput = document.getElementById('aa-code-input');
    const code = codeInput.value.trim();

    if (!code || code.length !== 6) {
      showMessage('Please enter the 6-digit code', true);
      return;
    }

    const verifyBtn = document.querySelector('#aa-login-form button');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Success! Redirecting...', false);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showMessage(data.error || 'Invalid code. Please try again.', true);
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';
        codeInput.value = '';
        codeInput.focus();
      }
    } catch (error) {
      console.error('Verify code error:', error);
      showMessage('Network error. Please try again.', true);
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify Code';
    }
  }

  async function init() {
    await checkAuth();
    injectNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
