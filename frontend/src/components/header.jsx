const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
              {/* Light bulb outline */}
              <path
                d="M50 20C38.954 20 30 28.954 30 40C30 47.18 33.686 53.462 39.2 57.2V65C39.2 66.326 40.274 67.4 41.6 67.4H58.4C59.726 67.4 60.8 66.326 60.8 65V57.2C66.314 53.462 70 47.18 70 40C70 28.954 61.046 20 50 20Z"
                stroke="#16A34A"
                strokeWidth="3"
                fill="white"
              />
              {/* Pencil */}
              <path
                d="M65 25L70 30L60 40L55 35L65 25Z"
                stroke="#16A34A"
                strokeWidth="2.5"
                fill="#FCD34D"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M55 35L52 38" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
              {/* Light rays */}
              <line x1="50" y1="10" x2="50" y2="15" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="28" y1="18" x2="32" y2="22" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="15" y1="40" x2="20" y2="40" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="72" y1="18" x2="68" y2="22" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="85" y1="40" x2="80" y2="40" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              {/* Base */}
              <rect x="42" y="67" width="16" height="3" rx="1" fill="#16A34A" />
              <rect x="44" y="70" width="12" height="3" rx="1" fill="#16A34A" />
              <rect x="46" y="73" width="8" height="2" rx="1" fill="#16A34A" />
            </svg>
            <span className="text-xl font-bold text-gray-900">EMEXA</span>
          </div>
        </div>

        {/* Right side - Icons and Admin */}
        <div className="flex items-center gap-4">
          {/* Notification Icon */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Help Icon */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;