/**
 * Skills normalization utilities for consistent skill management
 */

/**
 * Normalizes skills input into a clean, deduplicated, sorted array
 * 
 * Rules:
 * - Split strings on commas/newlines, trim whitespace
 * - Remove empty items
 * - Title-case words unless they're all-caps acronyms (e.g., AWS, CI/CD)
 * - Preserve proficiency levels in parentheses (e.g., "JavaScript (Advanced)")
 * - Deduplicate case-insensitively 
 * - Return sorted A→Z
 * 
 * @param input - String (comma/newline separated) or array of skills
 * @returns Clean, normalized array of skills
 */
export function normalizeSkills(input: string | string[]): string[] {
  if (!input) return []
  
  // Convert to array if string
  let skillsArray: string[]
  if (typeof input === 'string') {
    // Split on commas, newlines, and semicolons
    skillsArray = input
      .split(/[,\n\r;]+/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
  } else {
    skillsArray = input
      .map(skill => skill?.trim?.() || '')
      .filter(skill => skill.length > 0)
  }
  
  // Normalize each skill
  const normalizedSkills = skillsArray.map(skill => normalizeSkillText(skill))
  
  // Deduplicate case-insensitively
  const uniqueSkills = Array.from(
    new Map(
      normalizedSkills.map(skill => [skill.toLowerCase(), skill])
    ).values()
  )
  
  // Sort A→Z
  return uniqueSkills.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

/**
 * Combines a skill name with proficiency level into a formatted string
 * @param skillName - The skill name (e.g., "JavaScript")
 * @param proficiency - The proficiency level
 * @returns Formatted skill string (e.g., "JavaScript (Advanced)")
 */
export function combineSkillWithProficiency(skillName: string, proficiency?: string): string {
  if (!skillName?.trim()) return ''
  const normalizedName = normalizeSkillText(skillName)
  if (!proficiency || proficiency === 'Intermediate') {
    // Don't show "Intermediate" - it's the default
    return normalizedName
  }
  return `${normalizedName} (${proficiency})`
}

/**
 * Parses a skill string to extract name and proficiency
 * @param skillString - Skill string (e.g., "JavaScript (Advanced)" or "Python")
 * @returns Object with name and proficiency
 */
export function parseSkillString(skillString: string): { name: string; proficiency?: string } {
  if (!skillString?.trim()) return { name: '' }
  
  const trimmed = skillString.trim()
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/)
  
  if (match) {
    const [, name, proficiency] = match
    return {
      name: name.trim(),
      proficiency: proficiency.trim()
    }
  }
  
  return { name: trimmed, proficiency: 'Intermediate' }
}

/**
 * Normalizes a single skill text according to title-case rules
 * 
 * @param skill - Raw skill text
 * @returns Normalized skill text
 */
function normalizeSkillText(skill: string): string {
  if (!skill || typeof skill !== 'string') return ''
  
  const trimmed = skill.trim()
  if (!trimmed) return ''
  
  // Handle special cases for acronyms and technical terms
  const specialCases = [
    'API', 'REST', 'API', 'SQL', 'HTML', 'CSS', 'XML', 'JSON', 'HTTP', 'HTTPS',
    'AWS', 'GCP', 'Azure', 'CI/CD', 'DevOps', 'MLOps', 'UI/UX', 'IoT',
    'AI', 'ML', 'NLP', 'GPU', 'CPU', 'RAM', 'SSD', 'HDD',
    'iOS', 'macOS', 'Android', 'Linux', 'Windows', 'Unix',
    'PHP', 'SQL', 'NoSQL', 'GraphQL', 'gRPC', 'TCP/IP', 'UDP',
    'OAuth', 'JWT', 'SAML', 'LDAP', 'RBAC',
    'DOM', 'SPA', 'PWA', 'SEO', 'CMS', 'CRM', 'ERP',
    'VR', 'AR', 'XR', 'VPN', 'CDN', 'DNS', 'SSL', 'TLS'
  ]
  
  // Check if it's already a known acronym/special case
  const upperTrimmed = trimmed.toUpperCase()
  const foundSpecialCase = specialCases.find(sc => sc.toUpperCase() === upperTrimmed)
  if (foundSpecialCase) {
    return foundSpecialCase
  }
  
  // Check if the entire string is already all caps (likely an acronym)
  if (trimmed === trimmed.toUpperCase() && trimmed.length <= 6 && !/\s/.test(trimmed)) {
    return trimmed
  }
  
  // Handle compound technical terms (e.g., "node.js", "vue.js", "c++", "c#")
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
    .map(word => {
      if (word.length === 0) return word
      
      // Keep certain small words lowercase in the middle of phrases
      const smallWords = ['and', 'or', 'of', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'to']
      if (smallWords.includes(word.toLowerCase()) && trimmed.split(/\s+/).indexOf(word) !== 0) {
        return word.toLowerCase()
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Validates if a skill is acceptable for adding
 * 
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
 * 
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