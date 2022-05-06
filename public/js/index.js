import '@babel/polyfill'; // it kinda improves/adapts javascript features
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
// const btnUpdateUserData = document.querySelector('.btn--save-user-data');
// const accountBtn = document.querySelector('.nav__el--');

//VALUES
let email;
let password;

let newName;
let newEmail;

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  // console.log(locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    email = document.getElementById('email').value;
    password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateUserForm) {
  updateUserForm.addEventListener('submit', e => {
    e.preventDefault();
    //however, to recreate the multipart form-data to then make an api call, we need to do the following
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // const data = Object.fromEntries(updates);
    console.group(form);
    updateSettings(form, 'data');
  });

  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating';
    // console.log('Password submission has been triggered');
    const updates = new FormData(updatePasswordForm);
    const data = Object.fromEntries(updates);
    // console.log(data);
    await updateSettings(data, 'password');
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);
