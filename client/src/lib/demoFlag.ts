import { useAuth } from '@/contexts/AuthContext';

export const enableDemo = () => localStorage.setItem('tp_demo', 'true');
export const disableDemo = () => localStorage.removeItem('tp_demo');

export const rawDemoFlag = () =>
  new URLSearchParams(window.location.search).get('demo') === 'true' ||
  localStorage.getItem('tp_demo') === 'true';

export const useDemoFlag = () => {
  // Safe if AuthContext isn't ready
  try {
    const { userRole } = useAuth();
    const isDemo = rawDemoFlag() || userRole === 'demo_viewer';
    return { isDemoUser: !!isDemo };
  } catch {
    return { isDemoUser: rawDemoFlag() };
  }
};