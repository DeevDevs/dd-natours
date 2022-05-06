import axios from 'axios';
import { showAlert } from './alerts.js';

//type is either PASSWORD or NAME+EMAIL
export const updateSettings = async (data, type) => {
  console.log(data);
  const url =
    type === 'password'
      ? `http://127.0.0.1:8000/api/v1/users/updateMyPassword`
      : `http://127.0.0.1:8000/api/v1/users/updateMe`;
  try {
    const res = await axios({
      method: 'PATCH',
      url: url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      //   window.setTimeout(() => {
      //     location.reload(true);
      //   }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
