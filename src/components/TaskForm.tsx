
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Calendar, Clock, MapPin, Tag, FolderOpen, Target, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  task_date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
  location: z.string().optional(),
  project_id: z.string().optional(),
  goal_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  recurrence_end_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSuccess?: () => void;
}

export const TaskForm = ({ task, onSuccess }: TaskFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { createTask, updateTask } = useTasks();
  const { projects } = useProjects();
  const { goals } = useGoals();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      task_date: task?.task_date || format(new Date(), 'yyyy-MM-dd'),
      start_time: task?.start_time || '',
      end_time: task?.end_time || '',
      priority: task?.priority || 'medium',
      category: task?.category || 'general',
      location: task?.location || '',
      project_id: task?.project_id || 'none',
      goal_id: task?.goal_id || 'none',
      tags: task?.tags || [],
      recurrence: task?.recurrence || 'none',
      recurrence_end_date: task?.recurrence_end_date || '',
    },
  });

  const watchedTags = form.watch('tags') || [];
  const selectedProjectId = form.watch('project_id');
  const selectedGoalId = form.watch('goal_id');
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      const taskData = {
        ...data,
        project_id: data.project_id === 'none' ? null : data.project_id,
        goal_id: data.goal_id === 'none' ? null : data.goal_id,
        tags: data.tags || [],
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        recurrence_end_date: data.recurrence_end_date || null,
      };

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }
      
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      form.setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', icon: '🔵', color: 'text-blue-600' },
    { value: 'medium', label: 'Medium Priority', icon: '🟡', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', icon: '🔴', color: 'text-red-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {task ? 'Edit Task' : 'New Task'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Task Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What needs to be done?"
                      className="text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project and Goal Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Assignment */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Project Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a project (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                                  No project
                                </div>
                              </SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span className="font-medium">{project.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {project.status}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {selectedProject && (
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: selectedProject.color }}
                              />
                              <span className="font-medium">{selectedProject.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {selectedProject.status}
                              </Badge>
                            </div>
                            {selectedProject.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedProject.description}
                              </p>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Goal Assignment */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goal Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <FormField
                    control={form.control}
                    name="goal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select a goal (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <div className="flex items-center gap-2">
                                  <Target className="w-3 h-3 text-gray-400" />
                                  No goal
                                </div>
                              </SelectItem>
                              {goals.map((goal) => (
                                <SelectItem key={goal.id} value={goal.id}>
                                  <div className="flex items-center gap-2">
                                    <Target className="w-3 h-3 text-primary" />
                                    <span className="font-medium">{goal.title}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {selectedGoal && (
                          <div className="mt-2 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-primary" />
                              <span className="font-medium">{selectedGoal.title}</span>
                            </div>
                            {selectedGoal.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedGoal.description}
                              </p>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Task Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add more details about this task..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="task_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Priority
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <span>{option.icon}</span>
                                  <span className={option.color}>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Start Time
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          End Time
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Work, Personal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Where will this happen?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recurrence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recurrence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recurrence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No repeat</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('recurrence') !== 'none' && (
                    <FormField
                      control={form.control}
                      name="recurrence_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
