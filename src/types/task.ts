
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  tags: string[];
  status: 'complete' | 'incomplete';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_end_date?: string;
  parent_task_id?: string;
  next_occurrence?: string;
  is_template?: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  order_position: number;
  project_id?: string;
  goal_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  search: string;
  status: 'all' | 'complete' | 'incomplete';
  priority: 'all' | 'low' | 'medium' | 'high';
  category: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
}
