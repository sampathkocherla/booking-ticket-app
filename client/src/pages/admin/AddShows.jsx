 import { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from "../../components/admin/Title";
import BlurCircle from '../../components/BlurCircle';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
import kConverter from '../../Library/kConverter';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const Addshow = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState('');
  const [showprice, setShowPrice] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Fetch movies
  const fetchnowplaying = async () => {
  try {
    setLoading(true);
    const { data } = await axios.get("/api/show/now-playing", {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    if (data.success && Array.isArray(data.movies)) {
      setNowPlayingMovies(data.movies);
    } else {
      setNowPlayingMovies([]);        // prevent undefined
      toast.error(data.message || "No movies available");
    }
  } catch (err) {
    console.error("Fetch error:", err);
    toast.error("Failed to fetch movies");
    setNowPlayingMovies([]);          // also keep it safe here
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (user) fetchnowplaying();
  }, [user]);

  // ✅ Handle adding date-time
  const handledatetime = () => {
    if (!selectedMovie) return toast.error('Select a movie');
    if (!showprice) return toast.error('Enter show price');
    if (!dateTimeInput) return toast.error('Select date and time');

    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return toast.error('Invalid date or time');

    setDateTimeSelection(prev => {
      const times = prev[date] || [];
      if (!times.includes(time)) return { ...prev, [date]: [...times, time] };
      return prev;
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection(prev => {
      const filteredTimes = prev[date].filter(t => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleadd = async () => {
    try {
      if (!selectedMovie || !showprice)
        return toast.error('Missing required fields');

      const showsInput = Object.entries(dateTimeSelection).flatMap(
        ([date, times]) => times.map(time => ({ date, time }))
      );

      const payload = {
        movieId: selectedMovie,
        showsInput,
        showprice: Number(showprice),
      };

      const { data } = await axios.post('/api/show/addshow', payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success('Show added successfully');
        setSelectedMovie(null);
        setDateTimeInput('');
        setDateTimeSelection({});
        setShowPrice('');
      } else {
        toast.error(data.message || 'Failed to add show');
      }
    } catch (error) {
      console.error('Add show error:', error);
      toast.error('An error occurred, please try again');
    }
  };

  // ✅ Show loading spinner
  if (loading) return <Loading />;

  return nowPlayingMovies.length > 0 ? (
    <div className="px-4 sm:px-6 lg:px-8">
      <Title text1="Add" text2="Shows" />
      <BlurCircle top="100px" left="250px" />

      {/* Movies list */}
      <p className="mt-8 font-medium text-lg">Now Playing Movies</p>
      <div className="grid gap-4 mt-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {nowPlayingMovies.slice(0, 22).map((movie, index) => (
          <div
            key={index}
            className={`rounded-lg relative cursor-pointer hover:-translate-y-1.5 transition`}
            onClick={() =>
              !selectedMovie
                ? setSelectedMovie(movie.id)
                : selectedMovie !== movie.id
                ? setSelectedMovie(movie.id)
                : setSelectedMovie(null)
            }
          >
            <div className="relative">
              <img
                src={movie.poster_path}
                alt="poster"
                className="w-full object-cover brightness-90 rounded-lg"
              />
              <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full rounded-b-lg absolute bottom-0 left-0">
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <StarIcon className="w-4 h-4 text-primary fill-primary" />
                  <p>{movie.vote_average}</p>
                </div>
                
                {selectedMovie === movie.id && (
                  <div className="absolute -top-6 right-2 flex items-center justify-center bg-primary h-5 w-5 rounded-md">
                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5}/>
                  </div>
                )}
              </div>
            </div>
            <p className="text-base font-semibold truncate mt-2">
              {movie.title}
            </p>
            <p className="text-sm text-gray-400">{movie.release_date}</p>
          </div>
        ))}
      </div>

      {/* Price input */}
      <div className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-medium">Show Price</label>
          <div className="mt-2 flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md w-full max-w-sm">
            <p className="text-gray-400">{currency}</p>
            <input
              min="0"
              placeholder="Enter show price"
              className="flex-1 font-medium outline-none bg-transparent text-white"
              type="number"
              value={showprice}
              onChange={e => setShowPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Date-Time Picker */}
        <div>
          <label className="text-sm font-medium">Select Date and Time</label>
          <div className="mt-2 flex gap-3 items-center border border-gray-600 p-2 rounded-lg max-w-sm">
            <input
              className="outline-none rounded-md font-medium text-white bg-transparent flex-1"
              type="datetime-local"
              value={dateTimeInput}
              onChange={e => setDateTimeInput(e.target.value)}  // ✅ fixed
            />
            <button
              className="bg-primary/80 text-white px-4 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
              onClick={handledatetime}
            >
              Add Time
            </button>
          </div>
        </div>
      </div>

      {/* Selected Date-Time */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xl font-semibold">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium text-white">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map(time => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded text-white bg-primary/10"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-violet-500 hover:text-violet-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="flex items-center justify-center px-5 py-2 mt-5 bg-primary hover:bg-primary-dull rounded-lg font-medium cursor-pointer"
        onClick={handleadd}
      >
        Add Show
      </button>
    </div>
  ) : (
    <div className="p-6 text-center text-gray-400">No movies found.</div>
  );
};

export default Addshow;
