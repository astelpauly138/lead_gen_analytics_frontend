import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef?.current && !userMenuRef?.current?.contains(event?.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/authentication-login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-success/20 rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">System Status</p>
              <p className="caption text-success text-xs">All systems operational</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-all duration-250 touch-target"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                <Icon name="User" size={16} color="var(--color-primary)" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}</p>
                <p className="caption text-muted-foreground text-xs">{user?.company_name || 'User Account'}</p>
              </div>
              <Icon
                name="ChevronDown"
                size={16}
                className={`transition-transform duration-250 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-[300] animate-fade-in">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}</p>
                  <p className="caption text-muted-foreground text-xs mt-1">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/settings-dashboard'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-all duration-250 text-left touch-target"
                  >
                    <Icon name="User" size={16} />
                    <span className="text-sm text-foreground">Profile</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/settings-dashboard'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-all duration-250 text-left touch-target"
                  >
                    <Icon name="Settings" size={16} />
                    <span className="text-sm text-foreground">Account Settings</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); window.open('https://analytica-data.com/contact-us', '_blank'); }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-all duration-250 text-left touch-target"
                  >
                    <Icon name="HelpCircle" size={16} />
                    <span className="text-sm text-foreground">Help & Support</span>
                  </button>
                </div>

                <div className="p-2 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all duration-250 text-left touch-target"
                  >
                    <Icon name="LogOut" size={16} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;