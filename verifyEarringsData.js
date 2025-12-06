require('dotenv').config();
const db = require('./db');

const verifyEarrings = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        const res = await db.query(`
            SELECT sku, name, sub_category, image_url 
            FROM products 
            WHERE category = 'Earring' 
            ORDER BY sub_category, sku
        `);

        const fs = require('fs');
        const path = require('path');

        let output = '\n--- EARRING PRODUCTS IN DB ---\n';
        let currentSubCat = '';
        res.rows.forEach(p => {
            if (p.sub_category !== currentSubCat) {
                output += `\n[${p.sub_category}]\n`;
                currentSubCat = p.sub_category;
            }
            output += `  SKU: ${p.sku.padEnd(12)} | Name: ${p.name.padEnd(50)} | Image: ${p.image_url ? '✅ Present' : '❌ MISSING'}\n`;
            if (p.image_url) output += `    -> ${p.image_url}\n`;
        });
        output += '\n------------------------------\n';

        fs.writeFileSync(path.join(__dirname, 'earrings_verification.txt'), output);
        console.log('✅ Verification data written to earrings_verification.txt');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying earrings:', error);
        process.exit(1);
    }
};

verifyEarrings();
