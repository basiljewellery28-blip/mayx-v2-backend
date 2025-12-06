require('dotenv').config();
const db = require('./db/Index.js');

const SAMPLE_STORIES = [
    {
        title: 'A Garden of Forever',
        content: `The air was thick with the scent of roses as Michael dropped to one knee in their secret garden. Five years of love had led to this moment, surrounded by the very flowers they had planted together on their first anniversary.

"Every time I look at this garden, I see our love growing," he said, opening the velvet box to reveal a stunning solitaire diamond ring from Browns Jewellers. The center stone caught the golden sunset light, casting rainbows across her tearful face.

Sarah couldn't speak. She simply nodded, tears streaming down her cheeks, as he slipped the ring onto her finger. The garden they had nurtured together would forever hold this magical moment - the beginning of their forever.`,
        category: 'engagement',
        image_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9be24?w=800'
    },
    {
        title: 'The Lighthouse Proposal',
        content: `They had always been drawn to the sea. It was where they had their first kiss, where he told her he loved her, and where he knew he would ask her to be his wife.

The lighthouse stood sentinel against the crashing waves as David led Emma to its ancient spiral staircase. At the top, with the Atlantic wind whipping around them and stars beginning to pepper the twilight sky, he presented the vintage-inspired halo ring they had admired together at Browns.

"You are my lighthouse," he whispered. "You guide me home every single day." The antique setting sparkled like the lighthouse beam, a promise of guidance and love for all their days to come.`,
        category: 'engagement',
        image_url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800'
    },
    {
        title: 'Fifty Years of Gold',
        content: `Harold reached for Margaret's weathered hand, the same hand he had held walking down the aisle fifty years ago. Their children and grandchildren watched as he presented her with a new ring - a gold band set with a diamond for each decade of their love.

"Five stones for fifty years," he said, his voice trembling with emotion. "But even a hundred diamonds couldn't capture what you mean to me."

Margaret laughed, that same laugh that had captured his heart in 1974. "You always were the romantic one," she teased, but her eyes glistened as he slipped the anniversary band alongside the original ring she had never taken off.`,
        category: 'anniversary',
        image_url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800'
    },
    {
        title: 'The Chapel in the Rain',
        content: `They had dreamed of a garden wedding, but the heavens had other plans. As thunder rolled and rain cascaded down, the small stone chapel became their unexpected sanctuary.

With candlelight flickering against ancient windows and their closest loved ones huddled in wooden pews, James and Claire exchanged rings crafted by Browns' master jewellers. The matching platinum bands bore a delicate wave pattern - a reminder of how they had first met surfing in Cape Town.

"Here's to every storm we've weathered," Claire whispered as she slipped the ring on his finger, "and every one we'll weather together." Outside, the rain continued its symphony, but inside the chapel, there was only warmth and love.`,
        category: 'wedding',
        image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
    },
    {
        title: 'Grandma\'s Legacy',
        content: `When Grandma Rose passed, she left behind more than memories. Tucked in a worn jewelry box was a letter and the diamond earrings she had worn on her wedding day in 1952.

"To my granddaughter," the letter read, "May these diamonds remind you that love, like these precious stones, is formed under pressure and time. They are yours now. May they witness your own love story."

At Browns, the original Art Deco settings were carefully restored, the diamonds cleaned and reset. Now they shimmer in new ears at new celebrations, carrying seventy years of love into future generations.`,
        category: 'love',
        image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'
    },
    {
        title: 'A Promise Across Continents',
        content: `They met in an airport lounge - she flying to New York, he to Tokyo. A delayed flight became dinner, dinner became exchanged numbers, and numbers became three years of long-distance love.

"I've traveled a million miles to be standing here," Thomas said, standing in the exact spot where they had first talked. The international terminal buzzed around them, but in that moment, there was only Mei and the rose gold ring in his hand.

The center stone was a sapphire, blue as the Pacific they had crossed so many times to be together. From Browns' collection, it represented all the miles, the time zones, the video calls, and the promise that the distance was finally over.`,
        category: 'engagement',
        image_url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800'
    },
    {
        title: 'The Watch That Stopped Time',
        content: `For twenty-five years of marriage, Linda had one wish: to give her husband something as timeless as their love. She found it at Browns - a vintage-style watch with a hand-wound movement.

"Time flies when you're having fun," she said, presenting it at their anniversary dinner. "But with you, I've savored every second."

Robert opened the box, his breath catching. On the back, an engraving: "To eternity and beyond - L." The watch represented the hours they'd spent building a home, the minutes of laughter with their children, and the seconds of quiet companionship that made a marriage.`,
        category: 'anniversary',
        image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800'
    },
    {
        title: 'The Mountain Summit Surprise',
        content: `After twelve hours of climbing, legs burning and lungs gasping in the thin mountain air, they reached the summit of Table Mountain's Platteklip Gorge at sunrise.

The Cape Town city lights twinkled far below as the first rays of sun painted the sky orange and gold. That's when David dropped to one knee.

"We've climbed mountains together, literally and figuratively," he managed between breaths. "Will you climb the rest of life's mountains with me?" The emerald-cut diamond caught the sunrise, as brilliant as the moment itself.`,
        category: 'engagement',
        image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800'
    }
];

async function seedStories() {
    try {
        console.log('🌹 Starting Love Stories seeding...\n');

        // Get admin user ID to attribute stories
        const userResult = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        const userId = userResult.rows[0]?.id || 1;
        console.log(`📝 Using user ID: ${userId}\n`);

        for (const story of SAMPLE_STORIES) {
            console.log(`💎 Adding: "${story.title}"...`);

            // Check if story already exists
            const existingResult = await db.query(
                'SELECT id FROM stories WHERE title = $1',
                [story.title]
            );

            if (existingResult.rows.length > 0) {
                console.log(`   ↩️ Already exists, skipping.\n`);
                continue;
            }

            // Insert story
            await db.query(`
                INSERT INTO stories (user_id, title, content, image_url, category, status, likes_count)
                VALUES ($1, $2, $3, $4, $5, 'approved', 0)
            `, [userId, story.title, story.content, story.image_url, story.category]);

            console.log(`   ✅ Added successfully!\n`);
        }

        console.log('='.repeat(50));
        console.log('🎉 SEEDING COMPLETE!\n');
        console.log(`Total stories seeded: ${SAMPLE_STORIES.length}`);
        console.log('Categories: engagement, wedding, anniversary, love\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding stories:', err);
        process.exit(1);
    }
}

seedStories();
