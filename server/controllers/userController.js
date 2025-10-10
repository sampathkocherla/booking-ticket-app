 import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

/**
 * ================================
 *  Get User Bookings
 * ================================
 */
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("getUserBookings error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ================================
 *  Update Favorite Movies
 * ================================
 */
export const updateFavoriteMovie = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth?.userId;

    if (!userId || !movieId) {
      return res.status(400).json({ success: false, message: "User ID and Movie ID are required" });
    }

    const user = await clerkClient.users.getUser(userId);

    // Always store favorites as IMDB IDs for consistency
    const favorites = Array.isArray(user.privateMetadata?.favorites)
      ? [...user.privateMetadata.favorites]
      : [];

    // Toggle logic
    const index = favorites.indexOf(movieId);
    if (index === -1) {
      favorites.push(movieId);          // Add if not present
    } else {
      favorites.splice(index, 1);       // Remove if already exists
    }

    await clerkClient.users.updateUser(userId, {
      privateMetadata: { ...user.privateMetadata, favorites }
    });

    res.json({
      success: true,
      message: "Favorite movies updated successfully",
      favorites
    });
  } catch (error) {
    console.error("updateFavoriteMovie error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ================================
 *  Get Favorite Movies
 * ================================
 */
export const getFavoriteMovies = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);
    const favorites = Array.isArray(user.privateMetadata?.favorites)
      ? user.privateMetadata.favorites
      : [];

    // Try both imdbId and _id when fetching from DB
    const movies = await Movie.find({
      $or: [
        { imdbId: { $in: favorites } },      // If stored as IMDB IDs
        { _id: { $in: favorites } }          // If stored as MongoDB ObjectIDs
      ]
    });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("getFavoriteMovies error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
