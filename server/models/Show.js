
import mongoose from "mongoose";
const showSchema=new mongoose.Schema(
    {
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },  // ✅ reference by ObjectId
  showDateTime: { type: Date, required: true },
  showprice: Number,
  occupiedSeats: { type: Object, default: {} },

    },{minimize:false}
)
 const Show=mongoose.model("Show",showSchema);
    export default Show;