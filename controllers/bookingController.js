//check how we create an object on STRIPE... we call it as a function and
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Booking = require('./../models/bookingModel.js');
const User = require('./../models/userModel.js');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2. create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //this long url is unsafe and is a temp solution for data transfer to the success page
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${
    //   tour.price
    // }`, //ONCE WE ADDED THE WEBHOOKCHECKOUT HANDLER, WE DO NOT NEED THIS LONG URL WITH PARAMS
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
        //because most currencies have 100 cents and we need to specify the price in cents, we multiply the sum by 100
        amount: tour.price * 100,
        currency: 'usd',
        // quantity here is for the number of booked tours
        quantity: 1
      }
    ]
  });
  // 3. send the session to client
  res.status(200).json({
    status: 'success',
    session
  });
});

//ONCE WE ADDED THE WEBHOOKCHECKOUT HANDLER, WE DO NOT NEED IT
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //as in stripe success_url we pass this data (TEMPORARY SOLUTION), we can retrieve it and create a Booking model using this data
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   //   next();
//   //this is cheating... what we do is we create a new request to go to a certain page.. so, after the booking is created, we go to the homepage.. however, because there is no more tour, user and price, then the booking will not be make and stored in te DB anymore. If we left the smae URL, then it would be endless req->res cycle ... it is ONLY done to hide the booking details (tour user and price) from the URL field
//   res.redirect(req.originalUrl.split('?')[0]);
// });

exports.createBooking = factory.createOne(Booking);
exports.getOneBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBookingDetails = factory.updateOne(Booking);
exports.deleteOneBooking = factory.deleteOne(Booking);

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  // const price = session.line_items[0].amount / 100;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

//THIS IS A HANDLER FOR WEBHOOK CHECKOUT (Route is in app.js)
exports.webhookCheckout = async (req, res, next) => {
  //first we are retrieving the signature from stripe
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    //then we trigger the event
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  //and check if that event was successful. for that, we created another function to use here
  if (event.type === 'checkout.session.completed') createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};
