import axios from 'axios';
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  //   console.log(email, password);
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
        //this method allows us to make user go to a certain page that we assign
        location.assign('/');
      }, 1500);
    }
    // console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    // console.log('SHOWING THE LOCATION', location);
    const res = await axios({
      method: 'GET',
      // url: 'http://127.0.0.1:8000/api/v1/users/logout' ... instead, we will remove the localserver path because both API and server will be in the same place
      url: '/api/v1/users/logout'
    });
    if (res.data.status === 'success') {
      location.reload(true); //through location.reload(true), we make the page reload triggered by the server side, which will update the page upon logout
    }
  } catch (err) {
    showAlert('error', 'Error logging out. Try again.');
  }
};
