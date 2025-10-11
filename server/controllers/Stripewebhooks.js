 import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;
  try {
    // ⚠️ Body must be raw (see server.js setup)
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY
    );
    console.log("✅ Webhook verified:", event.type);
  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("💰 Payment succeeded for intent:", paymentIntent.id);

        // Find associated checkout session (for metadata)
        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });

        const session = sessions.data[0];
        if (!session) {
          console.warn("⚠️ No session found for payment intent:", paymentIntent.id);
          break;
        }

        console.log("🔹 Session metadata:", session.metadata);

        const bookingId = session.metadata?.bookingId;
        if (!bookingId) {
          console.warn("⚠️ Missing bookingId in session metadata");
          break;
        }

        // Update booking in DB
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { isPaid: true, paymentLink: "" },
          { new: true }
        );

        if (updatedBooking) {
          console.log("✅ Booking marked as paid:", updatedBooking._id.toString());
        } else {
          console.error("❌ Booking not found:", bookingId);
        }

        // (Optional) send confirmation email here with nodemailer
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }

    // Respond quickly to Stripe (to avoid retry)
    response.json({ received: true });
  } catch (error) {
    console.error("⚠️ Webhook processing error:", error.message);
    response.status(500).send("Internal Server Error");
  }
};
