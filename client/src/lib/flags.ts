export const flags = {
  jobBoardDistribution: (import.meta.env.VITE_ENABLE_JOB_BOARD_DISTRIBUTION ?? 'false') === 'true',
  showStartFree: (import.meta.env.VITE_SHOW_START_FREE ?? 'false') === 'true',
};