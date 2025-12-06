require('dotenv').config();
const db = require('./db');

const checkDiamondStuds = async () => {
    try {
        if (db.initPromise) {
            await db.initPromise;
        }

        const res = await db.query("SELECT id, name, sku, sub_category FROM products WHERE sub_category = 'Diamond Studs'");
        console.log('Current Diamond Studs in DB:');
        console.table(res.rows);
        process.exit(0);
    } catch (error) {
        console.error('Error checking products:', error);
        process.exit(1);
    }
};

checkDiamondStuds();
