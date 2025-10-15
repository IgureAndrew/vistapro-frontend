// src/jobs/expireStockPickups.js
const cron = require('node-cron');
const { pool } = require('../config/database');

// Run every minute
cron.schedule('* * * * *', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Find all pending pickups whose deadline is past
    const { rows: expired } = await client.query(`
      SELECT id, marketer_id
        FROM stock_updates
       WHERE status = 'pending'
         AND deadline < NOW()
    `);

    if (expired.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const expiredIds = expired.map(r => r.id);

    // 2) Mark them expired
    await client.query(`
      UPDATE stock_updates
         SET status     = 'expired',
             expired_at = NOW(),
             updated_at = NOW()
       WHERE id = ANY($1)
    `, [expiredIds]);

    // 3) Notify all parties involved for each expired pickup
    for (const { id: suId, marketer_id } of expired) {
      // Get marketer details
      const { rows: [marketer] } = await client.query(`
        SELECT unique_id, admin_id
          FROM users
         WHERE id = $1
      `, [marketer_id]);
      
      if (marketer?.unique_id) {
        // a) Notify marketer
        await client.query(`
          INSERT INTO notifications (user_unique_id, message, created_at)
          VALUES ($1, $2, NOW())
        `, [
          marketer.unique_id,
          `⚠️ URGENT: Your stock pickup #${suId} has expired! You must return or transfer it immediately.`
        ]);

        // b) Notify marketer's admin
        if (marketer.admin_id) {
          const { rows: [admin] } = await client.query(`
            SELECT unique_id, super_admin_id
              FROM users
             WHERE id = $1
          `, [marketer.admin_id]);
          
          if (admin?.unique_id) {
            await client.query(`
              INSERT INTO notifications (user_unique_id, message, created_at)
              VALUES ($1, $2, NOW())
            `, [
              admin.unique_id,
              `⚠️ URGENT: Marketer ${marketer.unique_id}'s stock pickup #${suId} has expired!`
            ]);
            
            // c) Notify admin's superadmin
            if (admin.super_admin_id) {
              const { rows: [superadmin] } = await client.query(`
                SELECT unique_id FROM users WHERE id = $1
              `, [admin.super_admin_id]);
              
              if (superadmin?.unique_id) {
                await client.query(`
                  INSERT INTO notifications (user_unique_id, message, created_at)
                  VALUES ($1, $2, NOW())
                `, [
                  superadmin.unique_id,
                  `⚠️ URGENT: Stock pickup #${suId} in your chain has expired!`
                ]);
              }
            }
          }
        }

        // d) Notify all MasterAdmins
        await client.query(`
          INSERT INTO notifications (user_unique_id, message, created_at)
          SELECT unique_id, $1, NOW()
            FROM users
           WHERE role = 'MasterAdmin'
        `, [
          `⚠️ URGENT: Stock pickup #${suId} has expired (48h lapsed without sale/transfer/return).`
        ]);
      }
    }

    await client.query('COMMIT');
    console.log(`🕑 Marked pickups expired: ${expiredIds.join(', ')}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error expiring pickups:", err);
  } finally {
    client.release();
  }
});
