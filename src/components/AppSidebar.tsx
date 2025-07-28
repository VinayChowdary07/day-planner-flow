
import { Calendar, FolderOpen, Target, CalendarDays, LayoutDashboard } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activeSection: 'dashboard' | 'tasks' | 'projects' | 'goals' | 'calendar';
  onSectionChange: (section: 'dashboard' | 'tasks' | 'projects' | 'goals' | 'calendar') => void;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      key: 'dashboard' as const,
    },
    {
      title: 'Tasks',
      icon: Calendar,
      key: 'tasks' as const,
    },
    {
      title: 'Projects',
      icon: FolderOpen,
      key: 'projects' as const,
    },
    {
      title: 'Goals',
      icon: Target,
      key: 'goals' as const,
    },
    {
      title: 'Calendar',
      icon: CalendarDays,
      key: 'calendar' as const,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span className="font-semibold">Day Planner</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.key)}
                    isActive={activeSection === item.key}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
