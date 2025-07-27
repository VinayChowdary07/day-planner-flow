
import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TasksDashboard } from '@/components/TasksDashboard';
import { GoalsDashboard } from '@/components/GoalsDashboard';
import { ProjectsDashboard } from '@/components/ProjectsDashboard';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState<'tasks' | 'goals' | 'projects'>('tasks');

  const renderContent = () => {
    switch (activeSection) {
      case 'tasks':
        return <TasksDashboard />;
      case 'goals':
        return <GoalsDashboard />;
      case 'projects':
        return <ProjectsDashboard />;
      default:
        return <TasksDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <h1 className="text-lg font-semibold capitalize">{activeSection}</h1>
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
