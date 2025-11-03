 import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

// Check if the user is admin
export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

// API to get dashboard data
export const adminDashboarddata = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie");
    const totalUser = await User.countDocuments();

    const dashboarddata = {
      totalUser, // ✅ matches frontend
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      totalBookings: bookings.length,
      activeShows // ✅ matches frontend
    };

    res.json({ success: true, data: dashboarddata }); // ✅ matches frontend expectation
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows
export const getallshows = async (req, res) => {
  try {
    const showdata = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    res.json({ success: true, showdata });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all bookings
export const getbookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({
        path: "show",
        populate: {
          path: "movie"
        }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
