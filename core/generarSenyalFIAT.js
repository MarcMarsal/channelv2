// generarSenyalFIAT

export async function generarSenyalFIAT(db, symbol, timestamp, accio, open, close, upper, lower) {
    await db.query(`
        INSERT INTO signals_fiat (
            symbol, timestamp, accio, open, close, upper, lower, created_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            EXTRACT(EPOCH FROM NOW()) * 1000
        )
    `, [
        symbol, timestamp, accio, open, close, upper, lower
    ]);
}
