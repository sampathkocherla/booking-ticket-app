 import { StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TimeFormat from '../Library/TimeFormat';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  // Return null if movie object is missing
  if (!movie) return null;

  const movieId = movie._id || movie.id; // Support both DB and API IDs
  const poster = movie.poster_path || '/fallback-image.jpg';
  const title = movie.title || 'No Title';
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
  const genres = Array.isArray(movie.genres)
    ? movie.genres.slice(0, 2).map((g) => (g.name ? g.name : g)).join(' | ')
    : '';
  const runtime = movie.runtime ? TimeFormat(movie.runtime) : '';
  const rating = movie.vote_average || 'N/A';

  return (
    <div
      className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66 cursor-pointer'
      onClick={() => { navigate(`/movies/${movieId}`); scrollTo(0, 0); }}
    >
      <img
        src={poster}
        alt={title}
        className='rounded-lg h-52 w-full object-cover'
      />

      <p className='font-semibold mt-2'>{title}</p>

      <p className='text-sm text-gray-400 mt-2'>
        {releaseYear} • {genres} • {runtime}
      </p>

      <div className="flex items-center justify-between mt-4 pb-3">
        <button
          className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull rounded-full transition font-medium'
          onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movieId}`); scrollTo(0, 0); }}
        >
          Buy Tickets
        </button>

        <p className='flex items-center gap-1 mt-2 text-sm text-gray-400 pr-1'>
          <StarIcon className='h-4 w-4 text-primary fill-primary' />
          {rating}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;
