 import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Loading = () => {
  const { nextUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (nextUrl) {
      const timer = setTimeout(() => {
        navigate('/' + nextUrl);
      }, 8000);

      return () => clearTimeout(timer); // cleanup
    }
  }, [nextUrl, navigate]);

  return (
    <div className="flex justify-center items-center h-[100vh]">
      <div className="animate-spin rounded-full h-16 w-16 max-md:h-12 max-md:w-12 border-4 border-gray-300 border-t-primary"></div>
    </div>
  );
};

export default Loading;
