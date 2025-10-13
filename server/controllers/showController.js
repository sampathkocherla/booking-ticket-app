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

    // Check if movie already exists in DB
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      movie = await Movie.findById(movieId);
    } else {
      movie = await Movie.findOne({ imdbId: movieId });
    }

    // If not found, fetch from API
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

    // Prepare shows (with validation)
    const showsToCreate = [];

    for (const show of showsInput) {
      const datetimeString = `${show.date}T${show.time}`;
      const parsedDate = new Date(datetimeString);

      if (isNaN(parsedDate.getTime())) {
        console.warn("Skipping invalid show datetime:", datetimeString);
        continue; // skip invalid entries
      }

      showsToCreate.push({
        movie: movie._id,
        showDateTime: parsedDate,
        showprice: showprice,
        occupiedSeats: {},
      });
    }

    if (showsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid show datetimes found. Please check your input.",
      });
    }

    await Show.insertMany(showsToCreate);
//triger inngest event
    await inngest.send({
      name: "app/show.added",
      data: { movieId: movie._id },
    })

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

    // Find movie by ObjectId or IMDb ID
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

    // Fetch shows safely
    const shows = await Show.find({
      movie: movie._id,
      showDateTime: { $exists: true, $ne: null, $gte: new Date() },
    });

    const datetime = {};
    shows.forEach((show) => {
      if (!show.showDateTime || isNaN(new Date(show.showDateTime))) return;
      const date = new Date(show.showDateTime).toISOString().split("T")[0];
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
