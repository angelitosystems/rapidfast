import { DatabaseConfig, DatabaseConnectionConfig, DatabaseType } from '../interfaces/database.interface';

/**
 * Obtiene la configuración de conexión para un tipo de base de datos específico
 * @param config Configuración de base de datos
 * @param connectionName Nombre de la conexión (opcional, usa la conexión por defecto si no se especifica)
 * @returns Configuración de conexión normalizada
 */
export function getConnectionConfig(
  config: DatabaseConfig,
  connectionName?: string
): DatabaseConnectionConfig {
  if (config.connections) {
    const name = connectionName || config.default;
    if (!name || !config.connections[name]) {
      throw new Error(`La conexión "${name}" no está definida en la configuración`);
    }
    return config.connections[name];
  }

  return config as DatabaseConnectionConfig;
}

/**
 * Normaliza la configuración de conexión para asegurar que tenga todos los campos necesarios
 * @param config Configuración de conexión
 * @returns Configuración de conexión normalizada
 */
export function normalizeConnectionConfig(
  config: DatabaseConnectionConfig
): DatabaseConnectionConfig {
  const normalizedConfig = { ...config };

  // Si driver está presente pero type no, usar driver como type
  if (!normalizedConfig.type && normalizedConfig.driver) {
    // Convertir mysql2 a mysql para TypeORM
    if (normalizedConfig.driver === 'mysql2') {
      normalizedConfig.type = 'mysql';
    } else {
      normalizedConfig.type = normalizedConfig.driver as DatabaseType;
    }
  }

  // Configuración del pool por defecto
  if (!normalizedConfig.pool) {
    normalizedConfig.pool = {
      min: 0,
      max: 10,
      idleTimeoutMillis: 30000
    };
  }

  return normalizedConfig;
} 