// src/pages/NotAuthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotAuthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 text-center p-6">
      <div>
        <h1 className="text-3xl font-bold text-red-700 mb-4">🚫 Access Denied</h1>
        <p className="text-lg text-red-600 mb-4">You are not authorized to view this page.</p>
        <Link
          to="/"
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotAuthorized;

