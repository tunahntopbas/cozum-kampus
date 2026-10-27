// Isolated PostgreSQL regression: node supabase/tests/staff-status.test.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
// No application database connection. Requires @electric-sql/pglite installed outside the repository.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create function private.auth_role() returns text language sql as $$ select current_setting('test.role', true) $$;
create function private.auth_unit() returns bigint language sql as $$ select nullif(current_setting('test.unit', true), '')::bigint $$;
create type public.report_status as enum ('alindi','yonlendirildi','atandi','islemde','cozuldu','yeniden_acildi','geri_cekildi');
create table reports(id bigint primary key, unit_id bigint, status report_status, reporter_id uuid, title text, resolved_at timestamptz);
create table report_media(id bigint generated always as identity, report_id bigint, kind text, storage_path text);
create table report_events(id bigint generated always as identity, report_id bigint, type text, actor_id uuid, payload jsonb);
create table notification_prefs(user_id uuid, types jsonb);
create table notifications(user_id uuid, type text, title text, body text, payload jsonb);
insert into reports values (1,1,'yonlendirildi','00000000-0000-0000-0000-000000000002','Lamp',null);
set test.uid = '00000000-0000-0000-0000-000000000001'; set test.role = 'staff'; set test.unit = '1';
`);
await db.exec(readFileSync(new URL('../migrations/20261028000011_report_notifications.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../migrations/20261028000013_staff_atomic_status.sql', import.meta.url), 'utf8'));
const call = async (from, to, path = null, ai = null, id = 1) => (await db.query('select staff_update_report_status($1,$2,$3,$4,$5,$6) as ok', [id, from, to, 'Fixed', ai, path])).rows[0].ok;
const count = async (table) => Number((await db.query(`select count(*) as n from ${table}`)).rows[0].n);
const status = async () => (await db.query('select status from reports where id=1')).rows[0].status;
assert.equal(await call('yonlendirildi', 'atandi', null, null, 999), false);
for (const role of ['student', 'security', '']) {
  await db.query("select set_config('test.role',$1,false)", [role]);
  await assert.rejects(call('yonlendirildi', 'atandi'), /Staff or admin required/);
}
await db.exec("set test.role = 'staff'; set test.unit = '2'");
await assert.rejects(call('yonlendirildi', 'atandi'), /another unit/);
await db.exec("set test.unit = '1'");
assert.equal(await call('alindi', 'atandi'), false);
await assert.rejects(call('yonlendirildi', 'cozuldu'), /Invalid staff status transition/);
assert.equal(await call('yonlendirildi', 'atandi'), true);
assert.equal(await count('report_events'), 1);
assert.equal(await count('notifications'), 1);
assert.equal(await call('yonlendirildi', 'atandi'), false);
// Event insert fails: neither status nor notification may survive.
await db.exec("alter table report_events add constraint fail_event check (payload->>'to' <> 'islemde')");
await assert.rejects(call('atandi', 'islemde'), /fail_event/);
assert.equal(await status(), 'atandi');
assert.equal(await count('notifications'), 1);
await db.exec('alter table report_events drop constraint fail_event');
// Notification trigger fails: event and status must both roll back.
await db.exec("alter table notifications add constraint fail_notification check (payload->>'to' <> 'islemde')");
await assert.rejects(call('atandi', 'islemde'), /fail_notification/);
assert.equal(await status(), 'atandi');
assert.equal(await count('report_events'), 1);
await db.exec('alter table notifications drop constraint fail_notification');
await db.exec("set test.role = 'admin'; set test.unit = '2'");
assert.equal(await call('atandi', 'islemde'), true);
assert.equal(await call('islemde', 'cozuldu'), false);
await db.exec("insert into report_media(report_id,kind,storage_path) values (1,'sonra','old.jpg'),(1,'sonra','new.jpg')");
assert.equal(await call('islemde', 'cozuldu', 'old.jpg', {resolved:true}), false);
assert.equal(await call('islemde', 'cozuldu', null, {resolved:true}), false);
assert.equal(await call('islemde', 'cozuldu', 'new.jpg', {resolved:false}), true);
assert.equal(await status(), 'cozuldu');
assert.equal(await count('notifications'), 3);
assert.equal((await db.query('select resolved_at is not null as ok from reports')).rows[0].ok, true);
const event = (await db.query("select payload from report_events where payload->>'to'='cozuldu'")).rows[0].payload;
assert.equal(event.ai, null); // Browser-supplied verdict is never trusted.
assert.equal(event.solution_path, 'new.jpg');
assert.equal(event.note, 'Fixed');
await db.close();
console.log('staff RPC: authorization, stale/missing, transitions, photo binding, events, notifications and rollback passed');
