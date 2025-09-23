 import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { dummyDateTimeData, dummyShowsData } from '../assets/assets'

const MovieDetails = () => {
  const { id } = useParams()
  const [show, setShow] = useState(null)

  useEffect(() => {
    const foundShow = dummyShowsData.find(item => item._id === id)
    console.log("URL id:", id)
    console.log("Found show:", foundShow)
    if (foundShow) {
      setShow({
        movie: foundShow,
        date: dummyDateTimeData,
      })
    }
  }, [id])

  if (!show) {
    return <p className="text-center text-red-500 mt-10">Loading or Not Found...</p>
  }

  return (
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold">{show.movie.title}</h1>
      <p>{show.movie.overview}</p>
    </div>
  )
}

export default MovieDetails
