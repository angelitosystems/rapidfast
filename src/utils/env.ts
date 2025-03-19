/**
 * Obtiene el valor de una variable de entorno
 * @param key Nombre de la variable de entorno
 * @param defaultValue Valor por defecto si la variable no está definida
 * @param skipError Si es true, no lanzará un error cuando la variable no esté definida y no haya valor por defecto
 * @returns Valor de la variable de entorno o el valor por defecto
 */
export function env(key: string, defaultValue?: string, skipError: boolean = false): string {
  const value = process.env[key];
  
  if (value === undefined && defaultValue === undefined && !skipError) {
    throw new Error(`La variable de entorno ${key} no está definida`);
  }
  
  return value || defaultValue || '';
} 