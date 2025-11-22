const express = require('express');
const router = express.Router();
const db = require('../db/Index.js');
const { authenticateToken } = require('../middleware/authMiddleware'); // <-- 1. IMPORT

// GET all briefs
// 2. ADD 'authenticateToken' right before (req, res)
// GET all briefs
router.get('/', authenticateToken, async (req, res) => {
  try {


    const { search, status, client_id } = req.query;
    let queryText = 'SELECT * FROM briefs WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      queryText += ` AND status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (client_id) {
      queryText += ` AND client_id = $${paramCount}`;
      queryParams.push(client_id);
      paramCount++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await db.query(queryText, queryParams);
    res.json({
      message: 'Briefs retrieved successfully!',
      count: result.rows.length,
      briefs: result.rows
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to retrieve briefs' });
  }
});

// GET single brief
// 3. PROTECT THIS ROUTE
// GET single brief
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, c.name as client_name, u.name as consultant_name 
       FROM briefs b 
       LEFT JOIN clients c ON b.client_id = c.id 
       LEFT JOIN users u ON b.consultant_id = u.id 
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    res.json({ brief: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve brief' });
  }
});

// ... (POST route remains unchanged) ...

// GET brief versions
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT bv.*, u.name as user_name 
       FROM brief_versions bv 
       LEFT JOIN users u ON bv.created_by = u.id 
       WHERE bv.brief_id = $1 
       ORDER BY bv.version_number DESC`,
      [req.params.id]
    );
    res.json({ versions: result.rows });
  } catch (error) {
    console.error('Error retrieving versions:', error);
    res.status(500).json({ error: 'Failed to retrieve versions' });
  }
});

// POST create brief
// 4. PROTECT THIS ROUTE
// POST create brief
router.post('/', authenticateToken, async (req, res) => {
  try {
    const consultant_id = req.user.userId;

    // Extract client details and brief details from request body
    const {
      clientName, clientEmail, clientContact, clientProfile, // Client fields
      title, description, style_code_id, category, ringType, ringDesign, // Brief fields
      // ... capture other fields to store in brief_versions later if needed
      ...otherData
    } = req.body;

    // 1. Create or Find Client
    // For now, we'll just create a new client entry for every brief to keep it simple,
    // or you could check if one exists by email/profile_number first.
    let client_id;

    if (clientName) {
      // Check if client already exists
      let clientResult = await db.query(
        'SELECT id FROM clients WHERE email = $1 OR profile_number = $2',
        [clientEmail, clientProfile]
      );

      if (clientResult.rows.length > 0) {
        // Client exists
        client_id = clientResult.rows[0].id;
        console.log(`Found existing client ID: ${client_id}`);
      } else {
        // Create new client
        clientResult = await db.query(
          'INSERT INTO clients (name, email, contact_number, profile_number) VALUES ($1, $2, $3, $4) RETURNING id',
          [clientName, clientEmail, clientContact, clientProfile]
        );
        client_id = clientResult.rows[0].id;
        console.log(`Created new client ID: ${client_id}`);
      }
    } else {
      // Handle case where no client info is provided (maybe optional?)
      // For now, let's require it or set a placeholder if your schema allows nulls (it doesn't: client_id INTEGER NOT NULL)
      return res.status(400).json({ error: 'Client name is required' });
    }

    const briefNumber = 'MB-' + Date.now();

    // 2. Create Brief
    const result = await db.query(
      'INSERT INTO briefs (brief_number, client_id, consultant_id, title, description, style_code_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [briefNumber, client_id, consultant_id, title || `Brief for ${clientName}`, description, style_code_id || null]
    );

    const newBrief = result.rows[0];

    // 3. Create Initial Brief Version (Optional but recommended to store all the wizard data)
    // We'll store the entire formData in the 'data' JSONB column
    await db.query(
      'INSERT INTO brief_versions (brief_id, version_number, data, created_by) VALUES ($1, $2, $3, $4)',
      [newBrief.id, 1, JSON.stringify(req.body), consultant_id]
    );

    // EMAIL NOTIFICATION
    if (clientEmail) {
      const { sendBriefCreatedEmail } = require('../services/emailService');
      // Send to client
      sendBriefCreatedEmail(clientEmail, { ...newBrief, client_name: clientName }).catch(err => console.error('Failed to send email:', err));
    }

    res.status(201).json({ message: 'Brief created!', brief: newBrief });
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'Failed to create brief' });
  }
});

// PUT update brief status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE briefs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    const { emitEvent } = require('../services/socketService');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    const updatedBrief = result.rows[0];
    emitEvent(`brief_${req.params.id}`, 'brief_status_updated', updatedBrief);

    // NOTIFICATION LOGIC
    // Notify the consultant if someone else changed it (unlikely but possible)
    // OR notify the client (if we had one).
    // For now, let's notify the consultant if the user changing it is NOT the consultant.
    if (req.user.userId !== updatedBrief.consultant_id) {
      const { createNotification } = require('../services/notificationService');
      await createNotification(
        updatedBrief.consultant_id,
        'status_change',
        `Brief "${updatedBrief.title}" status updated to ${status}`,
        updatedBrief.id
      );
    }

    res.json({ message: 'Status updated', brief: updatedBrief });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;

