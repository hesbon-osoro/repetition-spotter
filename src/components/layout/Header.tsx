// components/layout/Header.tsx
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { GithubIcon } from '../ui/icons';
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
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 md:h-20">
          {/* Left side - Logo + Title */}
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            <Logo
              size="lg"
              className="shrink-0 transition-all duration-500 hover:scale-110 hover:rotate-3 hover:shadow-lg"
            />
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent animate-gradient md:text-3xl dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                RepetitionSpotter
              </h1>
              <p
                ref={subtitleRef}
                className="mt-1 hidden text-sm font-medium lg:block subtitle-container"
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
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com/hesbon-osoro/repetition-spotter"
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              title="Source on GitHub"
              className="hidden h-10 w-10 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink sm:grid"
            >
              <GithubIcon className="h-[18px] w-[18px]" />
            </a>
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
          color: var(--ink-2);
        }
        .subtitle-word.underline-active {
          color: var(--accent);
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
          color: var(--accent);
          transform: translateY(-1px);
        }
      `}</style>
    </header>
  );
};

export default Header;
