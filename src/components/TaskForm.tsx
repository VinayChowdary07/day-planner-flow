import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Calendar, Clock, MapPin, Flag, Repeat, Target, FolderOpen, Type, AlignLeft, Link, FileText } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  task_date: z.string().min(1, 'Date is required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  recurrence_end_date: z.string().optional(),
  project_id: z.string().optional(),
  goal_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaskForm = ({ task, onSuccess, onCancel }: TaskFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { createTask, updateTask } = useTasks();
  const { projects } = useProjects();
  const { goals } = useGoals();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      task_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      location: '',
      priority: 'medium',
      category: 'general',
      recurrence: 'none',
      recurrence_end_date: '',
      project_id: 'none',
      goal_id: 'none',
    },
  });

  useEffect(() => {
    if (task) {
      console.log('Editing task:', task);
      form.reset({
        title: task.title,
        description: task.description || '',
        task_date: task.task_date,
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        location: task.location || '',
        priority: task.priority,
        category: task.category,
        recurrence: task.recurrence || 'none',
        recurrence_end_date: task.recurrence_end_date || '',
        project_id: task.project_id || 'none',
        goal_id: task.goal_id || 'none',
      });
      setIsOpen(true);
    }
  }, [task, form]);

  const handleSubmit = async (data: TaskFormData) => {
    console.log('Submitting task form:', data);
    setLoading(true);
    try {
      // Clean the data before sending
      const taskData: Partial<Task> = {
        title: data.title,
        description: data.description || null,
        task_date: data.task_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        priority: data.priority,
        category: data.category,
        recurrence: data.recurrence === 'none' ? null : data.recurrence,
        recurrence_end_date: data.recurrence_end_date || null,
        project_id: data.project_id === 'none' ? null : data.project_id,
        goal_id: data.goal_id === 'none' ? null : data.goal_id,
        tags: [],
      };

      console.log('Processed task data:', taskData);

      if (task) {
        console.log('Updating task:', task.id);
        await updateTask(task.id, taskData);
      } else {
        console.log('Creating new task');
        await createTask(taskData);
      }

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (task) {
        onCancel?.();
      } else {
        form.reset();
      }
      setFocusedField(null);
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  // Get selected project and goal for display
  const selectedProject = projects.find(p => p.id === form.watch('project_id'));
  const selectedGoal = goals.find(g => g.id === form.watch('goal_id'));

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="group relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
          {task ? 'Edit Task' : 'Add Task'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
              
              {/* Basic Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Task Details</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-3 w-3" />
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What needs to be done?"
                          className={`transition-all duration-200 ${
                            focusedField === 'title' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                          }`}
                          onFocus={() => handleFieldFocus('title')}
                          onBlur={handleFieldBlur}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlignLeft className="h-3 w-3" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add more details (optional)"
                          className={`resize-none transition-all duration-200 ${
                            focusedField === 'description' ? 'ring-2 ring-primary/50 scale-[1.01]' : ''
                          }`}
                          rows={2}
                          onFocus={() => handleFieldFocus('description')}
                          onBlur={handleFieldBlur}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Timing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Timing & Schedule</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="task_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Date
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className={`transition-all duration-200 ${
                              focusedField === 'task_date' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                            }`}
                            onFocus={() => handleFieldFocus('task_date')}
                            onBlur={handleFieldBlur}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Start Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className={`transition-all duration-200 ${
                              focusedField === 'start_time' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                            }`}
                            onFocus={() => handleFieldFocus('start_time')}
                            onBlur={handleFieldBlur}
                            {...field} 
                          />
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
                          <Clock className="h-3 w-3" />
                          End Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            className={`transition-all duration-200 ${
                              focusedField === 'end_time' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                            }`}
                            onFocus={() => handleFieldFocus('end_time')}
                            onBlur={handleFieldBlur}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Repeat className="h-3 w-3" />
                          Recurrence
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={`transition-all duration-200 ${
                              focusedField === 'recurrence' ? 'ring-2 ring-primary/50' : ''
                            }`}>
                              <SelectValue placeholder="Select recurrence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
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
                        <FormItem className="animate-in slide-in-from-left-5 duration-200">
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            End Date
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              className={`transition-all duration-200 ${
                                focusedField === 'recurrence_end_date' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                              }`}
                              onFocus={() => handleFieldFocus('recurrence_end_date')}
                              onBlur={handleFieldBlur}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Organization Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  <span>Organization</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Flag className="h-3 w-3" />
                          Priority
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={`transition-all duration-200 ${
                              focusedField === 'priority' ? 'ring-2 ring-primary/50' : ''
                            }`}>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">🟢 Low</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="high">🔴 High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={`transition-all duration-200 ${
                              focusedField === 'category' ? 'ring-2 ring-primary/50' : ''
                            }`}>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">📋 General</SelectItem>
                            <SelectItem value="work">💼 Work</SelectItem>
                            <SelectItem value="personal">👤 Personal</SelectItem>
                            <SelectItem value="health">🏥 Health</SelectItem>
                            <SelectItem value="finance">💰 Finance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Where will this happen? (optional)" 
                          className={`transition-all duration-200 ${
                            focusedField === 'location' ? 'ring-2 ring-primary/50 scale-[1.02]' : ''
                          }`}
                          onFocus={() => handleFieldFocus('location')}
                          onBlur={handleFieldBlur}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Links Section - Enhanced */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Link className="h-4 w-4" />
                  <span>🧩 Links & Relationships</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FolderOpen className="h-3 w-3" />
                          📁 Linked Project
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={`transition-all duration-200 ${
                              focusedField === 'project_id' ? 'ring-2 ring-primary/50' : ''
                            }`}>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="none">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 rounded-full border border-dashed border-muted-foreground" />
                                No project
                              </div>
                            </SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shadow-sm" 
                                    style={{ backgroundColor: project.color }}
                                  />
                                  <span className="truncate">{project.name}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {project.completedTasks}/{project.totalTasks}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          🎯 Linked Goal
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={`transition-all duration-200 ${
                              focusedField === 'goal_id' ? 'ring-2 ring-primary/50' : ''
                            }`}>
                              <SelectValue placeholder="Select goal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="none">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 rounded-full border border-dashed border-muted-foreground" />
                                No goal
                              </div>
                            </SelectItem>
                            {goals.map((goal) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                <div className="flex items-center gap-2">
                                  <Target className="h-3 w-3 text-primary" />
                                  <span className="truncate">{goal.title}</span>
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

                {/* Enhanced Link Preview */}
                {(selectedProject || selectedGoal) && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-primary/20 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Link className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <span>🔗 Task Connections</span>
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {selectedProject && (
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-3 w-3" />
                              <span>Contributing to project:</span>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: selectedProject.color }}
                                />
                                <span className="font-medium">{selectedProject.name}</span>
                              </div>
                            </div>
                          )}
                          {selectedGoal && (
                            <div className="flex items-center gap-2">
                              <Target className="h-3 w-3" />
                              <span>Working towards goal:</span>
                              <span className="font-medium">{selectedGoal.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <div className="flex gap-3 p-6 pt-4 border-t flex-shrink-0 bg-background/95 backdrop-blur-sm">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)} 
            disabled={loading} 
            className="flex-1 group relative overflow-hidden transition-all duration-200 hover:scale-105 disabled:scale-100"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] transition-transform duration-700 ${!loading ? 'group-hover:translate-x-[100%]' : ''}`} />
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <span className="relative z-10">
                {task ? 'Update Task' : 'Create Task'}
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
