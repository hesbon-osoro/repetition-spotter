// components/analytics/StatsCards.tsx
import { RepetitionStats } from '../../types';

interface StatsCardsProps {
  stats: RepetitionStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Words',
      value: stats.wordCount,
      icon: (
        <svg
          className="w-6 h-6 text-blue-600 dark:text-blue-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      ),
      bgColor: 'bg-blue-100 dark:bg-blue-500/15',
    },
    {
      title: 'Repetitions',
      value: stats.repetitionCount,
      icon: (
        <svg
          className="w-6 h-6 text-amber-600 dark:text-amber-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          ></path>
        </svg>
      ),
      bgColor: 'bg-amber-100 dark:bg-amber-500/15',
    },
    {
      title: 'Instances',
      value: stats.instanceCount,
      icon: (
        <svg
          className="w-6 h-6 text-red-600 dark:text-red-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      ),
      bgColor: 'bg-red-100 dark:bg-red-500/15',
    },
    {
      title: 'Efficiency',
      value: `${stats.efficiencyScore}%`,
      icon: (
        <svg
          className="w-6 h-6 text-emerald-600 dark:text-emerald-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z"
          ></path>
        </svg>
      ),
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/15',
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div
              className={`shrink-0 rounded-full p-2.5 sm:p-3 ${card.bgColor}`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink-2 sm:text-sm">
                {card.title}
              </p>
              <p className="text-xl font-bold tabular-nums text-ink sm:text-2xl">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
