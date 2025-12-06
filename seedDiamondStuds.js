require('dotenv').config();
const db = require('./db');

const diamondStuds = [
    {
        name: 'Protea Diamond Cluster Earrings - Large',
        sku: '9926WR',
        category: 'Earring',
        sub_category: 'Diamond Studs',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9926WR_1_85a1c88b-0d2e-472a-8027-1e79ee2e5162.png?v=1760685250&width=1600',
        description: 'Inspired by our national flower, the Protea. This quintessentially South African piece is a symbol of strength and resilience.',
        price: 85000.00
    },
    {
        name: 'Diamond Studs (9724Y)',
        sku: '9724Y',
        category: 'Earring',
        sub_category: 'Diamond Studs',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9724Y_2.png?v=1760584240&width=1600',
        description: 'Classic diamond studs.',
        price: 0.00 // Placeholder
    },
    {
        name: 'Diamond Studs (9722P)',
        sku: '9722P',
        category: 'Earring',
        sub_category: 'Diamond Studs',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9722P_2.png?v=1763635697&width=1600',
        description: 'Classic diamond studs.',
        price: 0.00 // Placeholder
    },
    {
        name: 'Diamond Studs (9726P)',
        sku: '9726P',
        category: 'Earring',
        sub_category: 'Diamond Studs',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9726P_2.png?v=1760583909&width=1600',
        description: 'Classic diamond studs.',
        price: 0.00 // Placeholder
    },
    {
        name: 'Protea Diamond Solitaire Stud Earrings',
        sku: '9731',
        category: 'Earring',
        sub_category: 'Diamond Studs',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9731_2.png?v=1760584160&width=1600',
        description: 'Inspired by our national flower, the Protea.',
        price: 45000.00
    }
];

const seedDiamondStuds = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        for (const product of diamondStuds) {
            // Check if exists
            const existing = await db.query('SELECT id FROM products WHERE sku = $1', [product.sku]);

            if (existing.rows.length > 0) {
                console.log(`⚠️ Product ${product.sku} already exists. Updating...`);
                await db.query(
                    `UPDATE products SET 
                        name = $1, category = $2, sub_category = $3, image_url = $4, description = $5, price = $6, active = true
                     WHERE sku = $7`,
                    [product.name, product.category, product.sub_category, product.image_url, product.description, product.price, product.sku]
                );
            } else {
                console.log(`➕ Inserting ${product.sku}...`);
                await db.query(
                    `INSERT INTO products (name, sku, category, sub_category, image_url, description, price) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [product.name, product.sku, product.category, product.sub_category, product.image_url, product.description, product.price]
                );
            }
        }

        console.log('✅ Diamond Studs seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Diamond Studs:', error);
        process.exit(1);
    }
};

seedDiamondStuds();
