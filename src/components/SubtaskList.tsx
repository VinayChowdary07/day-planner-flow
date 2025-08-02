
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useSubtasks } from '@/hooks/useSubtasks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SubtaskListProps {
  parentTaskId: string;
}

export const SubtaskList = ({ parentTaskId }: SubtaskListProps) => {
  const { subtasks, createSubtask, toggleSubtaskComplete, deleteSubtask } = useSubtasks(parentTaskId);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    await createSubtask({
      title: newSubtaskTitle.trim(),
    });
    setNewSubtaskTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubtask();
    }
  };

  if (subtasks.length === 0 && !isOpen) {
    return (
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-xs text-muted-foreground h-7"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add subtask
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7 w-full justify-start"
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            Subtasks ({subtasks.length})
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2 mt-2">
          {/* Add new subtask */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm h-8"
            />
            <Button
              onClick={handleCreateSubtask}
              disabled={!newSubtaskTitle.trim()}
              size="sm"
              className="h-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Subtask list */}
          <div className="space-y-1">
            {subtasks.map((subtask) => (
              <Card key={subtask.id} className="p-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.status === 'complete'}
                    onCheckedChange={() => toggleSubtaskComplete(subtask.id)}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      subtask.status === 'complete'
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      subtask.priority === 'high'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : subtask.priority === 'medium'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {subtask.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubtask(subtask.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
