import { pool } from "./backend/config/db.js"; pool.query("SELECT unnest(enum_range(NULL::order_status))").then(r => { console.log(JSON.stringify(r.rows)); pool.end(); });
