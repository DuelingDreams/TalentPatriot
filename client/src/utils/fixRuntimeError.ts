// Fix for Replit runtime error plugin in production
if (typeof window !== 'undefined') {
  // Intercept the runtime error plugin loading attempts
  const originalImport = (window as any).import;
  if (originalImport) {
    (window as any).import = function(specifier: string) {
      if (specifier && specifier.includes('runtime-error-plugin')) {
        console.log('Intercepted and blocked runtime error plugin import');
        return Promise.resolve({});
      }
      return originalImport.call(this, specifier);
    };
  }
  
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
  }, true);
  
  // Also handle unhandled rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Failed to fetch dynamically imported module') &&
        event.reason?.message?.includes('runtime-error-plugin')) {
      event.preventDefault();
      console.log('Suppressed runtime error plugin promise rejection');
    }
  }, true);
}

export {};