// Spielt eine SQL-Datei gegen eine Postgres-/Supabase-Datenbank ein.
// Verbindung kommt aus der Umgebungsvariable PG_CONN (enthaelt das Passwort).
// Aufruf: node scripts/run-migration.mjs <pfad-zur-sql-datei>
import { readFileSync } from 'node:fs'
import pg from 'pg'

const conn = process.env.PG_CONN
const sqlPath = process.argv[2]

if (!conn) {
  console.error('Fehler: Umgebungsvariable PG_CONN ist nicht gesetzt.')
  process.exit(1)
}
if (!sqlPath) {
  console.error('Fehler: Pfad zur SQL-Datei fehlt.')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  // Supabase-Verbindungen koennen einen Moment brauchen.
  connectionTimeoutMillis: 20000,
})

try {
  console.log('Verbinde mit der Datenbank ...')
  await client.connect()
  console.log('Verbunden. Spiele Migration ein ...')
  await client.query(sql)
  console.log('✓ Migration erfolgreich eingespielt.')

  const tables = await client.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  )
  console.log(`\nTabellen in public (${tables.rowCount}):`)
  tables.rows.forEach((r) => console.log('  - ' + r.tablename))

  const policies = await client.query(
    "select count(*)::int as n from pg_policies where schemaname = 'public'",
  )
  console.log(`\nRLS-Policies in public: ${policies.rows[0].n}`)

  const triggers = await client.query(
    "select tgname from pg_trigger where tgname in ('on_auth_user_created','on_project_created')",
  )
  console.log(`Trigger gefunden: ${triggers.rows.map((r) => r.tgname).join(', ') || 'keine'}`)
} catch (e) {
  console.error('\n✗ FEHLER:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
