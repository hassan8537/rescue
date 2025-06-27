// src/services/stripeService.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function directChargeCard({ amount, currency, source, description }) {
  try {
    const charge = await stripe.charges.create({
      amount: amount * 100, // amount in cents
      currency: currency || "usd",
      source: source, // card token like 'tok_visa'
      description: description || "Direct charge"
    });

    return {
      status: 1,
      message: "Charge successful",
      data: charge
    };
  } catch (error) {
    return {
      status: 0,
      message: error.message,
      data: null
    };
  }
}

module.exports = { directChargeCard };
