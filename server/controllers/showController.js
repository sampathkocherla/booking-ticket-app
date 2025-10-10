 import axios from "axios";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

/* -------------------------------
   GET NOW-PLAYING MOVIES (API)
-------------------------------- */
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://imdb236.p.rapidapi.com/api/imdb/most-popular-movies",
      {
        headers: {
          "x-rapidapi-host": "imdb236.p.rapidapi.com",
          "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
        },
      }
    );

    if (!Array.isArray(data)) {
      return res
        .status(500)
        .json({ success: false, message: "Invalid response from API" });
    }

    const movies = data.map((m) => ({
      id: m.id,
      title: m.primaryTitle,
      release_date: m.releaseDate || m.startYear || null,
      overview: m.description || "No description available",
      vote_average: m.averageRating || null,
      poster_path: m.primaryImage || null,
    }));

    res.json({ success: true, movies });
  } catch (error) {
    console.error("getNowPlayingMovies error:", error.message);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

/* -------------------------------
   ADD A NEW SHOW
-------------------------------- */
export const addshow = async (req, res) => {
  try {
    const { movieId, showsInput, showprice } = req.body;

    if (!movieId) {
      return res
        .status(400)
        .json({ success: false, message: "Movie ID is required" });
    }

    let movie = null;

    // Check if movie already exists in our DB
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      movie = await Movie.findById(movieId);
    } else {
      movie = await Movie.findOne({ imdbId: movieId });
    }

    // If not found in DB → fetch from RapidAPI
    if (!movie) {
      const moviedataResponse = await axios.get(
        `https://imdb236.p.rapidapi.com/api/imdb/${movieId}`,
        {
          headers: {
            "x-rapidapi-host": "imdb236.p.rapidapi.com",
            "x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
          },
        }
      );

      const moviedata = moviedataResponse.data;

      if (!moviedata || !moviedata.id) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found in API" });
      }

      movie = await Movie.create({
        imdbId: moviedata.id,
        title: moviedata.primaryTitle || moviedata.originalTitle,
        release_date: moviedata.releaseDate || moviedata.startYear || null,
        overview: moviedata.description || "No description available",
        vote_average: moviedata.averageRating || null,
        poster_path: moviedata.primaryImage || null,
        backdrop_path: moviedata.primaryImage || null,
        genres: moviedata.genres || [],
        casts: moviedata.cast || [],
        runtime: moviedata.runtimeMinutes || null,
        numVotes: moviedata.numVotes || 0,
        trailer: moviedata.trailer || null,
        thumbnails: moviedata.thumbnails || [],
        original_language: Array.isArray(moviedata.spokenLanguages)
          ? moviedata.spokenLanguages[0]
          : moviedata.spokenLanguages || "unknown",
      });
    }

    // Validate showsInput
    if (!Array.isArray(showsInput) || showsInput.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Shows input is required" });
    }

    // Prepare shows
    const showsToCreate = showsInput.map((show) => {
      const datetimeString = `${show.date}T${show.time}`;
      return {
        movie: movie._id,
        showDateTime: new Date(datetimeString),
        showprice: showprice,
        occupiedSeats: {},
      };
    });

    await Show.insertMany(showsToCreate);

    await inngest.send({
      name: "app/show.added",
      data: { movieId: movie._id },
    });

    res.json({ success: true, message: "Show(s) added successfully." });
  } catch (error) {
    console.error("addshow error:", error.message);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

/* -------------------------------
   GET ALL UPCOMING SHOWS
-------------------------------- */
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows: shows || [] });
  } catch (error) {
    console.error("getShows error:", error.message);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

/* -------------------------------
   GET SINGLE MOVIE + ITS SHOWS
-------------------------------- */
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (!movieId) {
      return res
        .status(400)
        .json({ success: false, message: "Movie ID is required" });
    }

    let movie = null;

    // Try finding in DB
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      movie = await Movie.findById(movieId);
    } else {
      movie = await Movie.findOne({ imdbId: movieId });
    }

    if (!movie) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    const shows = await Show.find({
      movie: movie._id,
      showDateTime: { $gte: new Date() },
    });

    const datetime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!datetime[date]) datetime[date] = [];
      datetime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, datetime });
  } catch (error) {
    console.error("getShow error:", error.message);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};
