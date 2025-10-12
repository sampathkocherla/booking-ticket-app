 import Stripe from "stripe";
import Booking from "../models/Booking.js";

export const stripeWebhooks = async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;  

  let event;

  try {
    // Stripe requires the raw body to verify the signature
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    console.log("Webhook verified:", event.type);
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Fetch Checkout Session linked to this payment intent
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessions.data[0];
        if (!session) {
          console.warn("⚠️ No session found for payment intent:", paymentIntent.id);
          break;
        }

        const { bookingId } = session.metadata || {};
        if (!bookingId) {
          console.warn("⚠️ No bookingId found in session metadata.");
          break;
        }

        // ✅ Update booking status in DB
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: "",
        });

        await inngest.send({
          name:"app/show.booked",
          data:{bookingId}
        })

        console.log(`✅ Booking ${bookingId} marked as paid.`);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
        break;
    }

    response.json({ received: true });
  } catch (error) {
    console.error("💥 Webhook processing error:", error);
    response.status(500).send("Internal Server Error");
  }
};
