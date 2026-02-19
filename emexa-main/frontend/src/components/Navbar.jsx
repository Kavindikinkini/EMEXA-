import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Height of navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="shadow-sm fixed top-0 w-full bg-white z-10">
      <div className="mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <line x1="50" y1="8" x2="50" y2="18" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="72" y1="15" x2="65" y2="22" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="79" y1="37" x2="69" y2="37" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="28" y1="15" x2="35" y2="22" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="21" y1="37" x2="31" y2="37" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="50" cy="37" r="14" fill="none" stroke="#374151" strokeWidth="2.5"/>
                <rect x="46" y="51" width="8" height="10" fill="#374151"/>
                <rect x="44" y="61" width="12" height="2.5" fill="#374151"/>
                <line x1="64" y1="28" x2="76" y2="40" stroke="#374151" strokeWidth="3" strokeLinecap="round"/>
                <polygon points="76,40 78,45 74,42" fill="#374151"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-800">EMEXA</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-10">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-gray-900 text-base font-normal transition-colors cursor-pointer bg-transparent border-none"
              >
                Testimonials
              </button>
              <Link to="/user-management" className="text-gray-700 hover:text-emerald-600 text-base font-normal transition-colors">
                User Management
              </Link>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg text-base font-medium transition-colors shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}