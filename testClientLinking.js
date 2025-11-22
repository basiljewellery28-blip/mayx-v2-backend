// Using built-in fetch

// Configuration
const API_URL = 'http://localhost:5000/api';
const CREDENTIALS = { email: 'admin@mayx.com', password: 'admin' };

const TEST_CLIENT = {
    clientName: 'Test Client Unique ' + Date.now(),
    clientEmail: `test${Date.now()}@example.com`,
    clientContact: '0000000000',
    clientProfile: 'P-' + Date.now(),
    title: 'Test Brief',
    description: 'Testing client linking'
};

async function runTest() {
    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(CREDENTIALS)
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // 2. Create Brief 1
        console.log('📝 Creating Brief 1...');
        const res1 = await fetch(`${API_URL}/briefs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(TEST_CLIENT)
        });
        const data1 = await res1.json();
        console.log('✅ Brief 1 created. Client ID:', data1.brief.client_id);

        // 3. Create Brief 2 (Same Client)
        console.log('📝 Creating Brief 2 (Same Client)...');
        const res2 = await fetch(`${API_URL}/briefs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(TEST_CLIENT)
        });
        const data2 = await res2.json();
        console.log('✅ Brief 2 created. Client ID:', data2.brief.client_id);

        // 4. Verify
        if (data1.brief.client_id === data2.brief.client_id) {
            console.log('🎉 SUCCESS: Client IDs match! No duplicate client created.');
        } else {
            console.error('❌ FAILURE: Client IDs do not match. Duplicate client created.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
