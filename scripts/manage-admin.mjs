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

async function listUsers() {
  const db = getDb();
  console.log(`\n📋 Querying users from ${db.type === 'postgres' ? 'Neon Postgres' : 'SQLite'}...\n`);

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
      rows.map((u) => ({
        ID: u.id,
        Name: u.name,
        Username: u.username || '—',
        Email: u.email,
        Role: u.role || 'user',
        Created: u.createdAt || u.created_at,
      }))
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
  const validRoles = ['user', 'admin', 'root'];
  if (!validRoles.includes(normalizedRole)) {
    console.warn(`Warning: '${normalizedRole}' is not in standard roles (user, admin, root), but applying anyway.`);
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

const [,, command, arg1, arg2] = process.argv;

switch (command) {
  case 'list':
    listUsers();
    break;
  case 'set-role':
    setRole(arg1, arg2);
    break;
  default:
    console.log(`
Buddy Line User Role Management CLI:

Commands:
  node scripts/manage-admin.mjs list
      List all registered users and their current roles

  node scripts/manage-admin.mjs set-role <email-or-username> <admin|root|user>
      Promote or assign a role to a user
`);
    break;
}
