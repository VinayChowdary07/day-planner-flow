import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, ListTodo, Sparkles } from 'lucide-react';
import { useSubtasks } from '@/hooks/useSubtasks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SubtaskListProps {
  parentTaskId: string;
}

export const SubtaskList = ({ parentTaskId }: SubtaskListProps) => {
  const { subtasks, createSubtask, toggleSubtask, deleteSubtask, loading } = useSubtasks(parentTaskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setIsCreating(true);
    try {
      await createSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateSubtask();
    }
  };

  if (subtasks.length === 0 && !isOpen) {
    return (
      <div className="flex items-center justify-center py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-xs text-muted-foreground hover:text-primary h-9 px-4 hover:bg-primary/5 border border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300 rounded-full gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Add first subtask
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-primary/5 transition-all duration-300 group rounded-lg border border-transparent hover:border-primary/20"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 text-muted-foreground group-hover:text-primary" />
                )}
                <ListTodo className="h-4 w-4 text-primary" />
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                <span className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                  Subtasks
                </span>
                {subtasks.length > 0 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/30 group-hover:bg-primary/15 transition-colors duration-200"
                  >
                    {subtasks.filter(s => s.status === 'complete').length}/{subtasks.length}
                  </Badge>
                )}
              </div>
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 mt-4 animate-in slide-in-from-top-3 duration-300">
          {/* Add new subtask */}
          <div className="p-4 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 rounded-xl border border-primary/10 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="What needs to be done..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-10 border-primary/20 focus:border-primary/40 focus:ring-primary/20 transition-all duration-200 bg-white/50 dark:bg-card/50"
                  disabled={isCreating}
                />
              </div>
              <Button
                onClick={handleCreateSubtask}
                disabled={!newSubtaskTitle.trim() || isCreating}
                size="sm"
                className="h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Subtask list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading subtasks...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {subtasks.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No subtasks yet. Add one above to break down this task!</p>
                </div>
              ) : (
                subtasks.map((subtask, index) => (
                  <Card 
                    key={subtask.id} 
                    className="p-4 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 border-l-4 border-l-primary/30 bg-gradient-to-r from-white/80 to-primary/[0.02] dark:from-card/80 dark:to-primary/[0.02] group animate-in fade-in-0 slide-in-from-left-2 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={subtask.status === 'complete'}
                          onCheckedChange={() => toggleSubtask(subtask.id)}
                          className="h-4 w-4 rounded border-2 transition-all duration-300 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 data-[state=checked]:border-green-500 hover:border-primary/60 hover:shadow-sm"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm font-medium transition-all duration-300 ${
                            subtask.status === 'complete'
                              ? 'line-through text-muted-foreground/70'
                              : 'text-foreground group-hover:text-primary/90'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubtask(subtask.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-full"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
