/* Live3C — auth.js */

function setAdminCookie(value) {
  const expires = value ? 'Fri, 31 Dec 9999 23:59:59 GMT' : 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `live3c_admin=${value ? 'true' : ''}; Path=/; Domain=.live3c.xyz; Expires=${expires}; SameSite=Lax`;
}

function getAdminCookie() {
  return document.cookie.split(';').some(c => c.trim() === 'live3c_admin=true');
}

export function isAdmin() {
  return getAdminCookie() || localStorage.getItem('live3c_admin') === 'true';
}

export function requireAdmin() {
  if (!isAdmin()) window.location.href = '/admin/login.html';
}

export function login(password) {
  // hardcode tạm, đổi sau
  if (password === 'quang3c89') {
    localStorage.setItem('live3c_admin', 'true');
    setAdminCookie(true);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem('live3c_admin');
  setAdminCookie(false);
  window.location.href = '/admin/login.html';
}
