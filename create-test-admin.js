import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;

async function createTestAdmin() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log(`Creating admin user with password: ${password}`);
  console.log(`Hashed password: ${hashedPassword}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id FROM user_credentials WHERE username = $1',
      ['admin']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists, updating password...');
      await pool.query(
        'UPDATE user_credentials SET hashed_password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      console.log('Admin password updated successfully!');
    } else {
      // Create new admin user
      await pool.query(
        `INSERT INTO user_credentials (id, username, hashed_password, role, is_active, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())`,
        ['admin', hashedPassword, 'admin']
      );
      console.log('Admin user created successfully!');
    }
    
    console.log('\nYou can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createTestAdmin();