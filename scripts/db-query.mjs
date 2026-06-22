// Fuehrt eine einzelne SQL-Anweisung aus PG_SQL gegen PG_CONN aus und gibt
// die Zeilen als JSON aus. Nur fuer Diagnose/Setup.
import pg from 'pg'

const client = new pg.Client({
  connectionString: process.env.PG_CONN,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
})
try {
  await client.connect()
  const res = await client.query(process.env.PG_SQL)
  console.log(JSON.stringify({ rowCount: res.rowCount, rows: res.rows }, null, 2))
} catch (e) {
  console.error('FEHLER:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
