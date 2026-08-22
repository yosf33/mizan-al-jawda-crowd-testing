const isPostgresUrl = (connectionString: string) => /^postgres(?:ql)?:\/\//i.test(connectionString);

export function resolvePostgresDatabaseUrl(readEnvironment = (name: string) => process.env[name]?.trim() || "") {
  const configured = readEnvironment("DATABASE_URL");

  if (isPostgresUrl(configured)) {
    return configured;
  }

  return readEnvironment("SUPABASE_DATABASE_URL");
}

export function requirePostgresDatabaseUrl(readEnvironment?: (name: string) => string) {
  const databaseUrl = resolvePostgresDatabaseUrl(readEnvironment);

  if (!databaseUrl) {
    throw new Error("A PostgreSQL DATABASE_URL is required to run Drizzle commands");
  }

  return databaseUrl;
}
