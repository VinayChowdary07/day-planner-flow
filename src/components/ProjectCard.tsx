
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, FolderOpen, Calendar, MoreVertical, CheckCircle2, PlayCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { deleteProject, updateProject } = useProjects();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = project.status === 'active' ? 'completed' : 'active';
      await updateProject(project.id, { status: newStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
          icon: '🟢',
          label: 'Active'
        };
      case 'completed':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
          icon: '✅',
          label: 'Completed'
        };
      case 'archived':
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
          icon: '📦',
          label: 'Archived'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
          icon: '❓',
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-l-4 hover:border-l-primary/80 ${
      project.status === 'completed' ? 'opacity-80' : ''
    }`} style={{ borderLeftColor: project.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-6 h-6 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-background ring-gray-200 dark:ring-gray-700"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className={`text-lg font-semibold truncate ${
                project.status === 'completed' ? 'line-through text-muted-foreground' : ''
              }`}>
                {project.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs font-medium ${statusConfig.color}`}>
                  <span className="mr-1">{statusConfig.icon}</span>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Quick status toggle button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUpdating}
                >
                  {project.status === 'active' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-blue-600" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {project.status === 'active' ? 'Mark Project as Complete?' : 'Reactivate Project?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {project.status === 'active' 
                      ? `Are you sure you want to mark "${project.name}" as completed? You can reactivate it later if needed.`
                      : `Are you sure you want to reactivate "${project.name}"? This will mark it as active again.`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStatusToggle} disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : (project.status === 'active' ? 'Mark Complete' : 'Reactivate')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
                  onClick={handleStatusToggle}
                  disabled={isUpdating}
                >
                  {project.status === 'active' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Reactivate
                    </>
                  )}
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
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {project.description && (
          <p className={`text-sm text-muted-foreground mb-4 line-clamp-3 ${
            project.status === 'completed' ? 'opacity-75' : ''
          }`}>
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
