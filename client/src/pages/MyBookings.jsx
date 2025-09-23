 import React, { useState, useEffect } from 'react'
import { dummyBookingData } from '../assets/assets'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import dateFormat from '../Library/dateFormat'
import TimeFormat from '../Library/TimeFormat'

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getMyBookings = async () => {
    setBookings(dummyBookingData)
    setIsLoading(false)
  }

  useEffect(() => {
    getMyBookings()
  }, [])

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-32 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.map((item, index) => (
        <div
          key={index}
          className="flex flex-col md:flex-row justify-between
          bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
        >
          {/* Left side: Poster + Movie info */}
          <div className="flex gap-4">
            <img
              src={item.show.movie.poster_path}
              alt="Poster"
              className="w-24 h-36 object-cover rounded-lg"
            />

            <div className="flex flex-col justify-between text-white text-sm">
              <p className="text-lg font-semibold">{item.show.movie.title}</p>
              <p className="text-gray-400 text-sm">
                {TimeFormat(item.show.movie.runtime)}
              </p>
              <p className="text-gray-400 text-sm mt-auto">
                {dateFormat(item.show.showDateTime)}
              </p>
            </div>
          </div>

          {/* Right side: Price + Booking info */}
          <div className="flex flex-col md:items-end md:text-right justify-between p-4">
  <div className="flex items-center gap-4">
    <p className="text-2xl font-semibold mb-3">
      {currency}{item.amount}
    </p>
    {!item.isPaid && (
      <button className="px-4 py-1.5 mb-2 text-sm bg-primary hover:bg-primary-dull rounded-full transition font-medium cursor-pointer">
        Pay Now
      </button>
    )}
  </div>
  <div className="text-sm">
    <p>
  <span className="text-gray-400">Total Tickets :</span>{' '}
  {item.bookedSeats.length}
</p>
<p>
  <span className="text-gray-400">Seat Number :</span>{' '}
  {item.bookedSeats.join(', ')}
</p>
  </div>
</div>

        </div>
      ))}
    </div>
  ) : (
    <Loading />
  )
}

export default MyBookings
