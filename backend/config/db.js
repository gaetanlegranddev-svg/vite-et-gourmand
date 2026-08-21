import pkg from "pg";
const { Pool } = pkg;

console.log("DB CONFIG:", {
  host: "localhost",
  port: 5432,
  database: "vite_gourmand",
  user: "postgres",
  password: "Paris.123456*"
});

export const pool = new Pool({
  host:     "localhost",
  port:     5432,
  database: "vite_gourmand",
  user:     "postgres",
  password: "Paris.123456*",
});
