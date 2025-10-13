 import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, PlayCircleIcon, Star, ArrowRight } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import TimeFormat from "../Library/TimeFormat";

const MovieDetails = () => {
  const { shows, axios, getToken, user, fetchFavorites, favorites } = useAppContext();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const getMovie = async () => {
    try {
      const { data } = await axios.get(`/api/show/getmovie/${id}`);
      if (data.success) {
        setShow({ movie: data.movie, datetime: data.datetime });
      } else {
        toast.error(data.message || "Failed to load movie details");
      }
    } catch (error) {
      toast.error("Failed to fetch movie details.");
    }
  };

  useEffect(() => {
    getMovie();
  }, [id]);

  useEffect(() => {
    if (!favorites) return;
    const favArray = Array.isArray(favorites.movies) ? favorites.movies : [];
    setIsFavorite(favArray.some(favId => favId?.toString() === id?.toString()));
  }, [favorites, id]);

  const handleDate = () => {
    toast("Please choose a date");
  };

  const handleFavorite = async () => {
    if (!user) return toast.error("Please login to proceed");

    setIsFavorite(prev => !prev);

    try {
      const { data } = await axios.post(
        "/api/user/updatefavorites",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavorites();
        toast.success(data.message);
      } else {
        setIsFavorite(prev => !prev);
        toast.error(data.message);
      }
    } catch (error) {
      setIsFavorite(prev => !prev);
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  };

  if (!show) {
    return <Loading />;
  }

  const { movie, datetime } = show;
  const genres = Array.isArray(movie?.genres) ? movie.genres.join(", ") : "";
  const runtime = movie?.runtime ? TimeFormat(movie.runtime) : "";
  const poster = movie?.poster_path || "/fallback-image.jpg";
  const title = movie?.title || "Unknown Title";
  const vote = movie?.vote_average || "N/A";

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-20 py-12 mt-28 max-md:mt-15 overflow-hidden">
      {/* Movie Details Section */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <img
          src={poster}
          alt="Poster"
          className="rounded-xl w-[250px] h-[370px] md:w-[320px] md:h-[450px] object-cover shadow-lg"
          onError={(e) => { e.target.src = "/fallback-image.jpg"; }}
        />

        <div className="text-white relative flex flex-col gap-4 max-w-xl">
          <BlurCircle top="0px" left="50px" />
          <p className="text-xl uppercase text-primary font-medium">
            {movie?.original_language?.includes("en") && "English"}
          </p>

          <h1 className="text-4xl font-bold leading-snug">{title}</h1>

          <div className="flex items-center gap-2">
            <Star className="fill-primary text-primary w-5 h-5" />
            <p className="text-md text-gray-200">{vote} User Rating</p>
          </div>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed">{movie?.overview || "No overview available"}</p>

          <p className="text-sm text-gray-100 font-medium">
            {runtime} • {genres} • {movie?.release_date ? new Date(movie.release_date).getFullYear() : ""}
          </p>

          <div className="flex flex-wrap gap-4 mt-4 max-md:gap-2">
            <a
              href={movie?.trailer || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center px-5 py-2 bg-gray-700 hover:bg-gray-800 transition rounded-lg text-sm font-medium max-md:px-3"
            >
              <PlayCircleIcon className="w-5 h-5 mr-2" /> Watch Trailer
            </a>

            <a
              href="#cast"
              onClick={handleDate}
              className="px-6 pt-3 bg-primary hover:bg-primary-dull transition rounded-lg text-sm font-medium max-md:px-4"
            >
              Buy Tickets
            </a>

            <button
              className="p-3 bg-gray-600 rounded-full cursor-pointer"
              onClick={handleFavorite}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "text-primary fill-primary" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <p className="text-gray-300 font-medium text-lg mt-24 mb-4 max-md:text-base max-md:mt-15">Movie Cast</p>
      <div id="cast" className="overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-5 w-max px-1 pb-2">
          {Array.isArray(movie?.casts) && movie.casts.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center min-w-[80px]">
              <img
                src={cast?.primaryImage || "no-cast.jpg"}
                alt={cast?.name || cast?.fullName || "Unknown"}
                className="rounded-full h-20 w-20 md:h-24 md:w-24 object-cover"
              />
              <p className="text-xs md:text-sm text-white mt-2 font-medium truncate w-20">
                {cast?.fullName || cast?.name || "Unknown"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Date Selector */}
      {datetime && <DateSelect datetime={datetime} id={id} />}

      {/* Suggested Movies */}
      <div className="px-6 md:px-8 lg:px-16 xl:px-20 overflow-hidden py-10 max-md:py-0">
        <div className="relative flex items-center justify-between pt-20 pb-5 pl-10 text-lg max-md:pl-0">
          <BlurCircle top="0" right="-40px" />
          <p className="text-gray-300 font-medium max-md:text-sm text-lg">You May Also Like</p>

          <button
            onClick={() => navigate("/movies")}
            className="group flex items-center gap-2 pr-20 max-md:pr-0 text-sm max-md:text-sm text-gray-300 cursor-pointer"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mt-8">
          {shows?.filter(s => s?.movie)?.slice(0, 4).map((s) => (
            <MovieCard key={s._id} movie={s.movie} />
          ))}
        </div>

        <div className="flex justify-center mt-10 max-md:mt-0">
          <button
            onClick={() => { scrollTo(0, 0); navigate("/movies"); }}
            className="px-10 py-3 text-md bg-primary hover:bg-primary-dull rounded-full transition font-medium cursor-pointer max-md:px-5 max-md:text-sm my-5"
          >
            Show more
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
