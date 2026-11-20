-- =============================================================================
-- HotMap Fase 1.5: Seed Idempoten 3 Akun Demo (Admin, Petugas, Pelapor)
-- =============================================================================
-- PERHATIAN KEAMANAN:
--   1. Ganti placeholder password sebelum menjalankan di Supabase SQL Editor.
--   2. Jangan pernah menyimpan password asli ke dalam file repository ini.
--   3. Alternatif otomatis yang lebih aman: gunakan skrip
--      `hotspot-khartula/scripts/provision-demo-users.mjs` dengan
--      `SUPABASE_SERVICE_ROLE_KEY`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_demo RECORD;
  v_user_id uuid;
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  -- Ganti nilai di bawah ini sebelum eksekusi manual di Supabase SQL Editor:
  v_admin_pass text := 'REPLACE_WITH_STRONG_ADMIN_PASSWORD';
  v_petugas_pass text := 'REPLACE_WITH_STRONG_PETUGAS_PASSWORD';
  v_pelapor_pass text := 'REPLACE_WITH_STRONG_PELAPOR_PASSWORD';
BEGIN
  IF v_admin_pass LIKE 'REPLACE_WITH_%'
     OR v_petugas_pass LIKE 'REPLACE_WITH_%'
     OR v_pelapor_pass LIKE 'REPLACE_WITH_%' THEN
    RAISE EXCEPTION 'Ganti placeholder password akun demo sebelum menjalankan seed SQL ini.';
  END IF;

  FOR v_demo IN
    SELECT * FROM (
      VALUES
        ('admin.demo@hotmap.local', 'Demo Admin HotMap', 'admin', v_admin_pass),
        ('petugas.demo@hotmap.local', 'Demo Petugas HotMap', 'petugas', v_petugas_pass),
        ('pelapor.demo@hotmap.local', 'Demo Pelapor HotMap', 'pelapor', v_pelapor_pass)
    ) AS t(email, full_name, role_name, raw_password)
  LOOP
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_demo.email
    LIMIT 1;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      )
      VALUES (
        v_instance_id,
        v_user_id,
        'authenticated',
        'authenticated',
        v_demo.email,
        crypt(v_demo.raw_password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', v_demo.role_name),
        jsonb_build_object('full_name', v_demo.full_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_demo.email),
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    ELSE
      UPDATE auth.users
      SET
        encrypted_password = crypt(v_demo.raw_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_demo.role_name),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_demo.full_name),
        updated_at = now()
      WHERE id = v_user_id;
    END IF;

    INSERT INTO public.profiles (id, role, full_name)
    VALUES (v_user_id, v_demo.role_name::public.user_role, v_demo.full_name)
    ON CONFLICT (id) DO UPDATE
    SET
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name;
  END LOOP;
END $$;
