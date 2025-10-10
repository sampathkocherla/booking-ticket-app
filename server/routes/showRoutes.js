
import express from "express";
import { addshow, getNowPlayingMovies, getShow, getShows } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";
const showRouter=express.Router();

showRouter.get("/now-playing",  getNowPlayingMovies);
showRouter.post("/addshow",addshow)
showRouter.get("/all",getShows);
showRouter.get("/getmovie/:movieId",getShow);
export default showRouter;