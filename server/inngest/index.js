 import { Inngest } from "inngest";
import User from "../models/User.js";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import sendEmail from "../configs/nodeMailer.js";
import Movie from "../models/Movie.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to MongoDB when a user is created in Clerk
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url
    };
    await User.create(userData);
  }
);

// Handling delete user event from Clerk
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

// Inngest function to update data in database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-with-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url
    };
    await User.findByIdAndUpdate(id, userData, { new: true, upsert: true });
  }
);

//inngest functions to cancel booking and release seats of show after 10 minutes of booking created if payment is not done 
const releaseSeatsandDeletebooking = inngest.createFunction(
    { id: 'relese-seats-delete-booking' },
    { event: 'app/checkpayment' },
    async ({ event, step }) => {
        const tenminutes = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('Wait-for-10-minutes', tenminutes);
        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);
            if (!booking.isPaid) {
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat) => {
                    return delete show.occupiedSeats[seat];
                })
                show.markModified('occupiedSeats');
                await show.save();
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)



const sendbookingEmail = inngest.createFunction(
    { id: "send-booking-confirmation-mail" },
    { event: 'app/show.booked' },
    async ({ event }) => {
        const { bookingId } = event.data;

        try {
            const booking = await Booking.findById(bookingId).populate({
                path: 'show',
                populate: {
                    path: 'movie',
                    model: 'Movie'
                }
            }).populate('user');

            if (!booking || !booking.user || !booking.show || !booking.show.movie) {
                console.warn(`Booking or related data missing for booking ID ${bookingId}`);
                return;
            }

            const showTime = new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata'
            });

            const showDate = new Date(booking.show.showDateTime).toLocaleDateString('en-US', {
                timeZone: 'Asia/Kolkata'
            });

            await sendEmail({
                to: booking.user.email,
                subject: `Payment confirmation: '${booking.show.movie.title}' booked!`,
                body: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🎟️ QuickShow Booking Confirmed!</h1>
          </div>

          <div style="padding: 24px; font-size: 16px; color: #333;">
            <h2 style="margin-top: 0;">Hi ${booking.user.name},</h2>
            <p>Your booking for <strong style="color: #7b2cbf;">"${booking.show.movie.title}"</strong> is confirmed.</p>

            <p>
              <strong>Date:</strong> ${showDate}<br>
              <strong>Time:</strong> ${showTime}
            </p>
            <p><strong>Booking ID:</strong> <span style="color: #7b2cbf;">${booking._id}</span></p>
            <p><strong>Seats:</strong> ${booking.bookedSeats?.join(', ') || 'N/A'}</p>

            <p>🎬 Enjoy the show and don’t forget to grab your popcorn!</p>
          </div>
          <img src="${booking.show.movie.poster_path}" alt="${booking.show.movie.title} Poster" style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 4px; margin-top: 16px;" />

          <div style="background-color: #f5f5f5; color: #777; padding: 16px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Thanks for booking with us!<br>— The QuickShow Team</p>
            <p style="margin: 4px 0 0;">📍 Visit us: <a href="/tobefix" style="color: #7b2cbf; text-decoration: none;">QuickShow</a></p>
          </div>
        </div>`
            });

        } catch (error) {
            console.error("Error in sendbookingEmail function:", error);
        }
    }
);

const sendNewMovieEmail = inngest.createFunction(
    { id: 'send-new-movie-notification' },
    { event: 'app/show.added' },
    async ({ event }) => {
        const { movieId } = event.data;
        const users = await User.find({});
        const movie = await Movie.findById(movieId);

        if(!movie) return "No movie found";

        for (const user of users) {
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 New Show Added: ${movie.title}`;
            const body = `<div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="background-color: #bf2c4cff; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Hi ${userName},</h1>
            </div>

            <div style="padding: 24px; color: #333;">
                <h2 style="margin-top: 0;">"${movie.title}" is Now Available on QuickShow!</h2>
                <p><strong>Release Date:</strong> ${movie.release_date}</p>
                <p><strong>Genre:</strong> ${movie.genres.map((genre) => genre).join(', ')}</p>
                <p>${movie.overview}</p>

                <img src="${movie.poster_path}" alt="${movie.title} Poster" style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 4px; margin-top: 16px;" />

                <div style="margin-top: 20px; text-align: center;">
                <a href="/" style="background-color: #bf2c40ff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🎟️ Book Your Tickets</a>
                </div>
            </div>

            <div style="background-color: #f5f5f5; color: #777; padding: 16px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">Thanks for staying with QuickShow!<br>We bring the cinema to your fingertips.</p>
                <p style="margin: 4px 0 0;">📍 Visit us: <a href="booking-ticket-app-omega.vercel.app" style="color: #bf2c4cff; text-decoration: none;">QuickShow</a></p>
            </div>
            </div>`

            await sendEmail({
                to : userEmail,
                subject,
                body,
            })
        }
        return {message : 'Notification sent'}
    }
)



// Export all Inngest functions
export const functions = [syncUserCreation,
   syncUserDeletion, 
   syncUserUpdation,
   releaseSeatsandDeletebooking,
   sendbookingEmail,
   sendNewMovieEmail

];
