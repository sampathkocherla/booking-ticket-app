 import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loading from '../components/Loading'
import isoTimeFormat from '../Library/isoTimeFormat'
import { ClockIcon, ArrowRight } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import screenImage from "../assets/screenImage.svg"
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'


const SeatLayout = () => {
  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]
  const { id, date } = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const navigate = useNavigate()
  const { axios, getToken, user } = useAppContext()

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/getmovie/${id}`)
      if (data.success) {
        setShow({
          ...data.movie,
          dateTime: data.datetime
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select time first")
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast("You can only select 5 seats")
    }
    if (occupiedSeats.includes(seatId)) {
      return toast.error('Seat is already booked')
    }
    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    )
  }

  const renderSeats = (row, count = 9) => {
    return (
      <div key={row} className='w-full flex justify-center mb-3'>
        <div className='grid grid-cols-9 gap-1 sm:gap-2 md:gap-3'>
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`
            return (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                className={`aspect-square rounded border border-primary/60 text-xs md:text-base transition 
                  ${selectedSeats.includes(seatId) ? 'bg-primary text-white' : ''} 
                  w-8 md:w-8 lg:w-10 @max-xs:w-6 ${occupiedSeats.includes(seatId) ? 'opacity-30' : ''}`}
                title={seatId}
              >
                {seatId}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const getOccupiedSeatsFunc = async () => {
    try {
      const { data } = await axios.get(`/api/bookings/seats/${selectedTime.showId}`)
      if (data.success) {
        setOccupiedSeats(data.data)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const bookTickets = async () => {
    try {
      if (!user) return toast.error('Please log in to book seats')
      if (!selectedTime || selectedSeats.length === 0) {
        return toast.error('Select a time and at least one seat')
      }
      const { data } = await axios.post(
        '/api/bookings/create',
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) {
        window.location.href=data.url;
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getShow()
  }, [id])

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeatsFunc()
    }
  }, [selectedTime])

  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* Available Timings */}
      <div className='relative w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max min-xl:sticky xl:top-30 max-xl:mt-0'>
        <p className='text-lg font-semibold px-6'>Available Timings</p>
        <div className="px-6 space-y-2">
          {show.dateTime[date]?.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setSelectedTime(item)}
            >
              <ClockIcon className="w-4 h-4" />
              <p className={`text-sm ${selectedTime?.time === item.time ? 'font-bold text-primary' : ''}`}>
                {isoTimeFormat(item.time)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Seat layout */}
      <div className='relative flex flex-1 flex-col items-center max-md:mt-15'>
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className='text-3xl font-semibold mb-7'>Select your seat</h1>
        <img src={screenImage} alt="screen" />
        <p className='text-sm font-medium'>SCREEN SIDE</p>
        <div className='flex flex-col items-center mt-10 w-full text-white font-medium text-xs'>
          <div className='w-full'>{groupRows[0].map((row) => renderSeats(row))}</div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6 w-full'>
            {groupRows.slice(1).map((group, index) => (
              <div key={index} className='flex flex-col items-center w-full'>
                {group.map((row) => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>

        <div className='flex justify-center mt-10 max-md:mt-0'>
          <button
            onClick={bookTickets}
            className='flex gap-2 px-8 py-3 text-md bg-primary hover:bg-primary-dull rounded-full transition font-medium cursor-pointer max-md:px-5 max-md:text-sm my-5 max-md:pb-2'
          >
            Proceed to checkout
            <ArrowRight className='hover:translate-x-1 transition duration-300 max-md:w-5 max-md:pb-1' />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default SeatLayout
