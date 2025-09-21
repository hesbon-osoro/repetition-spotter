// components/ui/Logo.tsx
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <div
      className={`flex items-center justify-center rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/20 shadow-lg ${sizeClasses[size]} ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center p-1.5">
        <Image
          src="/rs-rm.png"
          alt="RepetitionSpotter Logo"
          width={128}
          height={128}
          className="object-contain scale-110 brightness-110 contrast-110"
          priority
        />
      </div>
    </div>
  );
};

export default Logo;
