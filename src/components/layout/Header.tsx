// components/layout/Header.tsx
import Logo from '../ui/Logo';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100/80 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Left side - Logo + Title */}
          <div className="flex items-center space-x-4 md:space-x-5">
            <Logo
              size="lg"
              className="transition-all duration-500 hover:scale-110 hover:rotate-3 hover:shadow-lg"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                RepetitionSpotter
              </h1>
              <p className="text-sm text-gray-600/90 font-medium mt-1 hidden sm:block bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                Detect and analyze text repetitions with precision
              </p>
            </div>
          </div>

          {/* Right side - Stack Info */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-full py-2 px-4 border border-gray-200/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
            <span className="text-sm font-medium text-gray-700/90 flex items-center">
              <span className="w-2.5 h-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-2 animate-pulse"></span>
              <span className="hidden sm:inline">Next.js + </span>TypeScript
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
