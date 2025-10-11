 import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';

import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import showRouter from './routes/showRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import { stripeWebhooks } from './controllers/Stripewebhooks.js';

const app = express();
const port = 3000;

await connectDB();

app.use(cors());

//stripe webhooks route
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      await stripeWebhooks(req, res);
    } catch (err) {
      console.error("Stripe webhook route error:", err.message);
      res.status(500).end();
    }
  }
);
// Middlewares
app.use(express.json());
 
app.use(clerkMiddleware()); // Clerk middleware for authentication
 

// API routes
app.get('/', (req, res) => res.send("Hello from server"));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
