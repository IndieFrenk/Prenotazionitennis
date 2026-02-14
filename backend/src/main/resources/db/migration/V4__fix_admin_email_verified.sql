-- V4: Fix admin user email_verified flag
-- The admin user was created before the email_verified column existed.
-- Set it to true so admin can log in.
UPDATE users SET email_verified = true WHERE role = 'ROLE_ADMIN';
-- Also set email_verified = true for any existing users created before V3
UPDATE users SET email_verified = true WHERE email_verified IS NULL;
