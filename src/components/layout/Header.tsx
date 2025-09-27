// components/layout/Header.tsx
import Logo from '../ui/Logo';
import { useEffect, useRef } from 'react';

const Header = () => {
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!subtitleRef.current) return;

    const words = subtitleRef.current.querySelectorAll('.subtitle-word');
    let currentIndex = 0;
    const totalWords = words.length;

    const animateWords = () => {
      // Reset all words
      words.forEach(word => {
        (word as HTMLSpanElement).classList.remove('underline-active');
      });

      // Activate current word
      const currentWord = words[currentIndex] as HTMLSpanElement;
      currentWord.classList.add('underline-active');

      // Move to next word
      currentIndex = (currentIndex + 1) % totalWords;
      // Comfortable animation speed
      animationRef.current = setTimeout(animateWords, 800);
    };
    animateWords();
    return () => {
      if (animationRef.current !== null) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const subtitleText =
    'Professional tool for detecting and analyzing text repetitions.';
  const words = subtitleText.split(' ');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100/80 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-20">
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
              <p
                ref={subtitleRef}
                className="text-sm text-gray-600/90 font-medium mt-1 hidden sm:block subtitle-container"
              >
                {words.map((word: string, index: number) => (
                  <span
                    key={index}
                    className="subtitle-word relative inline-block mr-1.5"
                  >
                    {word}
                    {index < words.length - 1 && ' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
          {/* Right side - Stack Info */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-full py-2 px-4 border border-gray-200/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
            <span className="text-sm font-medium text-gray-700/90 flex items-center">
              <span className="hidden sm:inline">Next.js + </span>TypeScript
              <span className="w-2.5 h-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse ml-2"></span>
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
        @keyframes underlineSlide {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scaleX(1);
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        .subtitle-word {
          display: inline-block;
          transition: all 0.3s ease;
          color: #4b5563;
        }
        .subtitle-word.underline-active {
          color: #4f46e5;
        }
        .subtitle-word.underline-active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          animation: underlineSlide 0.6s ease-out;
          border-radius: 1px;
        }
        .subtitle-word:hover {
          color: #4f46e5;
          transform: translateY(-1px);
        }
      `}</style>
    </header>
  );
};

export default Header;
