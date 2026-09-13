// db/postgres_pool.js
// Descripció:
// Crea el pool de connexió PostgreSQL per Railway → SSL activat → reutilització de connexions.
// Exporta `pool` per tots els repositoris.

import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,            // connexions simultànies FIAT
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Log FIAT PUR per confirmar connexió
pool.on('connect', () => {
    console.log('[PostgreSQL] Pool connectat a Railway');
});

pool.on('error', (err) => {
    console.error('[PostgreSQL ERROR]', err.message);
});
