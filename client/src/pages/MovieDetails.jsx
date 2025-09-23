 import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyDateTimeData, dummyShowsData } from '../assets/assets'
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import { assets } from '../assets/assets'
import TimeFormat from '../Library/TimeFormat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'

const MovieDetails = () => {
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const foundShow = dummyShowsData.find(item => item._id === id)
    if (foundShow) {
      setShow({ movie: foundShow, date: dummyDateTimeData })
    } else {
      setNotFound(true) // 👈 no movie found
    }
  }, [id])

  if (notFound) {
    // Movie not found → show loader then redirect to home
    return <Loading nextUrl="/" />
  }

  if (!show) {
    // Still loading → show loader
    return <Loading />
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-28 md:pt-32">
      {/* Movie Poster + Info */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={show.movie.poster_path}
          alt={show.movie.title}
          className="max-md:mx-auto rounded-xl h-[26rem] max-w-[17.5rem] object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)}
            <span className="ml-1">User Rating</span>
          </div>

          <p className="text-gray-400 mt-2 text-sm md:text-base leading-tight max-w-xl">
            {show.movie.overview}
          </p>
          <p className="text-gray-400 text-sm">
            {TimeFormat(show.movie.runtime)} •{' '}
            {show.movie.genres.map(g => g.name).join(', ')} •{' '}
            {show.movie.release_date.split('-')[0]}
          </p>

          {/* Buttons */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            {/* Watch Trailer */}
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>

            {/* Buy Tickets → scroll to DateSelect */}
            <button
              onClick={() =>
                document.getElementById('date-select')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </button>

            {/* Add to favorites */}
            <button className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <img
                src={cast.profile_path}
                alt={cast.name}
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Date Select */}
      <div id="date-select" className="scroll-mt-24">
        <DateSelect datetime={show.date} id={id} />
      </div>

      {/* You May Also Like */}
      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {dummyShowsData.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>

      {/* Show More Button */}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate(`/movies`)
            scrollTo(0, 0)
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  )
}

export default MovieDetails
