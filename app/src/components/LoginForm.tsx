/**
 * LoginForm Component
 * 
 * Form component for user authentication with email and password.
 * Uses Formik for form state management and Yup for validation.
 * 
 * Features:
 * - Email and password inputs with validation
 * - "Remember Me" checkbox for session persistence (7 days vs 15 minutes)
 * - Password visibility toggle
 * - Inline validation errors
 * - Loading state during submission
 * - Keyboard navigation with visible focus indicators
 * - WCAG 2.2 AA accessibility compliance
 * 
 * @module LoginForm
 * @created 2026-03-18
 * @task US_012 TASK_001
 */

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage as FormikErrorMessage } from 'formik';
import type { FormikHelpers } from 'formik';
import { loginSchema, type LoginFormValues } from '../utils/validators';
import type { LoginRequest } from '../types/auth.types';
import { ErrorMessage } from './common/ErrorMessage';
import { ButtonSpinner } from './common/LoadingSpinner';
import { PasswordToggle } from './common/PasswordToggle';
import './LoginForm.css';
import '../styles/form-responsive.css';
import '../styles/formValidation.css';

/**
 * LoginForm props
 */
interface LoginFormProps {
  /** Callback when form is submitted */
  onSubmit: (credentials: LoginRequest) => Promise<void>;
  /** Error message from authentication attempt */
  error: string | null;
  /** Loading state during submission */
  loading: boolean;
}

/**
 * LoginForm Component
 * 
 * Renders login form with email, password, and remember me fields.
 * Validates input using Yup schema and calls onSubmit when valid.
 */
export function LoginForm({ onSubmit, error, loading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Initial form values
   */
  const initialValues: LoginFormValues = {
    email: '',
    password: '',
    rememberMe: false,
  };

  /**
   * Handle form submission
   * @param values - Form values from Formik
   * @param formikHelpers - Formik helper methods
   */
  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    try {
      await onSubmit(values as LoginRequest);
    } catch (error) {
      // Error is handled by parent component
      console.error('Login form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={loginSchema}
      onSubmit={handleSubmit}
      validateOnBlur={true}
      validateOnChange={false}
    >
      {({ isSubmitting, errors, touched }) => {
        // Sync Formik errors with form error tracking
        const touchedErrors = Object.keys(errors).filter(
          (key) => touched[key as keyof typeof touched]
        );
        const hasTouchedErrors = touchedErrors.length > 0;

        return (
        <Form className="login-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <Field
              type="email"
              id="email"
              name="email"
              className={`form-input input responsive-input ${errors.email && touched.email ? 'form-input--error input--error' : ''}`}
              placeholder="Enter your email"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={errors.email && touched.email ? 'true' : 'false'}
              aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
              autoComplete="email"
              disabled={loading || isSubmitting}
            />
            <FormikErrorMessage name="email">
              {(msg) => (
                <ErrorMessage
                  id="email-error"
                  message={msg}
                  variant="inline"
                  ariaLive="polite"
                  testId="email-error"
                />
              )}
            </FormikErrorMessage>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="form-input-wrapper">
              <Field
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className={`form-input input responsive-input ${errors.password && touched.password ? 'form-input--error input--error' : ''}`}
                placeholder="Enter your password"
                aria-label="Password"
                aria-required="true"
                aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                autoComplete="current-password"
                disabled={loading || isSubmitting}
              />
              <PasswordToggle
                showPassword={showPassword}
                onToggle={togglePasswordVisibility}
                disabled={loading || isSubmitting}
                testId="password-toggle"
              />
            </div>
            <FormikErrorMessage name="password">
              {(msg) => (
                <ErrorMessage
                  id="password-error"
                  message={msg}
                  variant="inline"
                  ariaLive="polite"
                  testId="password-error"
                />
              )}
            </FormikErrorMessage>
          </div>

          {/* Remember Me Checkbox */}
          <div className="form-group form-group--checkbox">
            <label className="checkbox-label">
              <Field
                type="checkbox"
                name="rememberMe"
                className="checkbox-input"
                aria-label="Remember me for 7 days"
                disabled={loading || isSubmitting}
              />
              <span className="checkbox-text">Remember me for 7 days</span>
            </label>
          </div>

          {/* Error Message (from auth API) */}
          {error && (
            <ErrorMessage
              message={error}
              variant="global"
              ariaLive="assertive"
              testId="auth-error"
            />
          )}

          {/* Submit Button */}
          <div title={hasTouchedErrors ? `Please fix ${touchedErrors.length} error${touchedErrors.length === 1 ? '' : 's'}` : undefined}>
            <button
              type="submit"
              className={`btn btn--primary btn--block btn-responsive btn-responsive--primary btn-responsive--full-width-mobile${hasTouchedErrors ? ' btn--disabled' : ''}`}
              disabled={loading || isSubmitting || hasTouchedErrors}
              aria-label="Sign in to your account"
              aria-disabled={hasTouchedErrors ? 'true' : undefined}
            >
              {loading || isSubmitting ? (
                <>
                  <ButtonSpinner label="Signing in" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

          {/* ARIA Live Regions for Assistive Technology */}
          <div role="status" aria-live="polite" className="sr-only">
            {loading || isSubmitting ? 'Signing in, please wait...' : ''}
          </div>
          <div role="alert" aria-live="assertive" className="sr-only">
            {error || ''}
          </div>
        </Form>
        );
      }}
    </Formik>
  );
}
