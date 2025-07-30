// Direct posting links utility functions

export interface DirectPostingConfig {
  baseUrl: string;
  jobId: string;
  customization?: {
    companyName?: string;
    logo?: string;
    primaryColor?: string;
    hideHeader?: boolean;
  };
}

/**
 * Generate a direct posting link for a specific job
 */
export function generateDirectPostingLink(config: DirectPostingConfig): string {
  const { baseUrl, jobId, customization } = config;
  const url = new URL(`/jobs/${jobId}`, baseUrl);
  
  if (customization) {
    if (customization.companyName) {
      url.searchParams.set('company', customization.companyName);
    }
    if (customization.logo) {
      url.searchParams.set('logo', customization.logo);
    }
    if (customization.primaryColor) {
      url.searchParams.set('color', customization.primaryColor);
    }
    if (customization.hideHeader) {
      url.searchParams.set('hideHeader', 'true');
    }
  }
  
  return url.toString();
}

/**
 * Generate embeddable iframe code for a job posting
 */
export function generateEmbedCode(config: DirectPostingConfig, options: {
  width?: number | string;
  height?: number | string;
  border?: boolean;
} = {}): string {
  const {
    width = '100%',
    height = '600px',
    border = false
  } = options;
  
  const src = generateDirectPostingLink(config);
  const borderStyle = border ? 'border: 1px solid #e2e8f0;' : 'border: none;';
  
  return `<iframe 
  src="${src}" 
  width="${width}" 
  height="${height}" 
  style="${borderStyle} border-radius: 8px;"
  frameborder="0"
  allowfullscreen>
</iframe>`;
}

/**
 * Generate social media sharing links
 */
export function generateSocialShareLinks(config: DirectPostingConfig, jobTitle: string) {
  const jobUrl = generateDirectPostingLink(config);
  const encodedUrl = encodeURIComponent(jobUrl);
  const encodedTitle = encodeURIComponent(`Check out this job opportunity: ${jobTitle}`);
  
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=I thought you might be interested in this job opportunity: ${jobUrl}`
  };
}

/**
 * Track application source when coming from direct posting links
 */
export function trackApplicationSource(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // Check for UTM parameters
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  if (utmSource) {
    return `${utmSource}${utmMedium ? `/${utmMedium}` : ''}${utmCampaign ? `/${utmCampaign}` : ''}`;
  }
  
  // Check for social media referrers
  if (referrer.includes('linkedin.com')) return 'linkedin';
  if (referrer.includes('twitter.com') || referrer.includes('t.co')) return 'twitter';
  if (referrer.includes('facebook.com') || referrer.includes('fb.com')) return 'facebook';
  if (referrer.includes('indeed.com')) return 'indeed';
  if (referrer.includes('glassdoor.com')) return 'glassdoor';
  
  // Check for direct access
  if (!referrer || referrer === window.location.origin) return 'direct';
  
  return 'organic';
}

/**
 * Generate QR code URL for job posting (using external service)
 */
export function generateQRCodeUrl(config: DirectPostingConfig): string {
  const jobUrl = generateDirectPostingLink(config);
  const encodedUrl = encodeURIComponent(jobUrl);
  
  // Using QR Server API (free service)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
}

/**
 * Copy job posting link to clipboard
 */
export async function copyToClipboard(config: DirectPostingConfig): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }
  
  try {
    const url = generateDirectPostingLink(config);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get customization from URL parameters
 */
export function getCustomizationFromUrl(): DirectPostingConfig['customization'] {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    companyName: urlParams.get('company') || undefined,
    logo: urlParams.get('logo') || undefined,
    primaryColor: urlParams.get('color') || undefined,
    hideHeader: urlParams.get('hideHeader') === 'true',
  };
}