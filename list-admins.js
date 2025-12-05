
const { createConnection } = require('mysql2/promise');

async function listAdmins() {
  try {
    const connection = await createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const [rows] = await connection.execute(
      "SELECT id, name, email, role, tenant_id FROM users WHERE role IN ('admin', 'master_admin') LIMIT 10"
    );

    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

listAdmins();
