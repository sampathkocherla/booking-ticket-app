 import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { isAdmin, adminDashboarddata, getallshows, getbookings } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get("/is-admin", protectAdmin, isAdmin);
adminRouter.get("/dashboard", protectAdmin, adminDashboarddata);
adminRouter.get("/all-shows", protectAdmin, getallshows);
adminRouter.get("/all-bookings", protectAdmin, getbookings);

export default adminRouter;
