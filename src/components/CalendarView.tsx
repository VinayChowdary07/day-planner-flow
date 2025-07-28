
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
import { CalendarDays, Clock, MapPin, Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { useInAppCalendar } from '@/hooks/useInAppCalendar';

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

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dayEvents = getEventsForDate(day);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());

      days.push(
        <div
          key={day.toString()}
          className={`
            min-h-[120px] border border-border p-2 cursor-pointer transition-colors
            ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
            ${isSelected ? 'bg-primary/10' : ''}
            ${isToday ? 'bg-accent' : ''}
          `}
          onClick={() => setSelectedDate(day)}
        >
          <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
            {format(day, 'd')}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs p-1 rounded truncate"
                style={{ backgroundColor: event.color + '20', color: event.color }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>,
      );
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-medium bg-muted">
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
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="border border-border rounded-lg p-3">
              <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-2 rounded cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color + '20', color: event.color }}
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    {!event.is_all_day && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(event.start_datetime), 'HH:mm')}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
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
  };

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

      {/* Events for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-muted-foreground">No events for this date</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
