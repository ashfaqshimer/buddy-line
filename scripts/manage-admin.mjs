import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';

// Automatically load .env if present
if (fs.existsSync('.env')) {
  const content = fs.readFileSync('.env', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

function getDb() {
  if (dbUrl) {
    return {
      type: 'postgres',
      client: new Pool({ connectionString: dbUrl }),
    };
  } else {
    return {
      type: 'sqlite',
      client: new DatabaseSync('buddy_line.sqlite'),
    };
  }
}

function isRootIdentifier(identifier, email, username, role) {
  if (role && role.toLowerCase() === 'root') return true;
  const rootTarget = (process.env.ROOT_USER || '').trim().toLowerCase();
  const rootEmails = (process.env.ROOT_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanId = (identifier || '').trim().toLowerCase();

  if (rootTarget && (cleanId === rootTarget || cleanEmail === rootTarget || cleanUsername === rootTarget)) {
    return true;
  }
  if (cleanEmail && rootEmails.includes(cleanEmail)) {
    return true;
  }
  if (cleanUsername === 'root' || cleanEmail === 'root' || cleanEmail === 'root@buddyline.local' || cleanEmail === 'root@buddyline.com') {
    return true;
  }
  return false;
}

async function listUsers() {
  const db = getDb();
  console.log(`\n📋 Querying users from ${db.type === 'postgres' ? 'Neon Postgres' : 'SQLite'}...\n`);
  if (process.env.ROOT_USER) {
    console.log(`👑 Designated ROOT_USER: ${process.env.ROOT_USER}\n`);
  }

  try {
    let rows = [];
    if (db.type === 'postgres') {
      const res = await db.client.query('SELECT id, name, email, username, role, "createdAt" FROM "user" ORDER BY "createdAt" DESC');
      rows = res.rows;
      await db.client.end();
    } else {
      rows = db.client.prepare('SELECT id, name, email, username, role, createdAt FROM user ORDER BY createdAt DESC').all();
    }

    if (rows.length === 0) {
      console.log('No users registered yet. Sign up through the app to create a user account!');
      return;
    }

    console.table(
      rows.map((u) => {
        const isRoot = isRootIdentifier(null, u.email, u.username, u.role);
        return {
          ID: u.id,
          Name: u.name,
          Username: u.username || '—',
          Email: u.email,
          Role: isRoot ? '👑 root (owner)' : u.role || 'user',
          Created: u.createdAt || u.created_at,
        };
      })
    );
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
}

async function setRole(identifier, role) {
  if (!identifier || !role) {
    console.error('Usage: node scripts/manage-admin.mjs set-role <email-or-username> <role>');
    process.exit(1);
  }

  const normalizedRole = role.toLowerCase().trim();
  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(normalizedRole)) {
    console.warn(`Warning: '${normalizedRole}' is not 'admin' or 'user', but applying anyway.`);
  }

  if (isRootIdentifier(identifier) && normalizedRole !== 'admin') {
    console.error(`❌ Action prohibited: Cannot demote the designated ROOT_USER ('${identifier}').`);
    process.exit(1);
  }

  const db = getDb();
  console.log(`Setting role '${normalizedRole}' for user '${identifier}' on ${db.type === 'postgres' ? 'Neon Postgres' : 'SQLite'}...`);

  try {
    let updated = 0;
    if (db.type === 'postgres') {
      const res = await db.client.query(
        'UPDATE "user" SET role = $1 WHERE LOWER(email) = LOWER($2) OR LOWER(username) = LOWER($2) RETURNING id, name, email, role',
        [normalizedRole, identifier]
      );
      updated = res.rowCount;
      if (updated > 0) {
        console.log(`✅ Success! Updated user:`, res.rows[0]);
      }
      await db.client.end();
    } else {
      const info = db.client.prepare(
        'UPDATE user SET role = ? WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)'
      ).run(normalizedRole, identifier, identifier);
      updated = Number(info.changes);
      if (updated > 0) {
        const user = db.client.prepare('SELECT id, name, email, username, role FROM user WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)').get(identifier, identifier);
        console.log(`✅ Success! Updated user:`, user);
      }
    }

    if (updated === 0) {
      console.error(`❌ User '${identifier}' was not found. Please make sure the email or username matches.`);
    }
  } catch (err) {
    console.error('Error setting user role:', err.message);
  }
}

async function setEmail(identifier, newEmail) {
  if (!identifier || !newEmail) {
    console.error('Usage: node scripts/manage-admin.mjs set-email <username-or-current-email> <new-email>');
    process.exit(1);
  }

  const normalizedEmail = newEmail.toLowerCase().trim();
  const db = getDb();
  console.log(`Setting email '${normalizedEmail}' for user '${identifier}' on ${db.type === 'postgres' ? 'Neon Postgres' : 'SQLite'}...`);

  try {
    let updated = 0;
    if (db.type === 'postgres') {
      const res = await db.client.query(
        'UPDATE "user" SET email = $1 WHERE LOWER(email) = LOWER($2) OR LOWER(username) = LOWER($2) RETURNING id, name, username, email, role',
        [normalizedEmail, identifier]
      );
      updated = res.rowCount;
      if (updated > 0) {
        console.log(`✅ Success! Updated user email:`, res.rows[0]);
      }
      await db.client.end();
    } else {
      const info = db.client.prepare(
        'UPDATE user SET email = ? WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)'
      ).run(normalizedEmail, identifier, identifier);
      updated = Number(info.changes);
      if (updated > 0) {
        const user = db.client.prepare('SELECT id, name, username, email, role FROM user WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)').get(normalizedEmail, normalizedEmail);
        console.log(`✅ Success! Updated user email:`, user);
      }
    }

    if (updated === 0) {
      console.error(`❌ User '${identifier}' was not found.`);
    }
  } catch (err) {
    console.error('Error setting email:', err.message);
  }
}

const [,, command, arg1, arg2] = process.argv;

switch (command) {
  case 'list':
    listUsers();
    break;
  case 'set-role':
    setRole(arg1, arg2);
    break;
  case 'set-email':
    setEmail(arg1, arg2);
    break;
  default:
    console.log(`
Buddy Line User Role Management CLI:

Commands:
  node scripts/manage-admin.mjs list
      List all registered users and their current roles

  node scripts/manage-admin.mjs set-role <email-or-username> <admin|user>
      Promote or assign a role to a user

  node scripts/manage-admin.mjs set-email <email-or-username> <new-email>
      Update or link a real email address to an existing user
`);
    break;
}
