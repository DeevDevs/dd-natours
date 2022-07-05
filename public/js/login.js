// a package to initiate requests through front end (пакет для создания запросов во фронтенде)
import axios from 'axios';
import { showAlert } from './alerts.js';

/**
 *  makes a login request (делает запрос для входа пользователя)
 * @param {string, string}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      // url: 'http://127.0.0.1:8000/api/v1/users/login',
      url: '/api/v1/users/login',
      data: { email: email, password: password }
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/'); // sends the user to homepage
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

/**
 *  makes a logout request (делает запрос для выхода пользователя)
 * @param {}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      // url: 'http://127.0.0.1:8000/api/v1/users/logout'
      url: '/api/v1/users/logout'
    });
    if (res.data.status === 'success') {
      location.reload(true); // update page upon logout
    }
  } catch (err) {
    showAlert('error', 'Error logging out. Try again.');
  }
};
