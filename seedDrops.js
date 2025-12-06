require('dotenv').config();
const db = require('./db');

const drops = [
    {
        name: 'Journey Diamond Drop Earrings - Medium',
        sku: '9960WR',
        category: 'Earring',
        sub_category: 'Drops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9960WR_1.png?v=1760585508',
        description: 'Diamonds set in a graduated sequence, symbolises how your love grows and becomes more meaningful over time.',
        price: 125000.00
    },
    {
        name: 'Journey Trilogy Diamond Drop Earrings - Medium',
        sku: '9874WR',
        category: 'Earring',
        sub_category: 'Drops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9874WR_1.png?v=1760585412',
        description: 'Diamonds set in a graduated sequence, symbolises how your love grows and becomes more meaningful over time.',
        price: 92000.00
    },
    {
        name: 'Protea Morganite and Diamond Cluster Earrings',
        sku: '9404MGR',
        category: 'Earring',
        sub_category: 'Drops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9404MGR.png?v=1760583874',
        description: 'Symbolic of reciprocal love, where the wearer receives and gives love in equal measure.',
        price: 29995.00
    },
    {
        name: 'Wild Flower Earrings',
        sku: '9913W',
        category: 'Earring',
        sub_category: 'Drops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9913W_1_3d90b5e0-02ec-4fdd-be7a-09f937739d17.png?v=1760685442',
        description: 'For the spirited woman who speaks her mind.',
        price: 92000.00
    }
];

const seedDrops = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        for (const product of drops) {
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

        console.log('✅ Drops seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Drops:', error);
        process.exit(1);
    }
};

seedDrops();
