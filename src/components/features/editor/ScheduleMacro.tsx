const Macros = {
  '@annually': 'Every year (macro)',
  '@daily': 'Every day (macro)',
  '@hourly': 'Every hour (macro)',
  '@monthly': 'Every month (macro)',
  '@reboot': 'After reboot (macro)',
  '@weekly': 'Every week (macro)',
  '@yearly': 'Every year (macro)',
};

const SystemdMacros = {
  annually: 'Every year (macro)',
  daily: 'Every day (macro)',
  hourly: 'Every hour (macro)',
  midnight: 'Every day (macro)',
  minutely: 'Every minute (macro)',
  monthly: 'Every month (macro)',
  quarterly: 'Every 3 month (macro)',
  weekly: 'Every week (macro)',
  yearly: 'Every year (macro)',
};

export function ScheduleMacro() {
  return <div class="rounded-lg border border-separator">
    <div class="border-separator border-b p-4">
      <p class="font-medium text-content-secondary text-sm">Macros</p>
    </div>
  </div>
}
