// adding stripe technology using our secret key (добавляем stripe технологию с использованием секретного ключа)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// bring booking, user and tour models to save and search for bookings (добавляем модели для туров, пользователей и бронирования)
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel.js');
const Booking = require('./../models/bookingModel.js');
// one of our utils that wraps the asyncronous functions (наша утилита для работы с асинхронным кодом)
const catchAsync = require('./../utils/catchAsync');
// one of our utils with universal functions/handlers (наша утилита с универсальными функциями)
const factory = require('./handlerFactory');

/**
 * creates and send the checkout session request once the user tries to book a tour (создать и отправить запрос на специальную сессию для оплаты бронирования)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // get the currently booked tour (получает данные о выбранном туре)
  const tour = await Tour.findById(req.params.tourId);
  // create checkout session (создает сессия для оплаты бронирования)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // send the session to client (отправляет ее клиенту)
  res.status(200).json({
    status: 'success',
    session
  });
});

// functions create based on the factory util (функции для обработки запросов по маршрутам, построенные на базе функции в нашей утилите)
exports.createBooking = factory.createOne(Booking);
exports.getOneBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBookingDetails = factory.updateOne(Booking);
exports.deleteOneBooking = factory.deleteOne(Booking);

/**
 * if booking was successful, stores booking info in the DB (если бронирование успешно, сохраняет инфу в базе данных)
 * @param {object}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

/**
 * receives the session data and initiates the checkout process (получает данные по сессии и запускает ее)
 * @param {reqObject, resObject, function}
 * @returns {undefined}
 * @author Dmitriy Vnuchkov (original idea by Jonas Shmedtmann)
 */
exports.webhookCheckout = async (req, res, next) => {
  // retrieves the signature from stripe (выводит официальную сигнатуру stripe)
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    // triggers the event (запускает процесс)
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  // checks if that event was successful and saves data (проверяет, была ли сессия успешна и сохраняет данные)
  if (event.type === 'checkout.session.completed') createBookingCheckout(event.data.object);
  res.status(200).json({ received: true });
};
