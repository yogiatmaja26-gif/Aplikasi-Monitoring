import initSqlJs from 'sql.js';
import fs from 'fs';

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);");
  db.run("INSERT INTO test (name) VALUES ('Samara RAP');");
  const res = db.exec("SELECT * FROM test;");
  console.log("Result:", JSON.stringify(res));
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('data/test.db', buffer);
  console.log("Successfully wrote data/test.db, size:", buffer.length);
}

test().catch(console.error);
