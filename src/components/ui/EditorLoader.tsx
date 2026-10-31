// src/components/ui/EditorLoader.tsx
import { useEffect, useState } from 'react';

interface EditorLoaderProps {
  message?: string;
}

const EditorLoader: React.FC<EditorLoaderProps> = ({
  message = 'Preparing your writing space',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayText(prev => prev + message[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentIndex, message]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="flex h-96 items-center justify-center bg-linear-to-br from-blue-50 to-purple-50 p-8 dark:from-blue-500/10 dark:to-purple-500/10">
      <div className="text-center">
        {/* Animated circles */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 bg-accent rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        {/* Typing text */}
        <div className="font-mono text-ink-2 text-lg mb-4">
          {displayText}
          <span
            className={`inline-block w-1 h-6 bg-accent ml-1 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}
          />
        </div>

        {/* Subtle progress indicator */}
        <div className="w-48 h-1 bg-line rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"
            style={{
              width: `${(currentIndex / message.length) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Loading tips */}
        <div className="mt-6 text-sm text-muted space-y-1">
          <p className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            ✨ Analyzing text patterns...
          </p>
          <p className="animate-fade-in" style={{ animationDelay: '1s' }}>
            🚀 Preparing repetition detection...
          </p>
          <p className="animate-fade-in" style={{ animationDelay: '1.5s' }}>
            📊 Loading analysis tools...
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditorLoader;
