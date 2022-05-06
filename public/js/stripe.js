import axios from 'axios';
import { showAlert } from './alerts.js';
const stripe = Stripe(
  'pk_test_51KveasByVJnJHpaDJtQ3glxPACqIYjdCObnETgSvp2ISFY0Kz0s8shpHf3txPVQvodb0hsGhYc21MNp6j58vV29L00FgMHC9hk'
);

export const bookTour = async tourId => {
  try {
    // 1. get checkout session from API
    //   const session = await axios({
    //     method: 'GET',
    //     url: `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    //   });
    const session = await axios(`http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    // 2. create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
