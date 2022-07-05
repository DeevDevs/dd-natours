// success notification (уведомление об успехе)
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// error notification (уведомление об ошибке)
export const showAlert = (type, msg, time = 6) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector(document.body.insertAdjacentHTML('afterbegin', markup));
  window.setTimeout(hideAlert, time * 1000);
};
