 import { useEffect, useState } from 'react';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import BlurCircle from '../../components/BlurCircle';
import dateFormat from '../../Library/dateFormat';
import { useAppContext } from '../../context/AppContext';


const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;

    const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

   const getAllBookings = async () => {
    try {
      const { data } = await axios.get('/api/admin/all-bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Fetch bookings error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) getAllBookings();
  }, [user]);

  return !loading ? (
    <div className="w-full md:px-4 max-md:px-0 relative">
      <Title text1="List" text2="Bookings" />
      <BlurCircle top="0" left="0" />
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-auto border-collapse text-sm text-white rounded-lg overflow-hidden max-md:text-xs">
          <thead>
            <tr className="bg-primary/20 text-left whitespace-nowrap">
              <th className="p-3 text-base font-semibold min-w-[140px]">User Name</th>
              <th className="p-3 text-base font-semibold min-w-[120px]">Movie Name</th>
              <th className="p-3 text-base font-semibold min-w-[120px]">Show Time</th>
              <th className="p-3 text-base font-semibold min-w-[100px]">Seats</th>
              <th className="p-3 text-base font-semibold min-w-[100px]">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {bookings.map((booking, index) => {
              const seats = booking?.bookedSeats || []; // ✅ seats array
              const show = booking?.show || {};   // ✅ show object
              const movie = show?.movie || {};    // ✅ movie inside show
              const showTime = show?. showDateTime || ''; // ✅ datetime in assets
              const price = show?. showPrice || 0;
              const userName = booking?.user?.name || 'N/A'; // ✅ fixed

              return (
                <tr
                  key={index}
                  className="border-b border-primary/10 bg-primary/5 even:bg-primary/10 whitespace-nowrap"
                >
                  <td className="p-3 max-w-[180px] truncate">{userName}</td>
                  <td className="p-3 max-w-[180px] truncate">{movie?.title || 'N/A'}</td>
                  <td className="p-3 max-w-[160px] truncate">
                    {dateFormat(showTime).replace('•', ' at')}
                  </td>
                  <td className="p-3">{seats.join(', ')}</td>
                  <td className="p-3">
                    {currency} {seats.length * price}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default ListBookings;
