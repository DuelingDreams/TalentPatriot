/**
 * Normalizes skill input into a clean, deduplicated, sorted array
 * @param input - String of comma/newline separated skills or array of skill strings
 * @returns Array of normalized skill strings
 */
export function normalizeSkills(input: string | string[]): string[] {
  if (!input) return []
  
  // Convert to array if string
  let skillsArray: string[]
  if (typeof input === 'string') {
    // Split on commas, newlines, semicolons, and pipes
    skillsArray = input
      .split(/[,\n\r;|]+/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
  } else {
    skillsArray = input
      .map(skill => skill?.trim?.() || '')
      .filter(skill => skill.length > 0)
  }
  
  // Normalize each skill text
  const normalizedSkills = skillsArray.map(skill => normalizeSkillText(skill))
  
  // Deduplicate case-insensitively while preserving proper casing
  const uniqueSkills = Array.from(
    new Map(
      normalizedSkills.map(skill => [skill.toLowerCase(), skill])
    ).values()
  )
  
  // Sort A→Z
  return uniqueSkills.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

/**
 * Normalizes a single skill text with proper casing and acronym handling
 * @param skill - Raw skill text
 * @returns Normalized skill text
 */
function normalizeSkillText(skill: string): string {
  if (!skill || typeof skill !== 'string') return ''
  
  const trimmed = skill.trim()
  if (!trimmed) return ''
  
  // Handle special cases for acronyms and technical terms
  const specialCases = [
    'API', 'REST', 'SQL', 'HTML', 'CSS', 'XML', 'JSON', 'HTTP', 'HTTPS',
    'AWS', 'GCP', 'Azure', 'CI/CD', 'DevOps', 'MLOps', 'UI/UX', 'IoT',
    'AI', 'ML', 'NLP', 'GPU', 'CPU', 'RAM', 'SSD', 'HDD',
    'iOS', 'macOS', 'Android', 'Linux', 'Windows', 'Unix',
    'PHP', 'NoSQL', 'GraphQL', 'gRPC', 'TCP/IP', 'UDP',
    'OAuth', 'JWT', 'SAML', 'LDAP', 'RBAC',
    'DOM', 'SPA', 'PWA', 'SEO', 'CMS', 'CRM', 'ERP',
    'VR', 'AR', 'XR', 'VPN', 'CDN', 'DNS', 'SSL', 'TLS'
  ]
  
  // Check if it's a known acronym/special case
  const upperTrimmed = trimmed.toUpperCase()
  const foundSpecialCase = specialCases.find(sc => sc.toUpperCase() === upperTrimmed)
  if (foundSpecialCase) {
    return foundSpecialCase
  }
  
  // Check if entire string is all caps (likely an acronym)
  if (trimmed === trimmed.toUpperCase() && trimmed.length <= 6 && !/\s/.test(trimmed)) {
    return trimmed
  }
  
  // Handle compound technical terms
  const technicalPatterns = [
    { regex: /^node\.?js$/i, replacement: 'Node.js' },
    { regex: /^react\.?js$/i, replacement: 'React.js' },
    { regex: /^vue\.?js$/i, replacement: 'Vue.js' },
    { regex: /^angular\.?js$/i, replacement: 'Angular.js' },
    { regex: /^express\.?js$/i, replacement: 'Express.js' },
    { regex: /^next\.?js$/i, replacement: 'Next.js' },
    { regex: /^c\+\+$/i, replacement: 'C++' },
    { regex: /^c#$/i, replacement: 'C#' },
    { regex: /^\.net$/i, replacement: '.NET' },
    { regex: /^asp\.?net$/i, replacement: 'ASP.NET' },
    { regex: /^spring\s?boot$/i, replacement: 'Spring Boot' },
    { regex: /^react\s?native$/i, replacement: 'React Native' },
    { regex: /^machine\s?learning$/i, replacement: 'Machine Learning' },
    { regex: /^artificial\s?intelligence$/i, replacement: 'Artificial Intelligence' },
    { regex: /^user\s?experience$/i, replacement: 'User Experience' },
    { regex: /^user\s?interface$/i, replacement: 'User Interface' },
    { regex: /^data\s?science$/i, replacement: 'Data Science' },
    { regex: /^full[\s\-]?stack$/i, replacement: 'Full Stack' },
    { regex: /^front[\s\-]?end$/i, replacement: 'Front End' },
    { regex: /^back[\s\-]?end$/i, replacement: 'Back End' },
    { regex: /^test[\s\-]?driven\s?development$/i, replacement: 'Test Driven Development' },
    { regex: /^agile$/i, replacement: 'Agile' },
    { regex: /^scrum$/i, replacement: 'Scrum' },
    { regex: /^kanban$/i, replacement: 'Kanban' }
  ]
  
  for (const pattern of technicalPatterns) {
    if (pattern.regex.test(trimmed)) {
      return pattern.replacement
    }
  }
  
  // Default title case for regular words
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (word.length === 0) return word
      
      // Keep certain small words lowercase in the middle of phrases
      const smallWords = ['and', 'or', 'of', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'to']
      if (smallWords.includes(word.toLowerCase()) && index !== 0) {
        return word.toLowerCase()
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Validates if a skill is acceptable for adding
 * @param skill - Skill to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateSkill(skill: string): { isValid: boolean; error?: string } {
  if (!skill || typeof skill !== 'string') {
    return { isValid: false, error: 'Skill cannot be empty' }
  }
  
  const trimmed = skill.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Skill cannot be empty' }
  }
  
  if (trimmed.length > 60) {
    return { isValid: false, error: 'Skill name too long (max 60 characters)' }
  }
  
  // Check for invalid characters
  if (!/^[a-zA-Z0-9\s\-\+\.\/#&]+$/.test(trimmed)) {
    return { isValid: false, error: 'Skill contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validates if a skills array is acceptable 
 * @param skills - Array of skills to validate
 * @param maxCount - Maximum allowed number of skills (default: 100)
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateSkillsArray(skills: string[], maxCount: number = 100): { isValid: boolean; error?: string } {
  if (!Array.isArray(skills)) {
    return { isValid: false, error: 'Skills must be an array' }
  }
  
  if (skills.length > maxCount) {
    return { isValid: false, error: `Too many skills (max ${maxCount})` }
  }
  
  // Check each skill individually
  for (const skill of skills) {
    const validation = validateSkill(skill)
    if (!validation.isValid) {
      return validation
    }
  }
  
  return { isValid: true }
}