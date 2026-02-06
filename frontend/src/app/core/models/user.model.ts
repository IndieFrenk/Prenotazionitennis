/**
 * User-related interfaces for authentication and user management.
 */

/** Represents a registered user in the system. */
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

/** Server response after successful authentication (login/register). */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Payload for the login endpoint. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Payload for the registration endpoint. */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/** Payload for the change-password endpoint. */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Payload for updating a user's profile (admin). */
export interface UserUpdateRequest {
  username?: string;
  role?: string;
}
