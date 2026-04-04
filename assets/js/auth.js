/* Live3C — auth.js */

export function isAdmin() {
  return localStorage.getItem('live3c_admin') === 'true';
}

export function requireAdmin() {
  if (!isAdmin()) window.location.href = '/admin/login.html';
}

export function login(password) {
  // hardcode tạm, đổi sau
  if (password === 'admin2025') {
    localStorage.setItem('live3c_admin', 'true');
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem('live3c_admin');
  window.location.href = '/admin/login.html';
}
