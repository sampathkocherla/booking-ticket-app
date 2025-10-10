 import Show from "../models/Show.js";
import Booking from "../models/Booking.js"; // <-- Missing in your code
import stripe from 'stripe'
/**
 * Check if the selected seats are available for a given show
 */
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};
    const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

    return !isAnySeatTaken; // true if all seats are free
  } catch (error) {
    console.error("checkSeatsAvailability error:", error.message);
    return false;
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (req, res) => {
  try {
    const userId = req.auth?.userId;              // <-- safer than destructuring
    const { showId, selectedSeats } = req.body;
    const{origin}=req.headers;

    if (!userId || !showId || !selectedSeats?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check seat availability
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected seats are already booked. Please choose another seat."
      });
    }

    // Get show details
    const showData = await Show.findById(showId).populate("movie");
    if (!showData) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    // Create booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showprice * selectedSeats.length,
      bookedSeats: selectedSeats
    });

    // Mark seats as occupied
    selectedSeats.forEach(seat => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");
    await showData.save();

    // TODO: integrate Stripe gateway if needed
    const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY)

   //CREATING LINE ITEMS
   const line_items=[{
    price_data:{
      currency:'usd',
      product_data:{
        name:showData.movie.title
      },
      unit_amount:Math.floor(booking.amount)*100
    },
    quantity:1
   }]
     const session=await stripeInstance.checkout.sessions.create({
      success_url:`${origin}/loading/my-bookings`,
      cancel_url:`${origin}/my-bookings`,
      line_items:line_items,
      mode:'payment',
      metadata:{
        bookingId:booking._id.toString()

      },
      expires_at:Math.floor(Date.now()/1000)+30*60,//expires in 30min
     })
    booking.paymentLink=session.url
    await booking.save()



    res.json({ success: true,url:session.url });
  } catch (error) {
    console.error("createBooking error:", error.message);
    res.status(500).json({ success: false, message: "Booking failed" });
  }
};

/**
 * Get all occupied seats for a show
 */
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);
    if (!showData) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});
    res.json({
      success: true,
      message: "Occupied seats fetched successfully",
      data: occupiedSeats
    });
  } catch (error) {
    console.error("getOccupiedSeats error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch occupied seats" });
  }
};
