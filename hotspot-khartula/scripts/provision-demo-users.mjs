/**
 * Skrip provisioning 3 akun demo (Admin, Petugas, Pelapor) ke Supabase Auth & public.profiles,
 * lalu menuliskan kredensial secara aman ke file .env.local tanpa mencetak password ke terminal.
 *
 * Prasyarat environment (.env.local atau shell):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-only, JANGAN pernah di-commit)
 *
 * Jalankan dari direktori hotspot-khartula:
 *   node --env-file=.env.local scripts/provision-demo-users.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    emailEnv: "DEMO_ADMIN_EMAIL",
    passEnv: "DEMO_ADMIN_PASSWORD",
    email: "admin.demo@hotmap.local",
    fullName: "Demo Admin HotMap",
  },
  {
    role: "petugas",
    emailEnv: "DEMO_PETUGAS_EMAIL",
    passEnv: "DEMO_PETUGAS_PASSWORD",
    email: "petugas.demo@hotmap.local",
    fullName: "Demo Petugas HotMap",
  },
  {
    role: "pelapor",
    emailEnv: "DEMO_PELAPOR_EMAIL",
    passEnv: "DEMO_PELAPOR_PASSWORD",
    email: "pelapor.demo@hotmap.local",
    fullName: "Demo Pelapor HotMap",
  },
];

function generateStrongPassword() {
  return `Hm!${crypto.randomBytes(18).toString("base64url")}9a`;
}

function upsertEnvValues(envPath, updates) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const lines = content ? content.split(/\r?\n/) : [];
  const handled = new Set();

  const updatedLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match) return line;
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      handled.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  const missingKeys = Object.keys(updates).filter((k) => !handled.has(k));
  if (missingKeys.length > 0) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
      updatedLines.push("");
    }
    updatedLines.push("# Fast Login Demo Accounts (auto-generated locally)");
    for (const k of missingKeys) {
      updatedLines.push(`${k}=${updates[k]}`);
    }
  }

  fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Gagal: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di environment/.env.local."
    );
    process.exit(1);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: listData, error: listError } =
    await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    console.error("Gagal membaca daftar pengguna Supabase Auth:", listError.message);
    process.exit(1);
  }

  const existingByEmail = new Map(
    (listData?.users ?? []).map((u) => [String(u.email).toLowerCase(), u])
  );

  const envUpdates = {
    ENABLE_FAST_LOGIN: "true",
  };

  for (const account of DEMO_ACCOUNTS) {
    const password = generateStrongPassword();
    const existing = existingByEmail.get(account.email.toLowerCase());
    let userId = existing?.id;

    if (existing) {
      const { data, error } = await adminClient.auth.admin.updateUserById(
        existing.id,
        {
          password,
          email_confirm: true,
          user_metadata: { full_name: account.fullName },
          app_metadata: { role: account.role },
        }
      );
      if (error) {
        console.error(
          `Gagal memperbarui akun demo ${account.email}:`,
          error.message
        );
        process.exit(1);
      }
      userId = data.user.id;
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
        app_metadata: { role: account.role },
      });
      if (error) {
        console.error(`Gagal membuat akun demo ${account.email}:`, error.message);
        process.exit(1);
      }
      userId = data.user.id;
    }

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        role: account.role,
        full_name: account.fullName,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error(
        `Gagal menyinkronkan profil untuk ${account.email}:`,
        profileError.message
      );
      process.exit(1);
    }

    envUpdates[account.emailEnv] = account.email;
    envUpdates[account.passEnv] = password;

    console.log(
      `[OK] ${account.role.toUpperCase()} | email=${account.email} | uuid=${userId}`
    );
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  upsertEnvValues(envPath, envUpdates);
  console.log(
    "Kredensial demo berhasil ditulis ke .env.local (password tidak dicetak ke log)."
  );
}

main();
