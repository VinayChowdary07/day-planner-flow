
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, FolderOpen, Calendar, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteProject } = useProjects();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteProject(project.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: '🟢',
          label: 'Active'
        };
      case 'completed':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: '✅',
          label: 'Completed'
        };
      case 'archived':
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: '📦',
          label: 'Archived'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: '❓',
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 hover:border-l-primary/80" style={{ borderLeftColor: project.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-6 h-6 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-background"
              style={{ backgroundColor: project.color, ringColor: project.color + '40' }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{project.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs font-medium ${statusConfig.color}`}>
                  <span className="mr-1">{statusConfig.icon}</span>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            <span>Project</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
