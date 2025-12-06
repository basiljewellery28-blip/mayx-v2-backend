require('dotenv').config();
const db = require('./db');

const cleanDiamondStuds = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        // List of SKUs/Names to remove
        const targets = [
            'STUD004', // Angel Halo Diamond Studs
            'STUD001', // Classic Round Brilliant Diamond Studs
            '9903WR',  // Contemporary Angel Halo Diamond Earrings
            'STUD002'  // Princess Cut Diamond Studs
        ];

        for (const target of targets) {
            console.log(`🗑️ Attempting to remove product with SKU: ${target}...`);
            const res = await db.query("DELETE FROM products WHERE sku = $1", [target]);
            if (res.rowCount > 0) {
                console.log(`✅ Removed ${res.rowCount} product(s) with SKU: ${target}`);
            } else {
                console.log(`⚠️ No product found with SKU: ${target}`);
            }
        }

        // Also try removing by name just in case SKU doesn't match exactly but name does
        const nameTargets = [
            'Angel Halo Diamond Studs',
            'Classic Round Brilliant Diamond Studs',
            'Contemporary Angel Halo Diamond Earrings',
            'Princess Cut Diamond Studs'
        ];

        for (const name of nameTargets) {
            console.log(`🗑️ Attempting to remove product with Name: ${name}...`);
            const res = await db.query("DELETE FROM products WHERE name = $1", [name]);
            if (res.rowCount > 0) {
                console.log(`✅ Removed ${res.rowCount} product(s) with Name: ${name}`);
            }
        }

        console.log('✅ Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning products:', error);
        process.exit(1);
    }
};

cleanDiamondStuds();
