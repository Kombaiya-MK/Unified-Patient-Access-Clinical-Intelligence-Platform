import { test, expect } from '@playwright/test';
import { AppointmentBookingPage } from '../pages/appointment-booking.page';
import { MyAppointmentsPage } from '../pages/my-appointments.page';

test.describe('Appointment Booking', () => {
  let appointmentBookingPage: AppointmentBookingPage;
  let myAppointmentsPage: MyAppointmentsPage;

  test.beforeEach(async ({ page }) => {
    appointmentBookingPage = new AppointmentBookingPage(page);
    myAppointmentsPage = new MyAppointmentsPage(page);
  });

  test('TC-UC-001-HP-001: Book Available Appointment Slot', async ({ page }) => {
    // Navigate to appointment booking page
    await page.goto('/appointments/book');
    await expect(page).toHaveURL(/appointments\/book/);

    // Select appointment type
    await appointmentBookingPage.appointmentTypeSelect.selectOption('General Consultation');
    
    // Select preferred date
    await appointmentBookingPage.preferredDatePicker.fill('2026-03-25');
    
    // Search for available slots
    await appointmentBookingPage.searchSlotsButton.click();
    
    // Verify available slots are displayed
    await expect(page.getByRole('button', { name: '10:00 AM' })).toBeVisible();
    
    // Select time slot
    await page.getByRole('button', { name: '10:00 AM' }).click();
    
    // Confirm booking
    await appointmentBookingPage.confirmBookingButton.click();
    
    // Verify success message
    await expect(page.getByText('Appointment booked successfully')).toBeVisible();
    await expect(page.getByText('Confirmation email sent with PDF attachment')).toBeVisible();
  });

  test('TC-UC-001-EC-001: Join Waitlist When Preferred Slot Unavailable', async ({ page }) => {
    // Navigate to appointment booking page
    await page.goto('/appointments/book');
    
    // Select preferred date
    await appointmentBookingPage.preferredDatePicker.fill('2026-03-25');
    
    // Search for available slots
    await appointmentBookingPage.searchSlotsButton.click();
    
    // Verify slot is marked as unavailable
    await expect(page.getByText('10:00 AM - Fully Booked')).toBeVisible();
    
    // Join waitlist
    await page.getByRole('button', { name: 'Join Waitlist for 10:00 AM' }).click();
    
    // Confirm waitlist
    await page.getByRole('button', { name: 'Confirm Waitlist' }).click();
    
    // Verify waitlist confirmation
    await expect(page.getByText('Added to waitlist. You will be notified if this slot becomes available.')).toBeVisible();
  });

  test('TC-UC-001-ER-001: Booking Fails with Past Date', async ({ page }) => {
    // Navigate to appointment booking page
    await page.goto('/appointments/book');
    
    // Enter past date
    await appointmentBookingPage.preferredDatePicker.fill('2026-03-01');
    
    // Attempt to search for slots
    await appointmentBookingPage.searchSlotsButton.click();
    
    // Verify error alert is displayed
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Please select a future date. Past dates are not allowed.')).toBeVisible();
    
    // Verify confirm button is disabled
    await expect(appointmentBookingPage.confirmBookingButton).toBeDisabled();
  });

  test('TC-UC-001-EC-002: Reschedule Existing Appointment', async ({ page }) => {
    // Navigate to my appointments page
    await page.goto('/appointments/my-appointments');
    
    // Click reschedule button
    await myAppointmentsPage.rescheduleButton.click();
    
    // Select new date
    await page.getByLabel('New Date').fill('2026-03-26');
    
    // Search for available slots
    await page.getByRole('button', { name: 'Search Available Slots' }).click();
    
    // Select new time slot
    await page.getByRole('button', { name: '2:00 PM' }).click();
    
    // Confirm reschedule
    await page.getByRole('button', { name: 'Confirm Reschedule' }).click();
    
    // Verify reschedule success
    await expect(page.getByText('Appointment rescheduled successfully')).toBeVisible();
    await expect(page.getByText('Confirmation email sent with updated PDF')).toBeVisible();
  });

  test('TC-UC-001-EC-003: Cancel Appointment', async ({ page }) => {
    // Navigate to my appointments page
    await page.goto('/appointments/my-appointments');
    
    // Click cancel appointment button
    await myAppointmentsPage.cancelButton.click();
    
    // Enter cancellation reason
    await page.getByLabel('Cancellation Reason (Optional)').fill('Personal emergency');
    
    // Confirm cancellation
    await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
    
    // Verify cancellation success
    await expect(page.getByText('Appointment cancelled successfully')).toBeVisible();
    await expect(page.getByText('An email confirmation has been sent')).toBeVisible();
  });
});
