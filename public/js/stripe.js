import axios from 'axios';
import { showAlert } from './alerts.js';
const stripe = Stripe(
  'pk_test_51KveasByVJnJHpaDJtQ3glxPACqIYjdCObnETgSvp2ISFY0Kz0s8shpHf3txPVQvodb0hsGhYc21MNp6j58vV29L00FgMHC9hk'
);

/**
 * initiates stripe session for paying the book price (запускает сессию для оплаты бронирования)
 * @param {string}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
export const bookTour = async tourId => {
  try {
    //  get checkout session from API (запрашивает начало сессии в API)
    //   const session = await axios({
    //     method: 'GET',
    //     url: `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    //   });
    // const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //  create checkout form + charge the credit card (создает форму для оплаты)
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
