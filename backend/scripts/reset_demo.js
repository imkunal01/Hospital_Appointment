const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetDemo() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('--- Starting Demo User Reset ---');

    // 1. Compute fresh bcrypt hash for Password123!
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 2. Find patient1 user
    const userRes = await client.query(
      "SELECT id, email FROM users WHERE email = 'patient1@example.test'"
    );

    if (userRes.rows.length === 0) {
      console.log('patient1@example.test not found, creating seed user...');
      await client.query(
        `INSERT INTO users (id, email, password_hash, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider, avatar_url)
         VALUES ('a1111111-1111-1111-1111-111111111111', 'patient1@example.test', $1, 'John Doe (Synthetic)', 'PATIENT', NULL, FALSE, NULL, NULL, FALSE, 'LOCAL', NULL)`,
        [passwordHash]
      );
    } else {
      const patientId = userRes.rows[0].id;

      // Free any slots booked by patient1 (except the initial seed completed appointment)
      const nonSeedApts = await client.query(
        `SELECT id, slot_id FROM appointments 
         WHERE patient_id = $1 AND id != 'b1111111-1111-1111-1111-111111111111'`,
        [patientId]
      );

      if (nonSeedApts.rows.length > 0) {
        const slotIds = nonSeedApts.rows.map(r => r.slot_id).filter(Boolean);
        if (slotIds.length > 0) {
          await client.query(
            `UPDATE slots SET status = 'AVAILABLE' WHERE id = ANY($1::uuid[])`,
            [slotIds]
          );
          console.log(`Freed ${slotIds.length} slots back to AVAILABLE.`);
        }

        await client.query(
          `DELETE FROM appointments 
           WHERE patient_id = $1 AND id != 'b1111111-1111-1111-1111-111111111111'`,
          [patientId]
        );
        console.log(`Removed ${nonSeedApts.rows.length} test appointments.`);
      }

      // Reset patient1 record
      await client.query(
        `UPDATE users
         SET password_hash = $1,
             name = 'John Doe (Synthetic)',
             phone = NULL,
             phone_verified = FALSE,
             dob = NULL,
             location = NULL,
             onboarding_completed = FALSE,
             avatar_url = NULL,
             auth_provider = 'LOCAL'
         WHERE id = $2`,
        [passwordHash, patientId]
      );

      // Clean up phone verifications
      await client.query(
        "DELETE FROM phone_verifications WHERE user_id = $1 OR phone = '+915658654477'",
        [patientId]
      );

      // Revoke all refresh tokens
      await client.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [patientId]
      );

      console.log('Successfully reset patient1@example.test credentials & profile.');
    }

    // 3. Also check if patient.google@example.test exists and reset it
    await client.query(
      `UPDATE users
       SET phone = NULL,
           phone_verified = FALSE,
           dob = NULL,
           location = NULL,
           onboarding_completed = FALSE,
           avatar_url = NULL
       WHERE email = 'patient.google@example.test'`
    );
    console.log('Successfully reset patient.google@example.test onboarding state.');

    await client.query('COMMIT');

    // 4. Verification Query
    const verifyUser = await client.query(
      "SELECT id, email, name, phone, phone_verified, onboarding_completed, avatar_url FROM users WHERE email IN ('patient1@example.test', 'patient.google@example.test')"
    );
    console.log('\n--- Verified Demo Users After Reset ---');
    console.table(verifyUser.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDemo().then(() => {
  console.log('Demo users reset complete!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
