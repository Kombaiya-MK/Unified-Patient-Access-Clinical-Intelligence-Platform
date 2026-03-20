/**
 * Unit Tests for Email Service
 * 
 * Tests email sending functionality with mocked dependencies.
 * 
 * NOTE: These tests require a testing framework (Jest/Vitest) to be installed.
 * Install with: npm install --save-dev jest @types/jest ts-jest
 * Or: npm install --save-dev vitest
 * 
 * @module emailService.test
 * @task US_013 TASK_004
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as emailService from '../../src/services/emailService';
import * as pdfService from '../../src/services/pdfService';
import { pool } from '../../src/config/database';
import nodemailer from 'nodemailer';

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/services/pdfService');
jest.mock('../../src/utils/auditLogger');
jest.mock('../../src/utils/logger');
jest.mock('nodemailer');

// Sample appointment data for testing
const mockAppointmentEmailData = {
  id: '123e4567-e89b-12d3-a456-426614174000', // UUID
  appointment_date: new Date('2026-03-20'),
  patient_id: 456,
  start_time: '14:30:00',
  end_time: '15:00:00',
  patient_name: 'John Doe',
  patient_email: 'john.doe@example.com',
  provider_name: 'Dr. Jane Smith',
  department_name: 'Cardiology',
  location: 'Building A, Floor 3, Room 302',
};

const mockPDFBuffer = Buffer.from('Mock PDF content');

// Mock transporter
const mockSendMail = jest.fn().mockResolvedValue({
  messageId: 'mock-message-id-123',
});

const mockVerify = jest.fn().mockResolvedValue(true);

const mockTransporter = {
  sendMail: mockSendMail,
  verify: mockVerify,
  close: jest.fn(),
};

describe('Email Service', () => {
  beforeAll(() => {
    // Setup global mocks
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
    // Mock environment variables
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'test-password';
    process.env.EMAIL_FROM = 'no-reply@upaci.health';
    process.env.PORTAL_URL = 'https://upaci.health';
  });

  afterAll(async () => {
    // Cleanup: Close any open connections
    await emailService.closeEmailTransporter();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('sendAppointmentConfirmation', () => {
    it('should send confirmation email with PDF attachment', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockResolvedValue(mockPDFBuffer);

      // Send confirmation email
      await emailService.sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000');

      // Assertions
      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['123e4567-e89b-12d3-a456-426614174000']);
      expect(pdfService.generateAppointmentPDFBuffer).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(mockSendMail).toHaveBeenCalled();

      // Verify email options
      const emailOptions = mockSendMail.mock.calls[0][0];
      expect(emailOptions.to).toBe('john.doe@example.com');
      expect(emailOptions.subject).toBe('Your Appointment Confirmation - UPACI Health');
      expect(emailOptions.html).toContain('John Doe');
      expect(emailOptions.html).toContain('March 20, 2026');
      expect(emailOptions.text).toContain('John Doe');
      expect(emailOptions.attachments).toHaveLength(1);
      expect(emailOptions.attachments[0].filename).toContain('appointment-123e4567-e89b-12d3-a456-426614174000');
      expect(emailOptions.attachments[0].contentType).toBe('application/pdf');
    });

    it('should include correct email content', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockResolvedValue(mockPDFBuffer);

      // Send confirmation email
      await emailService.sendAppointmentConfirmation(123);

      // Get email options
      const emailOptions = mockSendMail.mock.calls[0][0];

      // Verify HTML content includes all details
      expect(emailOptions.html).toContain('John Doe');
      expect(emailOptions.html).toContain('Dr. Jane Smith');
      expect(emailOptions.html).toContain('Cardiology');
      expect(emailOptions.html).toContain('Building A, Floor 3, Room 302');
      expect(emailOptions.html).toContain('#123');

      // Verify plain text content
      expect(emailOptions.text).toContain('John Doe');
      expect(emailOptions.text).toContain('Dr. Jane Smith');
      expect(emailOptions.text).toContain('Cardiology');
      expect(emailOptions.text).toContain('Building A, Floor 3, Room 302');
      expect(emailOptions.text).toContain('#123');
    });

    it('should throw error for non-existent appointment', async () => {
      // Mock database query returning no results
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      // Expect error to be thrown
      await expect(emailService.sendAppointmentConfirmation('non-existent-uuid')).rejects.toThrow(
        'Appointment non-existent-uuid not found or has been cancelled'
      );

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['non-existent-uuid']);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should throw error if patient email is missing', async () => {
      // Mock database query with missing email
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ ...mockAppointmentEmailData, patient_email: null }],
      });

      // Expect error to be thrown
      await expect(emailService.sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Patient email not found for appointment 123e4567-e89b-12d3-a456-426614174000'
      );

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should retry on SMTP failure (3 attempts)', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockResolvedValue(mockPDFBuffer);

      // Mock SMTP failure for first 2 attempts, success on 3rd
      mockSendMail
        .mockRejectedValueOnce(new Error('SMTP connection timeout'))
        .mockRejectedValueOnce(new Error('SMTP connection timeout'))
        .mockResolvedValueOnce({ messageId: 'mock-message-id-123' });

      // Send confirmation email (should retry and eventually succeed)
      await emailService.sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000');

      // Verify 3 send attempts
      expect(mockSendMail).toHaveBeenCalledTimes(3);
    }, 30000); // Increase timeout for retry delays

    it('should throw error after all retries exhausted', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockResolvedValue(mockPDFBuffer);

      // Mock SMTP failure for all attempts
      mockSendMail.mockRejectedValue(new Error('SMTP connection timeout'));

      // Expect error after retries
      await expect(emailService.sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Failed to send appointment confirmation email after 3 attempts'
      );

      // Verify all 3 retry attempts were made
      expect(mockSendMail).toHaveBeenCalledTimes(3);
    }, 30000); // Increase timeout for retry delays

    it('should handle PDF generation failure', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation failure
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockRejectedValue(
        new Error('PDF generation failed')
      );

      // Expect error to be thrown
      await expect(emailService.sendAppointmentConfirmation('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'PDF generation failed'
      );

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not include PHI in subject line (HIPAA compliant)', async () => {
      // Mock database query
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockAppointmentEmailData],
      });

      // Mock PDF generation
      (pdfService.generateAppointmentPDFBuffer as jest.Mock).mockResolvedValue(mockPDFBuffer);

      // Send confirmation email
      await emailService.sendAppointmentConfirmation(123);

      // Get email options
      const emailOptions = mockSendMail.mock.calls[0][0];

      // Verify subject line does not contain PHI
      expect(emailOptions.subject).not.toContain('John Doe');
      expect(emailOptions.subject).not.toContain('Cardiology');
      expect(emailOptions.subject).not.toContain('Dr. Jane Smith');
      expect(emailOptions.subject).not.toContain('March 20');
      
      // Should only contain generic clinic name
      expect(emailOptions.subject).toBe('Your Appointment Confirmation - UPACI Health');
    });
  });

  describe('testEmailConnection', () => {
    it('should return true for valid email configuration', async () => {
      mockVerify.mockResolvedValue(true);

      const isConnected = await emailService.testEmailConnection();

      expect(isConnected).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should throw error for invalid email configuration', async () => {
      mockVerify.mockRejectedValue(new Error('Invalid credentials'));

      await expect(emailService.testEmailConnection()).rejects.toThrow(
        'Email connection test failed'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status for valid configuration', async () => {
      mockVerify.mockResolvedValue(true);

      const health = await emailService.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.provider).toBe('smtp');
      expect(health.error).toBeUndefined();
    });

    it('should return unhealthy status for invalid configuration', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));

      const health = await emailService.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.provider).toBe('smtp');
      expect(health.error).toContain('Connection failed');
    });
  });

  describe('closeEmailTransporter', () => {
    it('should close transporter without errors', async () => {
      await expect(emailService.closeEmailTransporter()).resolves.not.toThrow();
    });

    it('should handle multiple close calls gracefully', async () => {
      await emailService.closeEmailTransporter();
      await expect(emailService.closeEmailTransporter()).resolves.not.toThrow();
    });
  });
});

/**
 * Integration Test (Optional - requires real email server)
 * 
 * To run integration tests with a real email server:
 * 1. Set up test email server (Mailtrap, Gmail test account, etc.)
 * 2. Configure email credentials in environment
 * 3. Create test appointment in database
 * 4. Send real email
 * 5. Verify email received in inbox
 * 6. Cleanup test data
 */
