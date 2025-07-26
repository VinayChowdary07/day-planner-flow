import { useState } from 'react';
import { Goal } from '@/types/goal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalCard } from '@/components/GoalCard';
import { GoalForm } from '@/components/GoalForm';

export const GoalsDashboard = () => {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, return all goals for 'all' status
    // TODO: Implement status filtering based on completion
    if (statusFilter === 'all') return matchesSearch;
    
    return matchesSearch;
  });

  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    await createGoal(goalData);
    setIsGoalFormOpen(false);
  };

  const handleUpdateGoal = async (goalData: Partial<Goal>) => {
    if (!editingGoal?.id) return;
    await updateGoal(editingGoal.id, goalData);
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      await deleteGoal(goalId);
    }
  };

  const openEditForm = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const closeEditForm = () => {
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Track your progress and achieve your objectives
          </p>
        </div>
        <Button onClick={() => setIsGoalFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first goal to start tracking your progress
          </p>
          <Button onClick={() => setIsGoalFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEditForm}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Goal Form Modals */}
      <GoalForm
        isOpen={isGoalFormOpen}
        onClose={() => setIsGoalFormOpen(false)}
        onSubmit={handleCreateGoal}
      />

      <GoalForm
        isOpen={!!editingGoal}
        onClose={closeEditForm}
        onSubmit={handleUpdateGoal}
        goal={editingGoal}
      />
    </div>
  );
};