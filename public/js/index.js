import '@babel/polyfill'; // improves/adapts javascript features
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';
import { displayMap } from './mapbox.js';
import { bookTour } from './stripe.js';
import { showAlert } from './alerts.js';

// DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour');

//VALUES
let email;
let password;

// displays the map with the tour details (отображает карту с деталями тура)
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// adds an event listener, if the page contains login form (добавляет приемник событий, если на странице имеется форма для входа)
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    email = document.getElementById('email').value;
    password = document.getElementById('password').value;
    login(email, password);
  });
}

// adds an event listener, if the page contains logout btn (добавляет приемник событий, если на странице имеется форма для выхода)
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// adds a event listeners, if the page contains usel profile  (добавляет приемник событий, если на странице имеется профиль пользователя)
if (updateUserForm) {
  updateUserForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.group(form);
    updateSettings(form, 'data');
  });

  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating';
    const updates = new FormData(updatePasswordForm);
    const data = Object.fromEntries(updates);
    await updateSettings(data, 'password');
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}
// adds an event listener to initiate booking  (добавляет приемник событий, запускающий процесс бронирования)
if (bookTourBtn) {
  bookTourBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
// checks the response object content to display a notification (проверяет наличие информации об оповещении в объекте ответа)
const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);
