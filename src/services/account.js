const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(stripeKey);
const Account = require("../models/Account");
const accountSchema = require("../schemas/account");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.account = Account;
  }

  async addAccount(req, res) {
    try {
      const user = req.user;
      const { stripeCardToken } = req.body;

      if (!stripeCardToken) {
        return handlers.response.failed({
          res: res,
          message: "Stripe card token is required."
        });
      }

      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email
        });
        user.stripeCustomerId = customer.id;
        if (typeof user.save === "function") await user.save();
        stripeCustomerId = customer.id;
      }

      const card = await stripe.customers.createSource(stripeCustomerId, {
        source: stripeCardToken
      });

      const existingAccount = await this.account.findOne({
        userId: user._id,
        stripeCardId: card.id
      });

      if (existingAccount) {
        return handlers.response.failed({
          res: res,
          message: "Stripe card already exists."
        });
      }

      await this.account.create({
        userId: user._id,
        stripeCardId: card.id
      });

      return handlers.response.success({
        res: res,
        message: "Success",
        data: this.formatStripeCard(card)
      });
    } catch (error) {
      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async removeAccount(req, res) {
    try {
      const userId = req.user._id;
      const { stripeCardId } = req.params;

      const card = await this.account
        .findOne({ stripeCardId: stripeCardId, userId })
        .populate(accountSchema.populate);

      if (!card) {
        return handlers.response.failed({
          res: res,
          message: "Card not found."
        });
      }

      await stripe.customers.deleteSource(
        req.user.stripeCustomerId,
        card.stripeCardId
      );

      await this.account.findByIdAndDelete(card._id);

      return handlers.response.success({
        res: res,
        message: "Success"
      });
    } catch (error) {
      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async getAccounts(req, res) {
    try {
      const stripeCustomerId = req.user.stripeCustomerId;

      if (!stripeCustomerId) {
        return handlers.response.failed({
          res: res,
          message: "Stripe customer ID not found."
        });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card"
      });

      if (!paymentMethods.data.length) {
        return handlers.response.failed({
          res: res,
          message: "No cards found."
        });
      }

      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const defaultPaymentMethod =
        customer.invoice_settings.default_payment_method;

      const sortedCards = paymentMethods.data.sort((a, b) => {
        if (a.id === defaultPaymentMethod) return -1;
        if (b.id === defaultPaymentMethod) return 1;
        return 0;
      });

      return handlers.response.success({
        res: res,
        message: "Success",
        data: sortedCards.map(this.formatStripeCard)
      });
    } catch (error) {
      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async setDefaultAccount(req, res) {
    try {
      const userId = req.user._id;
      const { stripeCardId } = req.body;

      const account = await this.account.findOne({
        userId,
        stripeCardId
      });

      if (!account) {
        return handlers.response.failed({
          res: res,
          message: "Card not found."
        });
      }

      req.user.stripeDefaultCard = stripeCardId;
      if (typeof req.user.save === "function") await req.user.save();

      const stripeCustomerId = req.user.stripeCustomerId;

      if (!stripeCustomerId) {
        return handlers.response.failed({
          res: res,
          message: "Stripe customer ID not found."
        });
      }

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripeCardId
        }
      });

      const stripeCard = await stripe.paymentMethods.retrieve(stripeCardId);

      return handlers.response.success({
        res: res,
        message: "Success.",
        data: this.formatStripeCard(stripeCard)
      });
    } catch (error) {
      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  formatStripeCard(item) {
    return {
      id: item.id,
      brand: item.card?.brand,
      last4: item.card?.last4
    };
  }
}

module.exports = new Service();
