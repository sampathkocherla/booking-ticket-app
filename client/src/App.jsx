 import React from 'react'
import { Route, Routes ,useLocation} from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MyBookings from './pages/MyBookings'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import NavBar from './components/NavBar'
import Favorite from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import ListBookings from './pages/admin/ListBookings'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'

const App = () => {
  const isAdminRoute=useLocation().pathname.startsWith("/admin")
  return (
    <div>
      <Toaster/>
      {!isAdminRoute &&<NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/movies/:id/:date" element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />   
        <Route path="/favorite" element={<Favorite />} /> 
        <Route path="/admin/*" element={<Layout/>}>
        <Route index element={<Dashboard/>}/>
        <Route path="add-shows" element={<AddShows/>}/>
        <Route path="list-shows" element={<ListShows/>}/>
        <Route path="list-bookings" element={<ListBookings/>}/>

        </Route>

      </Routes>
       {!isAdminRoute &&<Footer />}
        
    </div>
  )
}

export default App
