// Teste do fluxo de campanha num Postgres embutido (PGlite), sem tocar em produção.
// Rodar: npm i --no-save @electric-sql/pglite && node scripts/test-fluxo/fluxo.test.cjs
// Banco de teste: PGlite + imitação mínima do Supabase (roles, auth.uid(), auth.jwt(), storage)
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const MIG = require('path').join(__dirname, '../../src/supabase/migrations/');
async function boot(files) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create table auth.users (id uuid primary key, email text);
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean default false);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema auth, storage, public to anon, authenticated, service_role;
    grant execute on all functions in schema auth to anon, authenticated;
    grant all on storage.objects, storage.buckets to authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  for (const f of files) {
    let sql = fs.readFileSync(MIG + f, 'utf8').replace(/CREATE EXTENSION[^;]*;/gi, '').replace(/NOTIFY pgrst[^;]*;/gi, '');
    try { await db.exec(sql); } catch (e) { throw new Error(`${f}: ${e.message}`); }
  }
  return db;
}
// executa como um usuário (anon, ou authenticated com sub/email)
async function as(db, who, sql, params = []) {
  await db.exec('reset role');
  if (who === 'service') { await db.exec('set role service_role'); }
  else if (!who) { await db.exec(`select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '{}', false); set role anon`); }
  else { await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [who.sub, JSON.stringify({ sub: who.sub, email: who.email })]); await db.exec('set role authenticated'); }
  try { return (await db.query(sql, params)).rows; } finally { await db.exec('reset role'); }
}
module.exports = { boot, as };
