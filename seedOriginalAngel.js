require('dotenv').config();
const db = require('./db');

const originalAngel = [
    {
        name: 'Original Angel Halo Diamond Earrings - Large',
        sku: '9401T',
        category: 'Earring',
        sub_category: 'Original Angel',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9401T_1.png?v=1760584862',
        description: 'A celebration and shining expression of love. Inspired by the great love story of our founder, Grandpa Jack and his wife, Granny Kate—and the first piece of jewellery he ever made for her, in 1934.',
        price: 355000.00
    },
    {
        name: 'Contemporary Angel Halo Diamond Earrings - Large',
        sku: '9903WR',
        category: 'Earring',
        sub_category: 'Original Angel',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9903WR_1.png?v=1760586123',
        description: 'Inspired by our heritage and the story of the Browns Original Angel.',
        price: 115000.00
    },
    {
        name: 'Original Angel Halo Diamond Earrings - Medium',
        sku: '9400T',
        category: 'Earring',
        sub_category: 'Original Angel',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9400T_1.png?v=1760584850',
        description: 'A celebration and shining expression of love. Inspired by the great love story of our founder, Grandpa Jack and his wife, Granny Kate—and the first piece of jewellery he ever made for her, in 1934.',
        price: 120000.00
    },
    {
        name: 'Contemporary Angel Halo Diamond Earrings - Medium',
        sku: '9902WR',
        category: 'Earring',
        sub_category: 'Original Angel',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9902WR_1.png?v=1760586100',
        description: 'Inspired by our heritage and the story of the Browns Original Angel.',
        price: 58000.00
    }
];

const seedOriginalAngel = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        for (const product of originalAngel) {
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

        console.log('✅ Original Angel seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Original Angel:', error);
        process.exit(1);
    }
};

seedOriginalAngel();
