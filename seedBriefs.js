require('dotenv').config();
const db = require('./db/Index.js');

const seedBriefs = async () => {
    try {
        console.log('🌱 Seeding briefs...');

        // 1. Get a user (consultant)
        const userResult = await db.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.error('❌ No users found. Please run seedUser.js first.');
            process.exit(1);
        }
        const consultantId = userResult.rows[0].id;

        // 2. Create a client
        const clientResult = await db.query(`
      INSERT INTO clients (name, email, contact_number, profile_number)
      VALUES ('John Doe', 'john@example.com', '1234567890', 'C-001')
      RETURNING id
    `);
        const clientId = clientResult.rows[0].id;

        // 3. Create Briefs
        const briefsData = [
            {
                title: 'Diamond Ring Design',
                description: 'A classic solitaire diamond ring with a platinum band.',
                status: 'draft',
                brief_number: 'MB-1001'
            },
            {
                title: 'Gold Necklace Custom',
                description: '18k Gold necklace with custom engraving.',
                status: 'review',
                brief_number: 'MB-1002'
            },
            {
                title: 'Sapphire Earrings',
                description: 'Blue sapphire stud earrings, white gold setting.',
                status: 'approved',
                brief_number: 'MB-1003'
            }
        ];

        for (const brief of briefsData) {
            const res = await db.query(`
        INSERT INTO briefs (brief_number, client_id, consultant_id, title, description, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `, [brief.brief_number, clientId, consultantId, brief.title, brief.description, brief.status]);

            const briefId = res.rows[0].id;

            // Create initial version
            await db.query(`
        INSERT INTO brief_versions (brief_id, version_number, data, created_by)
        VALUES ($1, 1, $2, $3)
      `, [briefId, JSON.stringify(brief), consultantId]);

            console.log(`✅ Created brief: ${brief.title}`);
        }

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding briefs:', error);
        process.exit(1);
    }
};

seedBriefs();
