/**
 * Welcome Banner Component
 * 
 * Welcome header banner for patient dashboard with personalized greeting,
 * profile photo (with initials fallback), and logout button.
 * 
 * Features:
 * - Personalized greeting with patient name
 * - Circular profile photo/avatar
 * - Initials fallback when no photo URL
 * - Logout button
 * - Responsive layout
 * - Accessible focus states
 * 
 * Design:
 * - Follows SCR-002 wireframe specifications
 * - Uses design tokens from designsystem.md
 * - Profile photo: 48px circle, border-radius: 50%
 * - Typography: H2 greeting, Body description
 * 
 * @module WelcomeBanner
 * @created 2026-03-19
 * @task US_019 TASK_001
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './WelcomeBanner.css';

/**
 * Welcome Banner Props
 */
interface WelcomeBannerProps {
  /** Optional custom profile photo URL */
  photoUrl?: string;
}

/**
 * Get user initials from name or email
 * 
 * @param name - User's full name
 * @param email - User's email (fallback)
 * @returns Two-letter initials (e.g., "JD" for "John Doe")
 */
function getUserInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      // First and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Single name
    return name.substring(0, 2).toUpperCase();
  }

  if (email) {
    // Use first 2 letters of email
    return email.substring(0, 2).toUpperCase();
  }

  return '??';
}

/**
 * Get greeting based on time of day
 * 
 * @returns Greeting string (Good morning/afternoon/evening)
 */
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Welcome Banner Component
 * 
 * Displays personalized welcome message with profile photo and logout button.
 * Profile photo falls back to initials if no URL provided.
 * 
 * @example
 * ```tsx
 * <WelcomeBanner photoUrl="https://example.com/photo.jpg" />
 * ```
 */
export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ photoUrl }) => {
  const { user, logout } = useAuth();

  // Extract user info
  const userName = user?.name || user?.email || 'User';
  const userInitials = getUserInitials(user?.name, user?.email);
  const greeting = getTimeBasedGreeting();

  /**
   * Handle logout click
   */
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="welcome-banner" role="banner" aria-label="Welcome banner">
      <div className="welcome-banner__content">
        {/* Welcome Message */}
        <div className="welcome-banner__text">
          <h2 className="welcome-banner__greeting">
            {greeting}, <span className="welcome-banner__name">{userName}</span>!
          </h2>
          <p className="welcome-banner__description">
            Manage your appointments and view your medical information
          </p>
        </div>

        {/* User Actions */}
        <div className="welcome-banner__actions">
          {/* Profile Photo */}
          <div className="welcome-banner__profile" aria-label={`Profile photo for ${userName}`}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${userName}'s profile`}
                className="welcome-banner__photo"
                onError={(e) => {
                  // Fallback to initials on image load error
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.classList.add('welcome-banner__profile--initials');
                    parent.textContent = userInitials;
                  }
                }}
              />
            ) : (
              <div className="welcome-banner__initials" aria-label="User initials">
                {userInitials}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            className="welcome-banner__logout"
            onClick={handleLogout}
            aria-label="Log out of your account"
          >
            <span className="welcome-banner__logout-icon" aria-hidden="true">
              🚪
            </span>
            <span className="welcome-banner__logout-text">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
