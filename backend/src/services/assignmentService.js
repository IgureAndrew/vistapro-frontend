// src/services/assignmentService.js
// Updated to use existing assignment structure from users table

const { pool } = require('../config/database');

/**
 * Get all unassigned marketers (marketers without admin_id)
 */
async function getUnassignedMarketers() {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role, u.created_at
    FROM users u
    WHERE u.role = 'Marketer' 
    AND u.admin_id IS NULL
    AND u.deleted_at IS NULL
    ORDER BY u.first_name, u.last_name
  `);
  
  return rows;
}

/**
 * Get all available assignees (admins and superadmins)
 */
async function getAvailableAssignees() {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role, u.location, u.super_admin_id
    FROM users u
    WHERE u.role IN ('Admin', 'SuperAdmin')
    AND u.deleted_at IS NULL
    ORDER BY u.role, u.first_name, u.last_name
  `);
  
  return rows;
}

/**
 * Get assignment statistics using existing assignment data
 */
async function getAssignmentStats() {
  // Get total marketers
  const { rows: totalMarketers } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Marketer' AND deleted_at IS NULL
  `);
  
  // Get assigned marketers
  const { rows: assignedMarketers } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Marketer' AND admin_id IS NOT NULL AND deleted_at IS NULL
  `);
  
  // Get unassigned marketers
  const { rows: unassignedMarketers } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Marketer' AND admin_id IS NULL AND deleted_at IS NULL
  `);
  
  // Get total admins
  const { rows: totalAdmins } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Admin' AND deleted_at IS NULL
  `);
  
  // Get assigned admins
  const { rows: assignedAdmins } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Admin' AND super_admin_id IS NOT NULL AND deleted_at IS NULL
  `);
  
  // Get unassigned admins
  const { rows: unassignedAdmins } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role = 'Admin' AND super_admin_id IS NULL AND deleted_at IS NULL
  `);
  
  // Get active assignees (admins and superadmins who can be assigned to)
  const { rows: activeAssignees } = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE role IN ('Admin', 'SuperAdmin') AND deleted_at IS NULL
  `);
  
  return {
    // Flat structure that frontend expects
    totalMarketers: parseInt(totalMarketers[0].count),
    assignedMarketers: parseInt(assignedMarketers[0].count),
    unassignedMarketers: parseInt(unassignedMarketers[0].count),
    activeAssignees: parseInt(activeAssignees[0].count),
    
    // Keep nested structure for backward compatibility
    marketers: {
      total: parseInt(totalMarketers[0].count),
      assigned: parseInt(assignedMarketers[0].count),
      unassigned: parseInt(unassignedMarketers[0].count)
    },
    admins: {
      total: parseInt(totalAdmins[0].count),
      assigned: parseInt(assignedAdmins[0].count),
      unassigned: parseInt(unassignedAdmins[0].count)
    }
  };
}

/**
 * Get assigned marketers for a specific admin
 */
async function getAssignedMarketers(adminId) {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role, u.created_at
    FROM users u
    WHERE u.role = 'Marketer' 
    AND u.admin_id = (SELECT id FROM users WHERE unique_id = $1)
    AND u.deleted_at IS NULL
    ORDER BY u.first_name, u.last_name
  `, [adminId]);
  
  return rows;
}

/**
 * Get assigned admins for a specific superadmin
 */
