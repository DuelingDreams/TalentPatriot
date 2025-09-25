export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Unspecified'

export const PROFICIENCY_ORDER: Record<Proficiency, number> = {
  Expert: 4,
  Advanced: 3,
  Intermediate: 2,
  Beginner: 1,
  Unspecified: 0
}

export const PROFICIENCY_COLORS: Record<Proficiency, string> = {
  Expert: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Advanced: 'bg-amber-50 text-amber-700 ring-amber-200',
  Intermediate: 'bg-blue-50 text-blue-700 ring-blue-200',
  Beginner: 'bg-zinc-50 text-zinc-700 ring-zinc-200',
  Unspecified: 'bg-slate-50 text-slate-600 ring-slate-200'
}

// Skill interface for UI components
export interface SkillWithProficiency {
  name: string
  proficiency?: Proficiency
}

// Config type for enabling proficiency features
export interface SkillsConfig {
  enableProficiencyUI: boolean
  hasProficiencyData: boolean
}