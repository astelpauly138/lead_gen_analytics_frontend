import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import analyticaLogo from '../../styles/images/Analytica-text.png';
import logoIcon from '../../styles/images/logo.png';

const Sidebar = ({ isCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/main-dashboard',
      icon: 'BarChart3',
      tooltip: 'Real-time lead generation overview and KPI monitoring'
    },
    {
      label: 'Campaigns',
      path: '/campaign-performance',
      icon: 'Mail',
      tooltip: 'Email outreach analytics and performance monitoring'
    },
    {
      label: 'Lead Analytics',
      path: '/lead-analytics-sheet',
      icon: 'Database',
      tooltip: 'Comprehensive lead database management with advanced filtering'
    },
    {
      label: 'Email Config',
      path: '/email-configuration',
      icon: 'Mail',
      tooltip: 'Configure SMTP and email delivery settings'
    },
    {
      label: 'Billing',
      path: '/billing',
      icon: 'CreditCard',
      tooltip: 'Manage your subscription and billing plans'
    },
    {
      label: 'Settings',
      path: '/settings-dashboard',
      icon: 'Settings',
      tooltip: 'System configuration and API management'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location?.pathname === path;
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
    >
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/main-dashboard')}>
        <img src={analyticaLogo} alt="Analytica" className="sidebar-brand-text-logo" style={{ height: '22px', objectFit: 'contain' }} />
        <img src={logoIcon} alt="Analytica" className="sidebar-brand-icon-logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationItems?.map((item) => (
          <button
            key={item?.path}
            onClick={() => handleNavigation(item?.path)}
            className={`sidebar-nav-item animate-stagger ${
              isActive(item?.path) ? 'active' : ''
            }`}
            title={item?.label}
            aria-label={item?.label}
            aria-current={isActive(item?.path) ? 'page' : undefined}
          >
            <Icon name={item?.icon} size={20} />
            <span className="sidebar-nav-item-text">{item?.label}</span>
          </button>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer absolute bottom-6 left-4 right-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="caption text-muted-foreground text-xs">
              © 2026 ANALYTICA
            </p>
            <p className="caption text-muted-foreground text-xs mt-1">
              Lead Intelligence Platform
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
