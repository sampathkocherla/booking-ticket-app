 import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth, useUser } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Fetch admin status
  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsAdmin(data.isAdmin);
      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        toast.error("You are not authorized to access admin dashboard");
        navigate("/");
      }
    } catch (error) {
      console.error("Admin check error:", error.response?.data || error.message);
      setIsAdmin(false);
    }
  };

  // ✅ Fetch all shows
  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");
      if (data.success) setShows(data.shows);
      else toast.error(data.message);
    } catch {
      toast.error("Failed to load shows");
    }
  };

  // ✅ Fetch user favorites
  const fetchFavorites = async () => {
    try {
      if (!user || !authLoaded) return;
      const token = await getToken();
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setFavorites(data.movies || []);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      toast.error("Failed to load favorites");
    }
  };

  // ✅ Only fetch admin if on /admin route and user is loaded
  useEffect(() => {
    if (userLoaded && authLoaded && user && location.pathname.startsWith("/admin")) {
      fetchIsAdmin();
    }
  }, [location.pathname, userLoaded, authLoaded, user]);

  // ✅ Fetch favorites when user or auth is ready
  useEffect(() => {
    if (userLoaded && authLoaded && user) {
      fetchFavorites();
    } else {
      setFavorites([]); // clear when logged out
    }
  }, [userLoaded, authLoaded, user]);

  // ✅ Fetch shows once
  useEffect(() => {
    fetchShows();
  }, []);

  return (
    <AppContext.Provider
      value={{
        axios,
        user,
        navigate,
        isAdmin,
        getToken,
        fetchIsAdmin,
        fetchFavorites,
        favorites,
        setFavorites,
        shows,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
