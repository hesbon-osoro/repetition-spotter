import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { RepetitionStats } from '@/types';
import Card from '../ui/Card';
import { resolveTheme, usePreferences } from '@/hooks/usePreferences';

// Type for Chart.js tooltip context
interface TooltipContext {
  label: string;
  raw: unknown;
}

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartProps {
  stats: RepetitionStats;
}

const Chart: React.FC<ChartProps> = ({ stats }) => {
  const { prefs } = usePreferences();
  const dark = resolveTheme(prefs.theme) === 'dark';
  const data = {
    labels: ['Unique Content', 'Repetitions'],
    datasets: [
      {
        data: [stats.efficiencyScore, 100 - stats.efficiencyScore],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: dark ? '#a3adc2' : '#475569',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipContext) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <Card title="Analysis Chart" className="mt-6">
      <div className="h-64">
        <Doughnut key={dark ? 'dark' : 'light'} data={data} options={options} />
      </div>
    </Card>
  );
};

export default Chart;
