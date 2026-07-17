-- Fictional development data only. Run after creating test users through Supabase Auth.
-- Never seed production with real personal information or passwords.
insert into public.audit_events(actor_type,event_type,privacy_safe_metadata)
values ('system','secure_backend_seeded','{"fictional":true}'::jsonb);
