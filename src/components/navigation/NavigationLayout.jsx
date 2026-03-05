import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const NavigationLayout = () => {
  const isSidebarCollapsed = false;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
      />

      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header />
        
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default NavigationLayout;