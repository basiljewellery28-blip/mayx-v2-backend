require('dotenv').config();
const db = require('./db');

const updates = [
    {
        sku: '9724Y',
        name: 'Protea Diamond Solitaire Stud Earrings',
        description: 'Inspired by our national flower, the Protea. This quintessentially South African piece is a symbol of strength and resilience.',
        price: 72000.00
    },
    {
        sku: '9722P',
        name: 'Protea Diamond Solitaire Stud Earrings',
        description: 'Inspired by our national flower, the Protea. This quintessentially South African piece is a symbol of strength and resilience.',
        price: 44995.00
    },
    {
        sku: '9726P',
        name: 'Protea Diamond Solitaire Stud Earrings',
        description: 'Inspired by our national flower, the Protea. This quintessentially South African piece is a symbol of strength and resilience.',
        price: 155000.00
    }
];

const updateDiamondStuds = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        for (const update of updates) {
            console.log(`🔄 Updating ${update.sku}...`);
            const res = await db.query(
                `UPDATE products SET 
                    name = $1, description = $2, price = $3
                 WHERE sku = $4`,
                [update.name, update.description, update.price, update.sku]
            );

            if (res.rowCount > 0) {
                console.log(`✅ Updated ${update.sku}`);
            } else {
                console.log(`⚠️ Product ${update.sku} not found`);
            }
        }

        console.log('✅ Diamond Studs update complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating Diamond Studs:', error);
        process.exit(1);
    }
};

updateDiamondStuds();
