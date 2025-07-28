
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '@/types/task';

interface ProductivityChartProps {
  tasks: Task[];
}

export const ProductivityChart = ({ tasks }: ProductivityChartProps) => {
  const chartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const completedTasks = tasks?.filter(task => {
        return task.completed && task.updated_at && 
               new Date(task.updated_at).toDateString() === dateStr;
      }).length || 0;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed: completedTasks,
      });
    }
    
    return last7Days;
  }, [tasks]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                      {payload[0].value} tasks completed
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="completed" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
