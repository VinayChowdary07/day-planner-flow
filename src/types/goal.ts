export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  target_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GoalTask {
  id: string;
  goal_id: string;
  task_id: string;
  created_at: string;
}

export interface GoalProgress {
  goal: Goal;
  totalTasks: number;
  completedTasks: number;
  totalRecurringCompletions: number;
  hasInfiniteRecurring: boolean;
  percentage: number | null; // null for infinite goals
}

export interface GoalFilters {
  search: string;
  status: 'all' | 'active' | 'completed';
}