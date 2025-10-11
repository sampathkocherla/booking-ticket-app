 import Stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;
  try {
    // Stripe requires the raw body for signature verification
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY
    );
  } catch (error) {
    console.error("⚠️ Webhook signature verification failed:", error.message);
    return response.status(400).send(`Webhook error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Find Checkout session linked to this payment intent
        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        if (!session) {
          console.warn("No session found for payment intent:", paymentIntent.id);
          break;
        }

        const { bookingId } = session.metadata || {};
        if (!bookingId) {
          console.warn("No bookingId found in session metadata.");
          break;
        }

        // ✅ Mark booking as paid
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: "",
        });

        console.log(`✅ Booking ${bookingId} marked as paid.`);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }

    response.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    response.status(500).send("Internal Server Error");
  }
};
