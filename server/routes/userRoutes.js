 // backend/Routes/userRouter.js
import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  getUserBookings,
  updateFavoriteMovie,
  getFavoriteMovies
} from '../controllers/userController.js';

const userRouter = express.Router();

// ✅ Protect all user routes
userRouter.get('/bookings', requireAuth(), getUserBookings);
userRouter.post('/updatefavorites', requireAuth(), updateFavoriteMovie);
userRouter.get('/favorites', requireAuth(), getFavoriteMovies);

export default userRouter;
