const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Production migration endpoint
router.post('/guarantor-structure', async (req, res) => {
  try {
    console.log('🔍 Starting production guarantor structure migration...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Step 1: Add missing columns
    const columnsToAdd = [
      'means_of_identification TEXT',
      'guarantor_full_name TEXT',
      'guarantor_email TEXT',
      'guarantor_phone TEXT',
      'guarantor_home_address TEXT',
      'guarantor_office_address TEXT',
      'candidate_name TEXT'
    ];
    
    const results = [];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE marketer_guarantor_form ADD COLUMN IF NOT EXISTS ${column};`);
        results.push(`✅ Added column: ${column.split(' ')[0]}`);
        console.log(`✅ Added column: ${column.split(' ')[0]}`);
      } catch (error) {
        if (error.code === '42701') {
          results.push(`⏭️ Column already exists: ${column.split(' ')[0]}`);
          console.log(`⏭️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          results.push(`❌ Error adding column ${column.split(' ')[0]}: ${error.message}`);
          console.log(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }
    
    // Step 2: Check existing data
    const countResult = await pool.query('SELECT COUNT(*) as count FROM marketer_guarantor_form;');
    console.log('📊 Total guarantor records:', countResult.rows[0].count);
    
    let dataInfo = [];
    if (parseInt(countResult.rows[0].count) > 0) {
      const dataResult = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name
        FROM marketer_guarantor_form 
        ORDER BY created_at DESC
        LIMIT 5;
      `);
      
      dataInfo = dataResult.rows.map((row, index) => ({
        record: index + 1,
        id: row.id,
        marketer_id: row.marketer_id,
        is_candidate_well_known: row.is_candidate_well_known,
        relationship: row.relationship,
        known_duration: row.known_duration,
        occupation: row.occupation,
        means_of_identification: row.means_of_identification,
        guarantor_full_name: row.guarantor_full_name,
        guarantor_email: row.guarantor_email,
        guarantor_phone: row.guarantor_phone,
        guarantor_home_address: row.guarantor_home_address,
        guarantor_office_address: row.guarantor_office_address,
        candidate_name: row.candidate_name
      }));
    }
    
    await pool.end();
    
    console.log('✅ Production migration completed successfully!');
    
    res.json({
      success: true,
      message: 'Guarantor structure migration completed successfully!',
      results: results,
      totalRecords: parseInt(countResult.rows[0].count),
      sampleData: dataInfo
    });
    
  } catch (error) {
    console.error('❌ Production migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

module.exports = router;