async function getAssignedAdmins(superAdminId) {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role, u.created_at
    FROM users u
    WHERE u.role = 'Admin' 
    AND u.super_admin_id = (SELECT id FROM users WHERE unique_id = $1)
    AND u.deleted_at IS NULL
    ORDER BY u.first_name, u.last_name
  `, [superAdminId]);
  
  return rows;
}

/**
 * Assign a marketer to an admin
 */
async function assignMarketerToAdmin(marketerId, adminId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the admin's details including location
    const { rows: adminRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'Admin'
    `, [adminId]);
    
    if (adminRows.length === 0) {
      throw new Error('Admin not found');
    }
    
    const adminInternalId = adminRows[0].id;
    const adminLocation = adminRows[0].location;
    
    // Get the marketer's details including location
    const { rows: marketerRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'Marketer'
    `, [marketerId]);
    
    if (marketerRows.length === 0) {
      throw new Error('Marketer not found');
    }
    
    const marketerLocation = marketerRows[0].location;
    
    // Validate location match
    if (marketerLocation !== adminLocation) {
      throw new Error(`Location mismatch: Marketer is in ${marketerLocation} but Admin is in ${adminLocation}. Assignments must be within the same location.`);
    }
    
    // Update the marketer's admin_id
    const { rows } = await client.query(`
      UPDATE users 
      SET admin_id = $1, updated_at = NOW()
      WHERE unique_id = $2 AND role = 'Marketer'
      RETURNING unique_id, first_name, last_name, email
    `, [adminInternalId, marketerId]);
    
    if (rows.length === 0) {
      throw new Error('Marketer not found');
    }
    
    await client.query('COMMIT');
    return rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Assign an admin to a superadmin
 */
async function assignAdminToSuperAdmin(adminId, superAdminId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the superadmin's details including location
    const { rows: superAdminRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'SuperAdmin'
    `, [superAdminId]);
    
    if (superAdminRows.length === 0) {
      throw new Error('SuperAdmin not found');
    }
    
    const superAdminInternalId = superAdminRows[0].id;
    const superAdminLocation = superAdminRows[0].location;
    
    // Get the admin's details including location
    const { rows: adminRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'Admin'
    `, [adminId]);
    
    if (adminRows.length === 0) {
      throw new Error('Admin not found');
    }
    
    const adminLocation = adminRows[0].location;
    
    // Validate location match
    if (adminLocation !== superAdminLocation) {
      throw new Error(`Location mismatch: Admin is in ${adminLocation} but SuperAdmin is in ${superAdminLocation}. Assignments must be within the same location.`);
    }
    
    // Update the admin's super_admin_id
    const { rows } = await client.query(`
      UPDATE users 
      SET super_admin_id = $1, updated_at = NOW()
      WHERE unique_id = $2 AND role = 'Admin'
      RETURNING unique_id, first_name, last_name, email
    `, [superAdminInternalId, adminId]);
    
    if (rows.length === 0) {
      throw new Error('Admin not found');
    }
    
    await client.query('COMMIT');
    return rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Unassign a marketer from their admin
 */
async function unassignMarketer(marketerId) {
  const { rows } = await pool.query(`
    UPDATE users 
    SET admin_id = NULL, updated_at = NOW()
    WHERE unique_id = $1 AND role = 'Marketer'
    RETURNING unique_id, first_name, last_name, email
  `, [marketerId]);
  
  if (rows.length === 0) {
    throw new Error('Marketer not found');
  }
  
  return rows[0];
}

/**
 * Unassign an admin from their superadmin
 */
async function unassignAdmin(adminId) {
  const { rows } = await pool.query(`
    UPDATE users 
    SET super_admin_id = NULL, updated_at = NOW()
    WHERE unique_id = $1 AND role = 'Admin'
    RETURNING unique_id, first_name, last_name, email
  `, [adminId]);
  
  if (rows.length === 0) {
    throw new Error('Admin not found');
  }
  
  return rows[0];
}

/**
 * Get all assignments with details
 */
async function getAllAssignments() {
  // Get marketer to admin assignments
  const { rows: marketerAssignments } = await pool.query(`
    SELECT 
      m.unique_id as marketer_id,
      m.first_name as marketer_first_name,
      m.last_name as marketer_last_name,
      m.email as marketer_email,
      a.unique_id as admin_id,
      a.first_name as admin_first_name,
      a.last_name as admin_last_name,
      a.email as admin_email,
      'marketer_to_admin' as assignment_type
    FROM users m
    JOIN users a ON m.admin_id = a.id
    WHERE m.role = 'Marketer' AND a.role = 'Admin'
    AND m.deleted_at IS NULL AND a.deleted_at IS NULL
    ORDER BY a.first_name, m.first_name
  `);
  
  // Get admin to superadmin assignments
  const { rows: adminAssignments } = await pool.query(`
    SELECT 
      a.unique_id as admin_id,
      a.first_name as admin_first_name,
      a.last_name as admin_last_name,
      a.email as admin_email,
      s.unique_id as superadmin_id,
      s.first_name as superadmin_first_name,
      s.last_name as superadmin_last_name,
      s.email as superadmin_email,
      'admin_to_superadmin' as assignment_type
    FROM users a
    JOIN users s ON a.super_admin_id = s.id
    WHERE a.role = 'Admin' AND s.role = 'SuperAdmin'
    AND a.deleted_at IS NULL AND s.deleted_at IS NULL
    ORDER BY s.first_name, a.first_name
  `);
  
  return {
    marketerToAdmin: marketerAssignments,
    adminToSuperAdmin: adminAssignments
  };
}

// Legacy function names for backward compatibility
const getAssignmentsByUser = getAssignedMarketers;
const getMarketerAssignment = async (marketerId) => {
  const { rows } = await pool.query(`
    SELECT 
      u.unique_id as assigned_to_id,
      u.first_name || ' ' || u.last_name AS assigned_to_name,
      u.email AS assigned_to_email,
      'marketer_to_admin' as assignment_type
    FROM users m
    JOIN users u ON m.admin_id = u.id
    WHERE m.unique_id = $1 AND m.role = 'Marketer'
  `, [marketerId]);
  
  return rows[0] || null;
};

const assignMarketer = async (assignmentData) => {
  const { marketerId, assignedToId, assignmentType } = assignmentData;
  
  if (assignmentType === 'marketer_to_admin') {
    return await assignMarketerToAdmin(marketerId, assignedToId);
  } else if (assignmentType === 'admin_to_superadmin') {
    return await assignAdminToSuperAdmin(marketerId, assignedToId);
  }
  
  throw new Error('Invalid assignment type');
};

const updateAssignment = async (assignmentId, updateData) => {
  // This is a simplified version since we're using direct column updates
  throw new Error('Assignment updates should be done through unassign/assign operations');
};

const deactivateAssignment = async (assignmentId) => {
  // This is a simplified version since we're using direct column updates
  throw new Error('Assignment deactivation should be done through unassign operations');
};

const bulkAssignMarketers = async (assignmentData) => {
  const { marketerIds, assignedToId, assignmentType } = assignmentData;
  
  const results = [];
  
  for (const marketerId of marketerIds) {
    const assignment = await assignMarketer({
      marketerId,
      assignedToId,
      assignmentType
    });
    results.push(assignment);
  }
  
  return results;
};

/**
 * Get current assignments with hierarchical structure including all users
 */
async function getCurrentAssignments() {
  // Get all superadmins with their assigned admins and marketers
  const { rows: hierarchyRows } = await pool.query(`
    SELECT
      sa.unique_id as super_admin_id,
      sa.first_name as super_admin_first_name,
      sa.last_name as super_admin_last_name,
      sa.email as super_admin_email,
      sa.location as super_admin_location,
      a.unique_id as admin_id,
      a.first_name as admin_first_name,
      a.last_name as admin_last_name,
      a.email as admin_email,
      a.location as admin_location,
      u.unique_id as marketer_id,
      u.first_name as marketer_first_name,
      u.last_name as marketer_last_name,
      u.email as marketer_email,
      u.location as marketer_location,
      u.created_at as marketer_assigned_date
    FROM users sa
    LEFT JOIN users a ON sa.id = a.super_admin_id
    LEFT JOIN users u ON a.id = u.admin_id
    WHERE sa.role = 'SuperAdmin' AND sa.deleted_at IS NULL
    ORDER BY sa.first_name, a.first_name, u.first_name
  `);

  // Get unassigned admins (admins not assigned to any superadmin)
  const { rows: unassignedAdmins } = await pool.query(`
    SELECT
      a.unique_id as admin_id,
      a.first_name as admin_first_name,
      a.last_name as admin_last_name,
      a.email as admin_email,
      a.location as admin_location,
      u.unique_id as marketer_id,
      u.first_name as marketer_first_name,
      u.last_name as marketer_last_name,
      u.email as marketer_email,
      u.location as marketer_location,
      u.created_at as marketer_assigned_date
    FROM users a
    LEFT JOIN users u ON a.id = u.admin_id
    WHERE a.role = 'Admin' 
    AND a.super_admin_id IS NULL 
    AND a.deleted_at IS NULL
    ORDER BY a.first_name, u.first_name
  `);

  // Get unassigned marketers (marketers not assigned to any admin)
  const { rows: unassignedMarketers } = await pool.query(`
    SELECT
      u.unique_id as marketer_id,
      u.first_name as marketer_first_name,
      u.last_name as marketer_last_name,
      u.email as marketer_email,
      u.location as marketer_location,
      u.created_at as marketer_assigned_date
    FROM users u
    WHERE u.role = 'Marketer' 
    AND u.admin_id IS NULL 
    AND u.deleted_at IS NULL
    ORDER BY u.first_name, u.last_name
  `);
  
  // Group the hierarchy data
  const hierarchy = {};
  
  hierarchyRows.forEach(row => {
    const superAdminId = row.super_admin_id;
    
    if (!hierarchy[superAdminId]) {
      hierarchy[superAdminId] = {
        superAdmin: {
          id: row.super_admin_id,
          firstName: row.super_admin_first_name,
          lastName: row.super_admin_last_name,
          email: row.super_admin_email,
          location: row.super_admin_location
        },
        admins: {}
      };
    }
    
    if (row.admin_id) {
      const adminId = row.admin_id;
      
      if (!hierarchy[superAdminId].admins[adminId]) {
        hierarchy[superAdminId].admins[adminId] = {
          admin: {
            id: row.admin_id,
            firstName: row.admin_first_name,
            lastName: row.admin_last_name,
            email: row.admin_email,
            location: row.admin_location
          },
          marketers: []
        };
      }
      
      if (row.marketer_id) {
        hierarchy[superAdminId].admins[adminId].marketers.push({
          id: row.marketer_id,
          firstName: row.marketer_first_name,
          lastName: row.marketer_last_name,
          email: row.marketer_email,
          location: row.marketer_location,
          assignedDate: row.marketer_assigned_date
        });
      }
    }
  });

  // Add unassigned admins to the hierarchy
  unassignedAdmins.forEach(row => {
    const adminId = row.admin_id;
    const location = row.admin_location;
    
    // Create a special key for unassigned admins by location
    const unassignedKey = `unassigned_${location}`;
    
    if (!hierarchy[unassignedKey]) {
      hierarchy[unassignedKey] = {
        superAdmin: {
          id: unassignedKey,
          firstName: `Unassigned Admins`,
          lastName: `(${location})`,
          email: '',
          location: location
        },
        admins: {}
      };
    }
    
    if (!hierarchy[unassignedKey].admins[adminId]) {
      hierarchy[unassignedKey].admins[adminId] = {
        admin: {
          id: row.admin_id,
          firstName: row.admin_first_name,
          lastName: row.admin_last_name,
          email: row.admin_email,
          location: row.admin_location
        },
        marketers: []
      };
    }
    
    if (row.marketer_id) {
      hierarchy[unassignedKey].admins[adminId].marketers.push({
        id: row.marketer_id,
        firstName: row.marketer_first_name,
        lastName: row.marketer_last_name,
        email: row.marketer_email,
        location: row.marketer_location,
        assignedDate: row.marketer_assigned_date
      });
    }
  });

  // Add unassigned marketers to the hierarchy
  unassignedMarketers.forEach(row => {
    const location = row.marketer_location;
    
    // Create a special key for unassigned marketers by location
    const unassignedMarketersKey = `unassigned_marketers_${location}`;
    
    if (!hierarchy[unassignedMarketersKey]) {
      hierarchy[unassignedMarketersKey] = {
        superAdmin: {
          id: unassignedMarketersKey,
          firstName: `Unassigned Marketers`,
          lastName: `(${location})`,
          email: '',
          location: location
        },
        admins: {}
      };
    }
    
    // Create a virtual admin for unassigned marketers
    const virtualAdminId = `virtual_admin_${location}`;
    
    if (!hierarchy[unassignedMarketersKey].admins[virtualAdminId]) {
      hierarchy[unassignedMarketersKey].admins[virtualAdminId] = {
        admin: {
          id: virtualAdminId,
          firstName: `No Admin Assigned`,
          lastName: `(${location})`,
          email: '',
          location: location
        },
        marketers: []
      };
    }
    
    hierarchy[unassignedMarketersKey].admins[virtualAdminId].marketers.push({
      id: row.marketer_id,
      firstName: row.marketer_first_name,
      lastName: row.marketer_last_name,
      email: row.marketer_email,
      location: row.marketer_location,
      assignedDate: row.marketer_assigned_date
    });
  });
  
  return hierarchy;
}

/**
 * Transfer/Reassign a marketer to a different admin (Master Admin only)
 */
async function reassignMarketer(marketerId, newAdminId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the marketer's current details and location
    const { rows: marketerRows } = await client.query(`
      SELECT id, location, admin_id FROM users WHERE unique_id = $1 AND role = 'Marketer'
    `, [marketerId]);
    
    if (marketerRows.length === 0) {
      throw new Error('Marketer not found');
    }
    
    const marketerInternalId = marketerRows[0].id;
    const marketerLocation = marketerRows[0].location;
    const currentAdminId = marketerRows[0].admin_id;
    
    // Get the new admin's details and location
    const { rows: newAdminRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'Admin'
    `, [newAdminId]);
    
    if (newAdminRows.length === 0) {
      throw new Error('New admin not found');
    }
    
    const newAdminInternalId = newAdminRows[0].id;
    const newAdminLocation = newAdminRows[0].location;
    
    // Validate location match
    if (marketerLocation !== newAdminLocation) {
      throw new Error(`Location mismatch: Marketer is in ${marketerLocation} but new Admin is in ${newAdminLocation}. Reassignments must be within the same location.`);
    }
    
    // Update the marketer's admin_id
    const { rows } = await client.query(`
      UPDATE users 
      SET admin_id = $1, updated_at = NOW()
      WHERE unique_id = $2 AND role = 'Marketer'
      RETURNING unique_id, first_name, last_name, email
    `, [newAdminInternalId, marketerId]);
    
    await client.query('COMMIT');
    
    return {
      marketer: rows[0],
      previousAdminId: currentAdminId,
      newAdminId: newAdminInternalId,
      message: 'Marketer successfully reassigned'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Transfer/Reassign an admin to a different superadmin (Master Admin only)
 */
async function reassignAdmin(adminId, newSuperAdminId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the admin's current details and location
    const { rows: adminRows } = await client.query(`
      SELECT id, location, super_admin_id FROM users WHERE unique_id = $1 AND role = 'Admin'
    `, [adminId]);
    
    if (adminRows.length === 0) {
      throw new Error('Admin not found');
    }
    
    const adminInternalId = adminRows[0].id;
    const adminLocation = adminRows[0].location;
    const currentSuperAdminId = adminRows[0].super_admin_id;
    
    // Get the new superadmin's details and location
    const { rows: newSuperAdminRows } = await client.query(`
      SELECT id, location FROM users WHERE unique_id = $1 AND role = 'SuperAdmin'
    `, [newSuperAdminId]);
    
    if (newSuperAdminRows.length === 0) {
      throw new Error('New SuperAdmin not found');
    }
    
    const newSuperAdminInternalId = newSuperAdminRows[0].id;
    const newSuperAdminLocation = newSuperAdminRows[0].location;
    
    // Validate location match
    if (adminLocation !== newSuperAdminLocation) {
      throw new Error(`Location mismatch: Admin is in ${adminLocation} but new SuperAdmin is in ${newSuperAdminLocation}. Reassignments must be within the same location.`);
    }
    
    // Update the admin's super_admin_id
    const { rows } = await client.query(`
      UPDATE users 
      SET super_admin_id = $1, updated_at = NOW()
      WHERE unique_id = $2 AND role = 'Admin'
      RETURNING unique_id, first_name, last_name, email
    `, [newSuperAdminInternalId, adminId]);
    
    await client.query('COMMIT');
    
    return {
      admin: rows[0],
      previousSuperAdminId: currentSuperAdminId,
      newSuperAdminId: newSuperAdminInternalId,
      message: 'Admin successfully reassigned'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all users by location for reassignment purposes
 */
async function getUsersByLocation(location) {
  const { rows } = await pool.query(`
    SELECT 
      unique_id,
      first_name,
      last_name,
      email,
      role,
      admin_id,
      super_admin_id,
      location
    FROM users 
    WHERE location = $1 
    AND role IN ('Marketer', 'Admin', 'SuperAdmin')
    AND deleted_at IS NULL
    ORDER BY role, first_name, last_name
  `, [location]);
  
  return rows;
}

/**
 * Get all available locations
 */
async function getAllLocations() {
  const { rows } = await pool.query(`
    SELECT DISTINCT location
    FROM users 
    WHERE location IS NOT NULL 
    AND role IN ('Marketer', 'Admin', 'SuperAdmin')
    AND deleted_at IS NULL
    ORDER BY location
  `);
  
  return rows.map(row => row.location);
}

module.exports = {
  getUnassignedMarketers,
  getAvailableAssignees,
  getAssignmentStats,
  getAssignedMarketers,
  getAssignedAdmins,
  assignMarketerToAdmin,
  assignAdminToSuperAdmin,
  unassignMarketer,
  unassignAdmin,
  getAllAssignments,
  getCurrentAssignments,
  reassignMarketer,
  reassignAdmin,
  getUsersByLocation,
  getAllLocations,
  // Legacy exports for backward compatibility
  getAssignmentsByUser,
  getMarketerAssignment,
  assignMarketer,
  updateAssignment,
  deactivateAssignment,
  bulkAssignMarketers
};