describe('Email Service Integration Tests', () => {
  // Skipped by default - run with --integration flag
  it.skip('should send real email with real SMTP server', async () => {
    // This test would require:
    // - Real email server credentials
    // - Real database with test appointment
    // - Verification of email receipt (manual or via API)
    // - Cleanup of test data
  });

  it.skip('should attach valid PDF to email', async () => {
    // This test would verify:
    // - Email sent with attachment
    // - Attachment is valid PDF
    // - PDF can be opened and contains correct data
  });

  it.skip('should render email template correctly', async () => {
    // This test would verify:
    // - HTML template renders all variables
    // - Plain text version is formatted correctly
    // - Links are valid and clickable
  });
});

/**
 * Test Execution Instructions
 * 
 * 1. Install testing framework:
 *    npm install --save-dev jest @types/jest ts-jest
 * 
 * 2. Configure Jest (jest.config.js):
 *    module.exports = {
 *      preset: 'ts-jest',
 *      testEnvironment: 'node',
 *      roots: ['<rootDir>/tests'],
 *      testMatch: ['**\/*.test.ts'],
 *      collectCoverageFrom: ['src/**\/*.ts'],
 *      testTimeout: 30000, // Increase for retry tests
 *    };
 * 
 * 3. Update package.json scripts:
 *    "test": "jest",
 *    "test:watch": "jest --watch",
 *    "test:coverage": "jest --coverage",
 *    "test:integration": "jest --testNamePattern='Integration'"
 * 
 * 4. Run tests:
 *    npm test
 *    npm run test:coverage
 *    npm run test:integration
 */
