require('dotenv').config();
const db = require('./db/Index.js');

console.log('✅ db/Index.js loaded successfully');

(async () => {
    try {
        console.log('⏳ Testing DB connection...');
        // Wait for init if needed (though db/Index.js starts it immediately)
        if (db.initPromise) await db.initPromise;

        const res = await db.query('SELECT NOW() as now');
        console.log('✅ DB Connected! Current time:', res.rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('❌ DB Connection failed:', err);
        process.exit(1);
    }
})();
