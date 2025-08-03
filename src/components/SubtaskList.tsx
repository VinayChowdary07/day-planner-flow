
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useSubtasks } from '@/hooks/useSubtasks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SubtaskListProps {
  parentTaskId: string;
}

export const SubtaskList = ({ parentTaskId }: SubtaskListProps) => {
  const { subtasks, createSubtask, toggleSubtaskComplete, deleteSubtask, loading } = useSubtasks(parentTaskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setIsCreating(true);
    try {
      await createSubtask({
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubtask();
    }
  };

  if (subtasks.length === 0 && !isOpen) {
    return (
      <div className="mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-xs text-muted-foreground h-8 hover:bg-muted/50 transition-colors duration-200"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add subtask
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-8 w-full justify-start hover:bg-muted/50 transition-colors duration-200 group"
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3 mr-1 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1 transition-transform duration-200" />
            )}
            <span className="font-medium">Subtasks</span>
            {subtasks.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-2 px-1.5 py-0.5">
                {subtasks.length}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 mt-3 animate-in slide-in-from-top-2 duration-200">
          {/* Add new subtask */}
          <div className="flex gap-2 p-3 bg-muted/30 rounded-lg border border-border/40">
            <Input
              placeholder="Add a new subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm h-9 flex-1 border-border/60 focus:border-primary/60 transition-colors duration-200"
              disabled={isCreating}
            />
            <Button
              onClick={handleCreateSubtask}
              disabled={!newSubtaskTitle.trim() || isCreating}
              size="sm"
              className="h-9 px-3 bg-primary hover:bg-primary/90 transition-colors duration-200"
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Subtask list */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <Card 
                  key={subtask.id} 
                  className="p-3 bg-card/50 border-border/40 hover:bg-card/80 transition-all duration-200 hover:shadow-sm animate-in fade-in-0 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={subtask.status === 'complete'}
                      onCheckedChange={() => toggleSubtaskComplete(subtask.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span
                      className={`flex-1 text-sm transition-all duration-200 ${
                        subtask.status === 'complete'
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 transition-colors duration-200 ${
                        subtask.priority === 'high'
                          ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                          : subtask.priority === 'medium'
                          ? 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
                          : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                      }`}
                    >
                      {subtask.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSubtask(subtask.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
