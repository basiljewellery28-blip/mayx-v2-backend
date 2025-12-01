require('dotenv').config();
const db = require('./db/Index.js');

const PRODUCTS = [
    // Mens Wedding Bands
    { name: 'Classic Comfort Fit (Platinum)', sku: '9754P', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/9754P_1.png?v=1760963607&width=1600' },
    { name: 'Faceted Honeycomb (Yellow Gold)', sku: '9756Y', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/9756Y_1.png?v=1760760281' },
    { name: 'Ergo Band 4.5mm (Yellow Gold)', sku: 'E502Y', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/E502Y_1_ef4cba22-fa20-4654-a6fb-2b422bd58bbd.png?v=1761318019' },
    { name: 'Ergo Band 4.5mm (Rose Gold)', sku: 'E502R', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/E502R_1.png?v=1761317959&width=1600' },
    { name: 'Hercules Diamond (Yellow Gold)', sku: '5185YYY', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/5185YYY_1.png?v=1760661894' },
    { name: 'Invictus Band (White Gold)', sku: '9525WWW9', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/9525WWW9_1.png?v=1760661931&width=1600' },
    { name: 'Invictus Band (Yellow Gold)', sku: '9525YWY9', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/9525YWY9_1.png?v=1760661931&width=1600' },
    { name: 'Hercules Diamond (White Gold)', sku: '5185WWW', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/5185W_1.png?v=1760661863&width=1600' },
    { name: 'Ergo Band 5.5mm (Platinum)', sku: 'E503P', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/E503P_1.png?v=1760963607&width=1600' },
    { name: 'Chisel Band (White Gold)', sku: '9748W9', category: 'Ring', sub_category: 'Mens Wedding Bands', image_url: 'https://brownsjewellers.com/cdn/shop/files/9748W9_1.png?v=1760963607&width=1600' },

    // Dress Rings
    { name: 'Protea Blue Sapphire Eternity', sku: '9500BSWR14', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9500BST_1_2c6ea06c-e3da-4261-b684-77e32a835e38.png?v=1760660103' },
    { name: 'Protea Diamond Cluster Grand', sku: '9845T', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9845T_1_7264fc2a-3b64-4be4-a28a-d1199a5c211c.png?v=1760660408' },
    { name: 'Royal Tanzanite & Diamond', sku: 'MC9436T', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/MC9436T_1_3b382156-b84e-464e-a7e0-ebee15c0fda8.png?v=1760660754' },
    { name: 'Chorus Diamond Ring', sku: '10046W', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/10046W_1.png?v=1760660671' },
    { name: 'Royal Tanzanite Cluster Small', sku: '9582T', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9582T_1_c2bc2cbc-9ddb-4f58-9a5c-6ecb11cee766.png?v=1760660265' },
    { name: 'Original Angel Diamond Pavé', sku: '9492W', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9492W_1_e5cf34c2-1334-4eb8-a89a-928f33254195.png?v=1760660050' },
    { name: 'Protea Blue Sapphire Eternity', sku: '9321BST', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9321BST_1.png?v=1760588529' },
    { name: 'Trilogy Royal Tanzanite', sku: '9593T', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9593T_1_8485fcda-711f-4f1d-9c6c-973ccab032d1.png?v=1760660337' },
    { name: 'Smell The Roses', sku: '9908YW', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9908YW_1_109a9973-7825-4c11-b963-cc20d48b2240.png?v=1760660496' },
    { name: 'Journey Diamond Ring', sku: '8631YW', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/8631YW_1_440c9728-2f0e-4e00-acde-4f094acdacbc.png?v=1760659643' },
    { name: 'Royal Tanzanite Solitaire', sku: '9576Y', category: 'Ring', sub_category: 'Dress Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9576Y_1_ef4c7e55-85da-4e3a-a1e4-cbb89cc7da9e.png?v=1760660238' },

    // Engagement Rings
    { name: 'Queen of My Heart Heart Diamond Ring', sku: 'MC9560PT', category: 'Ring', sub_category: 'Engagement Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/MC9560PT_1_81125d10-b97a-4516-9e60-ec477dcd983a.png?v=1760593919' },
    { name: 'Secret Halo Oval Diamond Ring', sku: 'MC9715Y', category: 'Ring', sub_category: 'Engagement Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/MC9715Y_1_7a2cd30b-ebba-45d4-8df4-0ff97b4228b0.png?v=1760594092' },
    { name: 'Queen of My Heart Oval Diamond Ring', sku: 'MC9555PT', category: 'Ring', sub_category: 'Engagement Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/MC9555PT_1_6ba2f895-fa72-460e-8e73-d1fda50960c8.png?v=1760594006' },
    { name: 'Angel Halo Chorus Round Brilliant Diamond Ring', sku: '9392R', category: 'Ring', sub_category: 'Engagement Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9392R_2.png?v=1760595993' },

    // Womens Wedding Bands
    { name: 'Protea Emerald and Diamond Eternity Ring', sku: '9340EMY', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9340EMY.png?v=1760588054' },
    { name: 'Protea Ruby and Diamond Eternity Ring', sku: '9429RUT', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9429RUT_1_6d1c7dd7-5fcd-40f6-b189-e14836bb26d6.png?v=1760659955' },
    { name: 'Protea Emerald and Diamond Eternity Ring', sku: '9455EMY', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9455EMY.png?v=1760588264' },
    { name: 'Protea Diamond and Pink Sapphire Full Eternity Ring', sku: '9509Y', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/FULL_DIAMOND_PROTEA_ETERNITY_WITH_PINK_SAPPHIRE_ACCENT_9509Y_1.png?v=1760589399' },
    { name: 'Heart-Shaped Diamond Chorus Eternity Ring', sku: 'MC9365YT', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/FIVE_HEART_SHAPED_EXCEPTIONAL_DIAMONDS_SET_IN_AN_ANGEL_CHORUS_BAND_MC9365YT_1.png?v=1760590995' },
    { name: 'Protea Blue Sapphire Eternity', sku: '9500BSWR14', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9500BST_1_2c6ea06c-e3da-4261-b684-77e32a835e38.png?v=1760660103' },
    { name: 'Protea Blue Sapphire Eternity', sku: '9321BST', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9321BST_1.png?v=1760588529' },
    { name: 'Chorus Diamond Ring', sku: '10046W', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/10046W_1.png?v=1760660671' },
    { name: 'Original Angel Diamond Pavé', sku: '9492W', category: 'Ring', sub_category: 'Womens Wedding Bands and Eternity Rings', image_url: 'https://brownsjewellers.com/cdn/shop/files/9492W_1_e5cf34c2-1334-4eb8-a89a-928f33254195.png?v=1760660050' }
];

const seedProducts = async () => {
    try {
        console.log('⏳ Waiting for DB initialization...');
        if (db.initPromise) {
            await db.initPromise;
        }
        console.log('✅ DB initialization complete.');

        // Check if table exists
        try {
            await db.query('SELECT 1 FROM products LIMIT 1');
            console.log('✅ Table "products" exists.');
        } catch (err) {
            console.error('❌ Table "products" does not exist or cannot be accessed:', err.message);
            // Try to create it manually if it's missing (fallback)
            console.log('⚠️ Attempting to create table manually...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    sku VARCHAR(255) UNIQUE NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    sub_category VARCHAR(100),
                    image_url TEXT,
                    description TEXT,
                    price DECIMAL(10, 2),
                    active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ Table "products" created manually.');
        }

        console.log('🌱 Seeding products...');

        for (const product of PRODUCTS) {
            // Check if exists
            const existing = await db.query('SELECT id FROM products WHERE sku = $1', [product.sku]);

            if (existing.rows.length === 0) {
                await db.query(
                    `INSERT INTO products (name, sku, category, sub_category, image_url) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [product.name, product.sku, product.category, product.sub_category, product.image_url]
                );
                console.log(`✅ Added: ${product.name}`);
            } else {
                console.log(`⚠️ Skipped (Exists): ${product.name}`);
            }
        }

        console.log('✨ Product seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
