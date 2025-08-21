interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a 
      href={href} 
      className="skip-link"
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.currentTarget.classList.remove('sr-only');
      }}
      onBlur={(e) => {
        // Hide the link when focus is lost
        e.currentTarget.classList.add('sr-only');
      }}
    >
      {children}
    </a>
  );
}