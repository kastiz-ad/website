import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertExecutable, payloadHash } from "../functions/api/v1/_lib/approval.js";

test("approval hash changes when consequential action details change", async()=>{
  const first=await payloadHash({provider:"Demo Air",amount:100,currency:"KRW"});
  const changed=await payloadHash({provider:"Demo Air",amount:101,currency:"KRW"});
  assert.equal(first.length,64); assert.notEqual(first,changed);
});
test("execution rejects absent, expired, changed, and reused approval",()=>{
  const base={status:"approved",expires_at:new Date(Date.now()+60000).toISOString(),payload_hash:"a".repeat(64),consumed_at:null};
  assert.doesNotThrow(()=>assertExecutable(base,"a".repeat(64)));
  assert.throws(()=>assertExecutable(null,"a".repeat(64)),/explicit approval/);
  assert.throws(()=>assertExecutable({...base,expires_at:new Date(0).toISOString()},base.payload_hash),/expired/);
  assert.throws(()=>assertExecutable(base,"b".repeat(64)),/changed/);
  assert.throws(()=>assertExecutable({...base,consumed_at:new Date().toISOString()},base.payload_hash),/already been used/);
});
test("migration enables RLS and ownership policies for user-owned tables",async()=>{
  const sql=await readFile(new URL("../supabase/migrations/202607170001_secure_backend_v1.sql",import.meta.url),"utf8");
  for(const table of ["profiles","user_preferences","missions","mission_steps","mission_results","approval_requests","approval_decisions","consent_records","provider_connections","audit_events","account_deletion_requests","idempotency_keys"]) assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(sql,/auth\.uid\(\)/); assert.doesNotMatch(sql,/create policy .* using\s*\(true\)/i);
});
test("frontend has no privileged Supabase key",async()=>{
  const files=["../login.js","../js/config/authentication.js","../index.html"];
  for(const file of files){const source=await readFile(new URL(file,import.meta.url),"utf8");assert.doesNotMatch(source,/SUPABASE_SERVICE_ROLE_KEY|service_role/i);}
});
