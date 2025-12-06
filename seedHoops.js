require('dotenv').config();
const db = require('./db');

const hoops = [
    {
        name: 'Diamond Chunky Hoop Earrings - Large',
        sku: '9487T',
        category: 'Earring',
        sub_category: 'Hoops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9487T_1.png?v=1760585830',
        description: 'Diamonds symbolise love, strength and purity.',
        price: 205000.00
    },
    {
        name: 'Diamond Hoop Earrings - Small',
        sku: '9812WR9',
        category: 'Earring',
        sub_category: 'Hoops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9812WR9_1.png?v=1760684909',
        description: 'Diamonds symbolise love, strength and purity.',
        price: 16995.00
    },
    {
        name: 'Blue Kashmir Sapphire and Diamond Bubble Hoop Earrings',
        sku: '9837BSWR14',
        category: 'Earring',
        sub_category: 'Hoops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9837BSWR14_1.png?v=1760593108',
        description: 'Kashmir Sapphires are highly valuable due to their rare, velvety blue colour and scarcity. Long believed to possess heavenly powers, it is said that blue sapphire offers the wearer protection.',
        price: 36995.00
    },
    {
        name: 'Ribbon Hoop Earrings',
        sku: '9497W',
        category: 'Earring',
        sub_category: 'Hoops',
        image_url: 'https://brownsjewellers.com/cdn/shop/files/9497W_1.png?v=1760598328',
        description: 'Diamonds symbolise love, strength and purity.',
        price: 15995.00
    }
];

const seedHoops = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        for (const product of hoops) {
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

        console.log('✅ Hoops seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding Hoops:', error);
        process.exit(1);
    }
};

seedHoops();
