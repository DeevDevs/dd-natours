import axios from 'axios';
import { showAlert } from './alerts.js';

/**
 * makes a request to update user details (делает запрос для апдейта деталей пользователя)
 * @param {object, string}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
export const updateSettings = async (data, type) => {
  // const url =
  //   type === 'password'
  //     ? `http://127.0.0.1:8000/api/v1/users/updateMyPassword`
  //     : `http://127.0.0.1:8000/api/v1/users/updateMe`;
  const url = type === 'password' ? `/api/v1/users/updateMyPassword` : `/api/v1/users/updateMe`;
  try {
    const res = await axios({
      method: 'PATCH',
      url: url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
