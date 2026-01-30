const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// SERVERLESS FIX: Sometimes Vercel sends body as string, express.json() misses it
app.use((req, res, next) => {
    if (typeof req.body === 'string') {
        try {
            const parsed = JSON.parse(req.body);
            req.body = parsed;
        } catch (e) {
            console.error("Manual JSON Parse Failed:", e);
        }
    }
    next();
});

// Middleware to check Auth (Simple Password Protection)
const requireAuth = (req, res, next) => {
    const token = req.headers['x-auth-token'];
    if (token !== 'Sabuji-Token') {
        return res.status(401).json({ error: 'Unauthorized. Login as Manager.' });
    }
    next();
};

// API: Login
// API: Login
app.post('/api/login', (req, res) => {
    // Strict Password Check
    const { password } = req.body || {};

    // Use Environment Variable or Fallback
    const correctPassword = process.env.ADMIN_PASSWORD || 'Sabuji';

    if (password === correctPassword) {
        res.json({ success: true, token: 'Sabuji-Token' });
    } else {
        // Debugging Return (Helps identify what Vercel received)
        const debugInfo = {
            receivedType: req.headers['content-type'],
            isBodyEmpty: !req.body || Object.keys(req.body).length === 0
        };
        console.error("Login Failed:", debugInfo);

        res.status(401).json({
            error: 'Invalid Password',
            debug: debugInfo
        });
    }
});

// API: Get All Members
app.get('/api/members', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM members');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Add Member (Protected)
app.post('/api/members', requireAuth, async (req, res) => {
    const { name } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO members (name) VALUES (?)',
            args: [name]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Tasks (Optional Filter)
app.get('/api/tasks', async (req, res) => {
    const { memberId, date } = req.query;
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const args = [];

    if (memberId) {
        sql += ' AND member_id = ?';
        args.push(memberId);
    }
    if (date) {
        sql += ' AND date = ?';
        args.push(date);
    }

    try {
        const result = await db.execute({ sql, args });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Add Task (Protected)
app.post('/api/tasks', requireAuth, async (req, res) => {
    const { memberId, date, title, description, weight } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO tasks (member_id, date, title, description, weight) VALUES (?, ?, ?, ?, ?)',
            args: [memberId, date, title, description, weight]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Delete Task (Protected)
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute({
            sql: 'DELETE FROM tasks WHERE id = ?',
            args: [id]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Summary (Total Hours for Member/Date)
// UPDATED: Check for Leaves
app.get('/api/summary', async (req, res) => {
    const { memberId, date } = req.query;
    if (!memberId || !date) return res.status(400).json({ error: 'Missing params' });

    try {
        // Check Leave Status
        const leaveCheck = await db.execute({
            sql: 'SELECT * FROM leaves WHERE member_id = ? AND date = ?',
            args: [memberId, date]
        });

        if (leaveCheck.rows.length > 0) {
            return res.json({ totalHours: 0, status: 'On Leave', color: 'blue', isLeave: true });
        }

        const result = await db.execute({
            sql: 'SELECT SUM(weight) as total FROM tasks WHERE member_id = ? AND date = ?',
            args: [memberId, date]
        });

        const totalHours = result.rows[0].total || 0;
        let status = 'Normal';
        let color = 'yellow';

        if (totalHours < 4) {
            status = 'Underperforming';
            color = 'red';
        } else if (totalHours > 6) {
            status = 'Overperforming';
            color = 'green';
        }

        res.json({ totalHours, status, color });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Toggle Leave (Protected)
app.post('/api/leaves', requireAuth, async (req, res) => {
    const { memberId, date, active } = req.body;
    try {
        if (active) {
            // Add leave
            await db.execute({
                sql: 'INSERT OR IGNORE INTO leaves (member_id, date) VALUES (?, ?)',
                args: [memberId, date]
            });
        } else {
            // Remove leave
            await db.execute({
                sql: 'DELETE FROM leaves WHERE member_id = ? AND date = ?',
                args: [memberId, date]
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Manager Daily Performance (Average of Team)
app.get('/api/manager/daily', async (req, res) => {
    const { date } = req.query;
    try {
        // 1. Get all members
        const members = await db.execute('SELECT id FROM members');
        const totalMembers = members.rows.length;
        if (totalMembers === 0) return res.json({ totalHours: 0, status: 'No Team', color: 'gray' });

        // 2. Get Absenting Members Count
        const leaves = await db.execute({
            sql: 'SELECT count(*) as count FROM leaves WHERE date = ?',
            args: [date]
        });
        const absentCount = leaves.rows[0].count;
        const activeMembers = totalMembers - absentCount;

        if (activeMembers <= 0) return res.json({ totalHours: 0, status: 'All Absent', color: 'blue' });

        // 3. Get Total Team Hours for that date
        const tasks = await db.execute({
            sql: 'SELECT SUM(weight) as total FROM tasks WHERE date = ?',
            args: [date]
        });
        const teamTotalHours = tasks.rows[0].total || 0;

        // 4. Calculate Average
        const avgHours = teamTotalHours / activeMembers;

        let status = 'Normal';
        let color = 'yellow';

        if (avgHours < 4) {
            status = 'Underperforming';
            color = 'red';
        } else if (avgHours > 6) {
            status = 'Overperforming';
            color = 'green';
        }

        res.json({ totalHours: avgHours, status, color, activeMembers, teamTotalHours });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Submit Feedback (Public, 500 words limit)
app.post('/api/feedback', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Word Count Validation
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 500) {
        return res.status(400).json({ error: `Feedback too long (${wordCount}/500 words).` });
    }

    try {
        const date = new Date().toISOString();
        await db.execute({
            sql: 'INSERT INTO feedbacks (content, date) VALUES (?, ?)',
            args: [content, date]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Feedbacks (Manager Only)
app.get('/api/feedback', requireAuth, async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM feedbacks ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Reports (Daily Totals for optional range)
// Simply returns everything for now, frontend can process or we can aggregate
app.get('/api/reports', async (req, res) => {
    try {
        // Join members to get names
        const sql = `
      SELECT t.date, m.name, SUM(t.weight) as totalHours
      FROM tasks t
      JOIN members m ON t.member_id = m.id
      GROUP BY t.date, m.id
      ORDER BY t.date DESC
    `;
        const result = await db.execute(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Export Feature
app.get('/api/export', async (req, res) => {
    try {
        const members = await db.execute('SELECT * FROM members');
        const tasks = await db.execute('SELECT * FROM tasks');

        const backup = {
            timestamp: new Date().toISOString(),
            members: members.rows,
            tasks: tasks.rows
        };

        res.header('Content-Type', 'application/json');
        res.header('Content-Disposition', 'attachment; filename="performance_backup.json"');
        res.send(JSON.stringify(backup, null, 2));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// Export for Vercel
module.exports = app;
