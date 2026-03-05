import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAuthedSupabase } from '../utils/supabase';

const ThemeContext = createContext(null);

const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(() => {
    // Immediately apply stored theme to avoid flash
    const stored = localStorage.getItem('theme') || 'light';
    applyTheme(stored);
    return stored;
  });

  // When user logs in, fetch theme_preference from DB and apply
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchTheme = async () => {
      try {
        const { data } = await getAuthedSupabase()
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.user_id)
          .single();

        const dbTheme = data?.theme_preference;
        if (dbTheme === 'light' || dbTheme === 'dark') {
          applyTheme(dbTheme);
          setThemeState(dbTheme);
          localStorage.setItem('theme', dbTheme);
        }
      } catch (err) {
        console.error('Failed to fetch theme preference', err);
      }
    };

    fetchTheme();
  }, [user?.user_id]);

  const setTheme = async (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') return;

    // Apply immediately
    applyTheme(newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Persist to DB
    if (user?.user_id) {
      try {
        await getAuthedSupabase()
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.user_id);
      } catch (err) {
        console.error('Failed to save theme preference', err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
