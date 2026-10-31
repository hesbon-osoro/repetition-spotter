import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm ${paddingClasses[padding]} ${className}`}
    >
      {title && (
        <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;
