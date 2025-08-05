import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Filter,
  Sun,
  Moon,
  Star,
  CheckCircle2,
  Circle,
  List,
  Grid3x3,
  Sparkles,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isSameMonth, isToday } from 'date-fns';
import { useInAppCalendar } from '@/hooks/useInAppCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarViewMode } from '@/types/task';
import { AgendaView } from '@/components/AgendaView';
import { ResizableCalendarItem } from '@/components/ResizableCalendarItem';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_end_date?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  is_all_day: boolean;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  color: string;
}

interface DraggedItem {
  id: string;
  type: 'event' | 'task';
  data: any;
}

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showTasks, setShowTasks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    is_all_day: false,
    recurrence_type: 'none' as const,
    color: '#6366F1',
  });

  const { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent } = useInAppCalendar();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();
  const { draggedItem, isDragging, startDrag, endDrag, handleDrop } = useDragAndDrop();

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    await fetchEvents(startDate.toISOString(), endDate.toISOString());
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_datetime || !eventForm.end_datetime) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventForm);
      } else {
        await createEvent(eventForm);
      }

      setShowEventDialog(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_datetime: event.start_datetime.slice(0, 16),
      end_datetime: event.end_datetime.slice(0, 16),
      location: event.location || '',
      is_all_day: event.is_all_day,
      recurrence_type: event.recurrence_type || 'none',
      color: event.color || '#6366F1',
    });
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        loadEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_datetime: '',
      end_datetime: '',
      location: '',
      is_all_day: false,
      recurrence_type: 'none',
      color: '#6366F1',
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_datetime);
      return isSameDay(eventDate, date);
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.task_date);
      return isSameDay(taskDate, date);
    });
  };

  const isDateInCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentMonth);
  };

  // Enhanced drag handlers with resize support
  const handleDragStart = (item: any, type: 'event' | 'task') => (e: React.DragEvent) => {
    startDrag(item.id, type, item);
    const target = e.target as HTMLElement;
    target.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove('opacity-50');
    setTimeout(() => {
      if (!document.querySelector('.drop-active')) {
        endDrag();
      }
    }, 50);
  };

  const handleDragOver = (date: Date) => (e: React.DragEvent) => {
    if (!draggedItem || !isDateInCurrentMonth(date)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnDate = (date: Date) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem || !isDateInCurrentMonth(date)) return;

    try {
      await handleDrop(date, updateEvent, updateTask);
      toast({
        title: 'Success',
        description: `${draggedItem.type === 'event' ? 'Event' : 'Task'} moved to ${format(date, 'MMM d')}`,
      });
      await loadEvents();
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to move item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDateClick = (date: Date) => {
    if (isDateInCurrentMonth(date)) {
      setSelectedDate(date);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    while (day <= calendarEnd) {
      const dayEvents = showEvents ? getEventsForDate(day) : [];
      const dayTasks = showTasks ? getTasksForDate(day) : [];
      const isCurrentMonth = isDateInCurrentMonth(day);
      const isSelected = isSameDay(day, selectedDate);
      const isTodayDate = isToday(day);
      const totalItems = dayEvents.length + dayTasks.length;

      days.push(
        <div
          key={day.toString()}
          className={cn(
            "relative min-h-[120px] border transition-all duration-200 group cursor-pointer overflow-hidden",
            "bg-gradient-to-br from-background to-background/50",
            isCurrentMonth 
              ? "border-border/60 hover:border-primary/40 hover:shadow-sm" 
              : "border-border/20 bg-muted/10 cursor-not-allowed opacity-40",
            isSelected && isCurrentMonth && "ring-1 ring-primary/50 border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10",
            isTodayDate && isCurrentMonth && "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
          )}
          onClick={() => handleDateClick(day)}
          onDragOver={handleDragOver(day)}
          onDrop={handleDropOnDate(day)}
        >
          <div className={cn(
            "flex items-center justify-between p-2 pb-1",
            isCurrentMonth ? "text-foreground" : "text-muted-foreground"
          )}>
            <div className={cn(
              "flex items-center gap-2",
              isTodayDate && isCurrentMonth && "font-bold"
            )}>
              <span className={cn(
                "text-sm font-medium",
                isTodayDate && isCurrentMonth && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
              )}>
                {format(day, 'd')}
              </span>
              {isTodayDate && isCurrentMonth && (
                <Sun className="w-3 h-3 text-amber-500" />
              )}
            </div>
            
            {totalItems > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20",
                  totalItems > 3 && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                )}
              >
                {totalItems}
              </Badge>
            )}
          </div>

          {isCurrentMonth && (
            <div className="px-2 pb-2 space-y-1 flex-1">
              {dayEvents.slice(0, 2).map((event) => (
                <ResizableCalendarItem
                  key={event.id}
                  item={event}
                  type="event"
                  onClick={() => handleEditEvent(event)}
                  onDragStart={startDrag}
                  className="hover:scale-[1.02] hover:z-10 relative"
                />
              ))}

              {dayTasks.slice(0, 2).map((task) => (
                <ResizableCalendarItem
                  key={task.id}
                  item={task}
                  type="task"
                  onClick={() => {}} // Handle task click if needed
                  onDragStart={startDrag}
                  className="hover:scale-[1.02] hover:z-10 relative"
                />
              ))}

              {totalItems > 2 && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1 text-center border border-dashed border-muted-foreground/30">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  +{totalItems - 2} more
                </div>
              )}
            </div>
          )}
        </div>,
      );
      day = addDays(day, 1);
    }

    return (
      <div className="bg-gradient-to-br from-background to-background/80 rounded-xl border border-border/60 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gradient-to-r from-muted/30 to-muted/20 border-b border-border/40">
          {weekDays.map((dayName, index) => (
            <div key={dayName} className={cn(
              "p-3 text-center font-semibold text-sm",
              index === 0 || index === 6 ? "text-primary" : "text-foreground"
            )}>
              <div className="flex items-center justify-center gap-2">
                {index === 0 && <Sun className="w-4 h-4 text-amber-500" />}
                {index === 6 && <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{dayName.slice(0, 3)}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    if (!isSameMonth(selectedDate, newMonth)) {
      setSelectedDate(startOfMonth(newMonth));
    }
  };

  const selectedDateEvents = showEvents ? getEventsForDate(selectedDate) : [];
  const selectedDateTasks = showTasks ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background to-muted/10 min-h-screen">
      {/* Enhanced Header with View Toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <CalendarIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Calendar
              </h1>
              <p className="text-sm text-muted-foreground">Manage your events and tasks</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as CalendarViewMode)} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-card/60 backdrop-blur-sm border border-border/60">
              <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Month
              </TabsTrigger>
              <TabsTrigger value="agenda" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <List className="w-4 h-4 mr-2" />
                Agenda
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Controls */}
          <div className="flex items-center gap-4 p-3 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Show:</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-events"
                checked={showEvents}
                onCheckedChange={setShowEvents}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="show-events" className="text-sm font-medium cursor-pointer">
                Events
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-tasks"
                checked={showTasks}
                onCheckedChange={setShowTasks}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="show-tasks" className="text-sm font-medium cursor-pointer">
                Tasks
              </Label>
            </div>
          </div>

          {/* Add Event Button */}
          <Dialog open={showEventDialog} onOpenChange={(open) => {
            setShowEventDialog(open);
            if (!open) {
              setEditingEvent(null);
              // resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-sm border border-border/60">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_all_day"
                    checked={eventForm.is_all_day}
                    onCheckedChange={(checked) => setEventForm((prev) => ({ ...prev, is_all_day: checked as boolean }))}
                  />
                  <Label htmlFor="is_all_day">All day event</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start *</Label>
                    <Input
                      id="start"
                      type={eventForm.is_all_day ? 'date' : 'datetime-local'}
                      value={eventForm.start_datetime}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, start_datetime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End *</Label>
                    <Input
                      id="end"
                      type={eventForm.is_all_day ? 'date' : 'datetime-local'}
                      value={eventForm.end_datetime}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, end_datetime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <Label htmlFor="recurrence">Recurrence</Label>
                  <Select value={eventForm.recurrence_type} onValueChange={(value) => setEventForm((prev) => ({ ...prev, recurrence_type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No recurrence</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={eventForm.color}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, color: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between p-4 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl shadow-sm">
        <Button 
          variant="outline" 
          onClick={() => navigateMonth('prev')} 
          disabled={loading}
          className="hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <Button 
          variant="outline" 
          onClick={() => navigateMonth('next')} 
          disabled={loading}
          className="hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <Card className="bg-card/60 backdrop-blur-sm border border-border/60">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-6"></div>
            <p className="text-muted-foreground font-medium">Loading calendar...</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'month' ? (
            renderMonthView()
          ) : (
            <AgendaView
              selectedDate={selectedDate}
              events={events}
              tasks={tasks}
              onUpdateEvent={updateEvent}
              onUpdateTask={updateTask}
            />
          )}
        </div>
      )}

      {/* Selected Date Details - only show in month view */}
      {viewMode === 'month' && (
        <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDateEvents.length + selectedDateTasks.length} items scheduled
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No events or tasks for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Events */}
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="group flex items-start gap-3 p-4 border border-border/40 rounded-lg bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-all duration-300">
                    <div
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {!event.is_all_day && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(event.start_datetime), 'HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Tasks */}
                {selectedDateTasks.map((task) => (
                  <div key={task.id} className="group flex items-start gap-3 p-4 border border-dashed border-border/40 rounded-lg bg-gradient-to-r from-background to-muted/10 hover:shadow-md transition-all duration-300">
                    <div className={cn(
                      "w-4 h-4 rounded-full mt-1 flex-shrink-0 shadow-sm",
                      task.status === 'complete' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-semibold group-hover:text-primary transition-colors",
                        task.status === 'complete' && "line-through opacity-75"
                      )}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {task.start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.start_time} {task.end_time && `- ${task.end_time}`}
                          </div>
                        )}
                        {task.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{task.location}</span>
                          </div>
                        )}
                        <Badge 
                          variant={task.status === 'complete' ? 'default' : 'secondary'}
                          className={cn(
                            task.status === 'complete' 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" 
                              : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                          )}
                        >
                          {task.status}
                        </Badge>
                        {task.priority === 'high' && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
