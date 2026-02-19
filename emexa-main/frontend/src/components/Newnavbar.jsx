import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      {/* Logo Section */}
      <div className="flex items-center space-x-2">
        <div className="text-yellow-500 text-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 00-3.16 19.47c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.14-1.1-1.44-1.1-1.44-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-800">EMEXA</span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex space-x-6">
        <a href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</a>
        <a href="/courses" className="text-gray-600 hover:text-blue-600">Courses</a>
        <a href="/assignments" className="text-gray-600 hover:text-blue-600">Assignments</a>
        <a href="/grades" className="text-gray-600 hover:text-blue-600">Grades</a>
      </div>

      {/* User Section */}
      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-blue-600">
          <i className="fas fa-bell"></i>
        </button>
        <button className="text-gray-600 hover:text-blue-600">
          <i className="fas fa-question-circle"></i>
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">J</div>
          <span className="text-gray-800 font-medium">Jehan</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
