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

// ✅ Connect to MongoDB
await connectDB();

app.use(cors());

 
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }), // raw body for signature check
  async (req, res) => {
    try {
      await stripeWebhooks(req, res);
    } catch (err) {
      console.error("Stripe webhook route error:", err.message);
      res.status(500).end();
    }
  }
);
app.use(express.json());
app.use(clerkMiddleware()); // Clerk auth middleware

 
app.get('/', (req, res) => res.send("Hello from server"));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
 

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
