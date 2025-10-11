 import React, { useState, useEffect } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import dateFormat from '../Library/dateFormat'
import TimeFormat from '../Library/TimeFormat'
import { useAppContext } from '../context/appContext'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { axios, getToken, user } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getBooking = async () => {
    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      })

      if (data.success) {
        setBookings(data.bookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to fetch bookings')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) {
      getBooking()
    }
  }, [user])

  if (isLoading) return <Loading />

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-32 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.length === 0 && (
        <p className="text-gray-400 mt-4">You have no bookings yet.</p>
      )}

      {bookings.map((item, index) => {
        const movie = item?.show?.movie
        const showDateTime = item?.show?.showDateTime
        // Handle both old and new field names for seats
        const bookedSeats = item?.bookedSeats || item?.bookedseats || []

        return (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            {/* Left side: Poster + Movie info */}
            <div className="flex gap-4">
              <img
                src={movie?.poster_path || '/placeholder.png'}
                alt={movie?.title || 'Movie Poster'}
                className="w-24 h-36 object-cover rounded-lg"
              />

              <div className="flex flex-col justify-between text-white text-sm">
                <p className="text-lg font-semibold">{movie?.title || 'Unknown Movie'}</p>
                <p className="text-gray-400 text-sm">
                  {movie?.runtime ? TimeFormat(movie.runtime) : 'Unknown Runtime'}
                </p>
                <p className="text-gray-400 text-sm mt-auto">
                  {showDateTime ? dateFormat(showDateTime) : 'Unknown Date'}
                </p>
              </div>
            </div>

            {/* Right side: Price + Booking info */}
            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-semibold mb-3">
                  {currency}{item?.amount || 0}
                </p>
                {!item.isPaid && <Link to={item.paymentLink} className='bg-primary
                px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer'>Pay Now</Link>
                }
              </div>
              <div className="text-sm">
                <p>
                  <span className="text-gray-400">Total Tickets :</span>{' '}
                  {bookedSeats.length}
                </p>
                <p>
                  <span className="text-gray-400">Seat Number :</span>{' '}
                  {bookedSeats.length > 0 ? bookedSeats.join(', ') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MyBookings
