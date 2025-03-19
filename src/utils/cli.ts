/**
 * Verifica si la aplicación está ejecutándose en modo CLI
 * @returns true si estamos en modo CLI, false en caso contrario
 */
export function isCliMode(): boolean {
  const args = process.argv.slice(2);
  return args.length > 0 && (
    args.includes('new') || 
    args.includes('generate') || 
    args.includes('g') ||
    args.includes('n')
  );
} 