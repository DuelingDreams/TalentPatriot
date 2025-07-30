// Fix for Replit runtime error plugin in production
if (typeof window !== 'undefined') {
  // Override the hmr.overlay setting to prevent runtime error modal
  if ((window as any).__vite_plugin_react_preamble_installed__) {
    // Disable overlay in production
    const viteConfig = (window as any).__vite_plugin_react_preamble_installed__;
    if (viteConfig && viteConfig.hmr) {
      viteConfig.hmr.overlay = false;
    }
  }
  
  // Prevent dynamic import errors
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('Failed to fetch dynamically imported module') &&
        event.error?.message?.includes('runtime-error-plugin')) {
      event.preventDefault();
      console.log('Suppressed runtime error plugin import error');
    }
  });
  
  // Also handle unhandled rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Failed to fetch dynamically imported module') &&
        event.reason?.message?.includes('runtime-error-plugin')) {
      event.preventDefault();
      console.log('Suppressed runtime error plugin promise rejection');
    }
  });
}

export {};