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
import { CalendarDays, Clock, MapPin, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isSameMonth, isAfter, isBefore } from 'date-fns';
import { useInAppCalendar } from '@/hooks/useInAppCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { CalendarItem } from '@/components/CalendarItem';
import { useToast } from '@/hooks/use-toast';

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

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showTasks, setShowTasks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    is_all_day: false,
    recurrence_type: 'none',
    color: '#3B82F6',
  });

  const { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent } = useInAppCalendar();
  const { tasks, updateTask } = useTasks();
  const { draggedItem, isDragging, startDrag, endDrag, handleDrop } = useDragAndDrop();
  const { toast } = useToast();

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
      color: event.color || '#3B82F6',
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
      color: '#3B82F6',
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

  const isValidDropTarget = (date: Date) => {
    return isDateInCurrentMonth(date);
  };

  const clampDateToCurrentMonth = (date: Date) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    if (isBefore(date, monthStart)) {
      return monthStart;
    }
    if (isAfter(date, monthEnd)) {
      return monthEnd;
    }
    return date;
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    if (!isValidDropTarget(date)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnDate = async (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered on date:', date);
    
    let dragData = null;
    
    // Try to get drag data from multiple sources
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        dragData = JSON.parse(jsonData);
      }
    } catch (error) {
      console.log('No JSON data found in drag transfer');
    }
    
    // Fallback to draggedItem from hook
    if (!dragData && draggedItem) {
      dragData = draggedItem;
    }
    
    if (!dragData || !isValidDropTarget(date)) {
      console.log('Invalid drop - no drag data or invalid target');
      endDrag();
      return;
    }

    const clampedDate = clampDateToCurrentMonth(date);
    console.log('Processing drop with data:', dragData, 'on date:', clampedDate);

    try {
      await handleDrop(clampedDate, updateEvent, updateTask);
      toast({
        title: 'Success',
        description: `${dragData.type === 'event' ? 'Event' : 'Task'} moved successfully`,
      });
      loadEvents();
    } catch (error) {
      console.error('Error dropping item:', error);
      toast({
        title: 'Error',
        description: 'Failed to move item',
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

    while (day <= calendarEnd) {
      const dayEvents = showEvents ? getEventsForDate(day) : [];
      const dayTasks = showTasks ? getTasksForDate(day) : [];
      const isCurrentMonth = isDateInCurrentMonth(day);
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());
      const isValidDrop = isValidDropTarget(day);

      days.push(
        <div
          key={day.toString()}
          className={`
            min-h-[120px] border border-border p-2 transition-all duration-200
            ${isCurrentMonth 
              ? 'bg-background hover:bg-accent/50 cursor-pointer' 
              : 'bg-muted/20 cursor-default opacity-30'
            }
            ${isSelected && isCurrentMonth ? 'bg-primary/10 border-primary' : ''}
            ${isToday && isCurrentMonth ? 'ring-2 ring-primary ring-offset-2' : ''}
            ${isDragging && isValidDrop ? 'border-2 border-dashed border-primary bg-primary/5' : ''}
            ${isDragging && !isValidDrop ? 'border-2 border-dashed border-destructive/50 bg-destructive/5' : ''}
          `}
          onClick={() => handleDateClick(day)}
          onDragOver={(e) => isCurrentMonth && handleDragOver(e, day)}
          onDrop={(e) => isCurrentMonth && handleDropOnDate(day, e)}
        >
          <div className={`text-sm font-medium mb-1 ${
            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
          } ${isToday && isCurrentMonth ? 'text-primary font-bold' : ''}`}>
            {format(day, 'd')}
          </div>
          {isCurrentMonth && (
            <div className="space-y-1">
              {dayEvents.slice(0, 2).map((event) => (
                <CalendarItem
                  key={event.id}
                  item={event}
                  type="event"
                  onClick={() => handleEditEvent(event)}
                  onDragStart={startDrag}
                />
              ))}
              {dayTasks.slice(0, 2).map((task) => (
                <CalendarItem
                  key={task.id}
                  item={task}
                  type="task"
                  onClick={() => {/* Task editing will be handled by existing task components */}}
                  onDragStart={startDrag}
                />
              ))}
              {(dayEvents.length + dayTasks.length) > 2 && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded px-1 py-0.5">
                  +{(dayEvents.length + dayTasks.length) - 2} more
                </div>
              )}
            </div>
          )}
        </div>,
      );
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-medium bg-muted/50 border-b border-border">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = showEvents ? getEventsForDate(day) : [];
          const dayTasks = showTasks ? getTasksForDate(day) : [];
          const isToday = isSameDay(day, new Date());
          const isValidDrop = isValidDropTarget(day);

          return (
            <div 
              key={day.toString()} 
              className={`border border-border rounded-lg p-3 min-h-[200px] ${
                isDragging && isValidDrop ? 'border-2 border-dashed border-primary bg-primary/5' : ''
              } ${
                isDragging && !isValidDrop ? 'border-2 border-dashed border-destructive/50 bg-destructive/5' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDropOnDate(day, e)}
            >
              <div className={`text-sm font-medium mb-2 ${
                isToday ? 'text-primary font-bold' : 'text-foreground'
              }`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <CalendarItem
                    key={event.id}
                    item={event}
                    type="event"
                    onClick={() => handleEditEvent(event)}
                    onDragStart={startDrag}
                  />
                ))}
                {dayTasks.map((task) => (
                  <CalendarItem
                    key={task.id}
                    item={task}
                    type="task"
                    onClick={() => {/* Task editing will be handled by existing task components */}}
                    onDragStart={startDrag}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    // Reset selected date to first day of new month if it's outside the new month
    if (!isSameMonth(selectedDate, newMonth)) {
      setSelectedDate(startOfMonth(newMonth));
    }
  };

  const selectedDateEvents = showEvents ? getEventsForDate(selectedDate) : [];
  const selectedDateTasks = showTasks ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary text-primary-foreground' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary text-primary-foreground' : ''}
            >
              Week
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Controls */}
          <div className="flex items-center gap-2 mr-4">
            <Filter className="h-4 w-4" />
            <div className="flex items-center gap-1">
              <Switch
                id="show-events"
                checked={showEvents}
                onCheckedChange={setShowEvents}
              />
              <Label htmlFor="show-events" className="text-sm">Events</Label>
            </div>
            <div className="flex items-center gap-1">
              <Switch
                id="show-tasks"
                checked={showTasks}
                onCheckedChange={setShowTasks}
              />
              <Label htmlFor="show-tasks" className="text-sm">Tasks</Label>
            </div>
          </div>

          <Dialog open={showEventDialog} onOpenChange={(open) => {
            setShowEventDialog(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
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
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigateMonth('prev')} disabled={loading}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>

        <Button variant="outline" onClick={() => navigateMonth('next')} disabled={loading}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          ) : (
            <div className="p-4">{view === 'month' ? renderMonthView() : renderWeekView()}</div>
          )}
        </CardContent>
      </Card>

      {/* Events and Tasks for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Items for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length === 0 && selectedDateTasks.length === 0 ? (
            <p className="text-muted-foreground">No events or tasks for this date</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {!event.is_all_day && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(event.start_datetime), 'HH:mm')} - {format(parseISO(event.end_datetime), 'HH:mm')}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {selectedDateTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 border border-dashed border-border rounded-lg bg-muted/30">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: task.status === 'complete' ? '#10b981' : '#f59e0b' }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {task.start_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.start_time} {task.end_time && `- ${task.end_time}`}
                        </div>
                      )}
                      {task.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {task.location}
                        </div>
                      )}
                      <Badge variant={task.status === 'complete' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
