 import { ChartLineIcon, IndianRupeeIcon, PlayCircleIcon, UsersIcon, StarIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import BlurCircle from '../../components/BlurCircle'
import dateFormat from '../../Library/dateFormat'

import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
const Dashboard = () => {
    const { axios, getToken, user } = useAppContext();
  
  const currency = import.meta.env.VITE_CURRENCY
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [], // ✅ matches assets.js
    totalUser: 0     // ✅ matches assets.js
  })
  const [loading, setLoading] = useState(true)

  const dashboardCards = [
    {
      title: 'Total Bookings',
      value: dashboardData.totalBookings || 0,
      icon: ChartLineIcon
    },
    {
      title: 'Total Revenue',
      value: `${currency} ${dashboardData.totalRevenue?.toLocaleString?.() || 0}`,
      icon: IndianRupeeIcon
    },
    {
      title: 'Active Shows',
      value: dashboardData.activeShows?.length || 0, // ✅ safe optional chaining
      icon: PlayCircleIcon
    },
    {
      title: 'Total Users',
      value: dashboardData.totalUser || 0, // ✅ matches assets.js
      icon: UsersIcon
    }
  ]

  const fetchDashboardData = async () => {
     try{
      const {data}=await axios.get("/api/admin/dashboard",{headers:{
        Authorization:`Bearer ${await getToken()}`
      }})
      if(data.success){
        setDashboardData(data.data)
        setLoading(false)
      }else{
        toast.error(data.message)
      }
     }catch(error){
      toast.error("Failed to fetch dashboard data",error)
     }
  };

  useEffect(() => {
     if(user){
      fetchDashboardData()
     }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      <div className="relative">
        <BlurCircle top="0" left="0" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 min-lg:grid-cols-4 gap-6 max-md:gap-1 mt-8 max-md:pl-5 max-sm:pl-0">
        {dashboardCards.map((data, index) => (
          <div
            key={index}
            className="flex justify-between rounded-lg bg-primary/10 border-2 border-primary/20"
          >
            <div className="flex flex-col py-4 items-start justify-center pr-5 pl-4">
              <p className="text-sm">{data.title}</p>
              <p className="text-2xl font-semibold pt-1 max-md:text-xl">{data.value}</p>
            </div>
            <div className="flex items-center justify-center pr-3">
              <data.icon className="w-7 h-7" aria-label={data.title} />
            </div>
          </div>
        ))}
      </div>

      {/* Active Shows */}
      <p className="mt-10 text-xl font-semibold">Active Shows</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8 px-2 sm:px-5">
        {dashboardData.activeShows?.length > 0 ? (
          dashboardData.activeShows
            .filter(movie => movie?.movie?.poster_path && movie?.movie?.title)
            .map((show, index) => (
              <div
                key={index}
                className="flex flex-col rounded-lg bg-primary/10 border-2 border-primary/20 overflow-hidden shadow-md hover:-translate-y-1 transition duration-300"
              >
                <img
                  src={show.movie.poster_path || '/default-poster.jpg'}
                  alt="poster"
                  className="w-full h-64 object-cover"
                />
                <p className="pt-3 px-3 text-lg font-semibold text-white">
                  {show.movie.title.length > 25
                    ? show.movie.title.slice(0, 25) + '...'
                    : show.movie.title}
                </p>
                <div className="flex justify-between mt-2 px-3 text-white">
                  <p className="text-lg font-medium">
                    {currency} {show.showprice}
                  </p>
                  <p className="flex items-center gap-1 text-gray-300 text-sm">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {show.movie.vote_average ?? 'N/A'}
                  </p>
                </div>
                <p className="px-3 py-3 text-sm text-gray-500">
                  {dateFormat(show.showDateTime).replace('•', ' at')}
                </p>
              </div>
            ))
        ) : (
          <p className="text-white">No active shows found.</p>
        )}
      </div>
    </>
  ) : (
    <Loading />
  )
}

export default Dashboard
