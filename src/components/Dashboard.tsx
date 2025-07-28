
import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardGrid } from '@/components/DashboardGrid';
import { TasksDashboard } from '@/components/TasksDashboard';
import { ProjectsDashboard } from '@/components/ProjectsDashboard';
import { GoalsDashboard } from '@/components/GoalsDashboard';
import { CalendarView } from '@/components/CalendarView';
import { ThemeToggle } from '@/components/ThemeToggle';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tasks' | 'projects' | 'goals' | 'calendar'>('dashboard');

  const handleSectionChange = (section: 'dashboard' | 'tasks' | 'projects' | 'goals' | 'calendar') => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardGrid />;
      case 'tasks':
        return <TasksDashboard />;
      case 'projects':
        return <ProjectsDashboard />;
      case 'goals':
        return <GoalsDashboard />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <DashboardGrid />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange} 
        />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <div className="h-4 w-px bg-border" />
                <h1 className="text-lg font-semibold capitalize">{activeSection}</h1>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex-1 overflow-auto">
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
