import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

export async function database(){
  const db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
    insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
  await db.exec(await fs.readFile(new URL('../../supabase/migrations/001_private_programs.sql',import.meta.url),'utf8'));
  return db;
}
