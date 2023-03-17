// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_PK);
const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
// app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//Cors Configuration - Start
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
//Cors Configuration - End
const YOUR_DOMAIN = 'https://blog-subscription.netlify.app/';
const posts = [
  {
    title: 'News story 1',
    id: 1,
    img: 'https://images.unsplash.com/photo-1528785198459-ec50485704c7?ixlib=rb-0.3.5&s=3a2fc3039516555bbb2e9cd2967bd321&auto=format&fit=crop&w=1537&q=80',
  },
  {
    title: 'Blog post 2',
    id: 2,
    img: 'https://images.unsplash.com/photo-1525543907410-b2562b6796d6?ixlib=rb-0.3.5&s=9ff8e5e718a6a40cbd0e1471235912f4&auto=format&fit=crop&w=3452&q=80',
  },
  {
    title: 'Article 3',
    id: 3,
    img: 'https://images.unsplash.com/photo-1622186477895-f2af6a0f5a97?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80',
  },
];

app.get('/posts', async (req, res) => {
  res.send(posts);
});
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  let article = {
    id,
  };
  try {
    const customerId = req.get('customerId');
    console.log(customerId);
    if (!customerId) {
      article.body = 'Not subscribed';
    } else {
      const customer = await getCustomer(customerId);
      console.log(customer);
      article.body = faker.lorem.paragraphs(10);
    }
    res.send(article);
  } catch (err) {
    article.body = 'Not subscribed';
    res.send(article);
  }
});

const getCustomer = async (id) => {
  try {
    const customer = await stripe.customers.retrieve(id);
    return customer;
  } catch (err) {
    return Promise.reject(err);
  }
};

app.get('/', async (req, res) => {
  res.send();
});

app.get('/subscription/success', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  const customer = await stripe.customers.retrieve(session.customer);
  console.log(customer);
  const redurectUrl = `${YOUR_DOMAIN}/success/${customer.id}`;
  res.redirect(303, redurectUrl);

  // res.send(
  //   `<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`
  // );
});

// app.post('/create-checkout-session', async (req, res) => {
//   const prices = await stripe.prices.list({
//     lookup_keys: [req.body.lookup_key],
//     expand: ['data.product'],
//   });
//   const session = await stripe.checkout.sessions.create({
//     billing_address_collection: 'auto',
//     line_items: [
//       {
//         price: prices.data[0].id,
//         // For metered billing, do not pass quantity
//         quantity: 1,
//       },
//     ],
//     mode: 'subscription',
//     success_url: `${YOUR_DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${YOUR_DOMAIN}/cancel?canceled=true`,
//   });
//   console.log(session);
//   res.redirect(303, session.url);
// });

// app.post('/create-portal-session', async (req, res) => {
//   // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
//   // Typically this is stored alongside the authenticated user in your database.
//   const { session_id } = req.body;
//   const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

//   // This is the url to which the customer will be redirected when they are done
//   // managing their billing with the portal.
//   const returnUrl = YOUR_DOMAIN;

//   const portalSession = await stripe.billingPortal.sessions.create({
//     customer: checkoutSession.customer,
//     return_url: returnUrl,
//   });

//   res.redirect(303, portalSession.url);
// });

// app.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   (request, response) => {
//     let event = request.body;
//     // Replace this endpoint secret with your endpoint's unique secret
//     // If you are testing with the CLI, find the secret by running 'stripe listen'
//     // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
//     // at https://dashboard.stripe.com/webhooks
//     const endpointSecret = 'whsec_12345';
//     // Only verify the event if you have an endpoint secret defined.
//     // Otherwise use the basic event deserialized with JSON.parse
//     if (endpointSecret) {
//       // Get the signature sent by Stripe
//       const signature = request.headers['stripe-signature'];
//       try {
//         event = stripe.webhooks.constructEvent(
//           request.body,
//           signature,
//           endpointSecret
//         );
//       } catch (err) {
//         console.log(`⚠️  Webhook signature verification failed.`, err.message);
//         return response.sendStatus(400);
//       }
//     }
//     let subscription;
//     let status;
//     // Handle the event
//     switch (event.type) {
//       case 'customer.subscription.trial_will_end':
//         subscription = event.data.object;
//         status = subscription.status;
//         console.log(`Subscription status is ${status}.`);
//         // Then define and call a method to handle the subscription trial ending.
//         // handleSubscriptionTrialEnding(subscription);
//         break;
//       case 'customer.subscription.deleted':
//         subscription = event.data.object;
//         status = subscription.status;
//         console.log(`Subscription status is ${status}.`);
//         // Then define and call a method to handle the subscription deleted.
//         // handleSubscriptionDeleted(subscriptionDeleted);
//         break;
//       case 'customer.subscription.created':
//         subscription = event.data.object;
//         status = subscription.status;
//         console.log(`Subscription status is ${status}.`);
//         // Then define and call a method to handle the subscription created.
//         // handleSubscriptionCreated(subscription);
//         break;
//       case 'customer.subscription.updated':
//         subscription = event.data.object;
//         status = subscription.status;
//         console.log(`Subscription status is ${status}.`);
//         // Then define and call a method to handle the subscription update.
//         // handleSubscriptionUpdated(subscription);
//         break;
//       default:
//         // Unexpected event type
//         console.log(`Unhandled event type ${event.type}.`);
//     }
//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
//   }
// );
const PORT = process.env.PORT || 80;
var server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('server is listening at http://%s:%s', host, port);
});
