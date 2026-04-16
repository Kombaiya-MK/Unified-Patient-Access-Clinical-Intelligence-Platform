# Task - TASK_003_FE_FORM_INPUT_ACCESSIBILITY

## Requirement Reference
- User Story: US_043
- Story Location: .propel/context/tasks/us_043/us_043.md
- Acceptance Criteria:
    - Provides accessible form labels with visible labels + programmatic associations (label for="inputId")
    - Provides error identification with accessible error messages (aria-live="assertive" for critical errors, "polite" for warnings)
    - Supports screen readers (NVDA, JAWS, VoiceOver) with ARIA labels on all buttons, inputs, and dynamic content regions
- Edge Case:
    - What happens when dynamic content updates? (ARIA live regions announce changes to screen readers)

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes |
| **Figma URL** | N/A (applies to form screens: SCR-001, SCR-005, SCR-006, SCR-007, SCR-013) |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | wireframe-SCR-001-login.html, wireframe-SCR-006-booking.html, wireframe-SCR-007-intake.html, wireframe-SCR-013-user-mgmt.html |
| **Screen Spec** | figma_spec.md#SCR-001 (Login), #SCR-006 (Booking), #SCR-007 (Intake), #SCR-013 (User Management) |
| **UXR Requirements** | UXR-501 (Inline validation), UXR-102 (Screen reader support), UXR-103 (Keyboard navigation) |
| **Design Tokens** | designsystem.md#colors (error colors), designsystem.md#forms (input styles) |

> **Wireframe Details:**
> - **Form labels**: All inputs have visible labels above field, associated via label[for=""]
> - **Error messages**: Red text below field with role="alert" and aria-live="assertive"
> - **Required indicators**: Asterisk (*) with aria-required="true" on input
> - **Help text**: Gray text below field with aria-describedby linking to help text ID

### **CRITICAL: Wireframe Implementation Requirement (UI Tasks Only)**
**IF Wireframe Status = AVAILABLE or EXTERNAL:**
- **MUST** validate form structure matches wireframe (label above, input, error below, help text)
- **MUST** ensure error messages appear in correct location (below field)
- **MUST** validate at breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | React Hook Form | 7.x |
| Backend | N/A | N/A |
| Database | N/A | N/A |

**Note**: All code and libraries MUST be compatible with versions above. Must follow React 18, TypeScript 5, WCAG 2.2 AA standards.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive web) |
| **Platform Target** | Web (Responsive design) |
| **Min OS Version** | iOS 14+, Android 10+ |

## Task Overview
Implement accessible form patterns across all forms (Login, Booking, Intake, Profile, User Management): (1) Create AccessibleInput component (app/src/components/forms/AccessibleInput.tsx) with proper label association (<label htmlFor="inputId">), visible label above input, aria-required="true" for required fields, aria-invalid="true" for validation errors, aria-describedby linking to error message and help text IDs, placeholder text only for examples (not replacing labels), (2) Create AccessibleSelect component with <label>, aria-labelledby, aria-required, optgroup support for grouping options, first option as placeholder with disabled attribute, (3) Create AccessibleCheckbox and AccessibleRadio components with fieldset/legend for groups, proper label association, aria-checked for custom styled checkboxes, keyboard support (Space to toggle, arrow keys for radio groups), (4) Create Form Error component (app/src/components/forms/FormError.tsx) with role="alert", aria-live="assertive" for immediate errors (login failed, payment declined), aria-live="polite" for validation warnings, error icon with aria-hidden="true", descriptive error text, (5) Update all existing forms to use accessible form components: Login form (email, password), Booking form (date, time, provider, notes), Intake form (demographics, medical history), Profile form (name, contact, preferences), User Management form (username, email, role), (6) Add inline validation with error messages appearing immediately below fields on blur, validation summary at top of form listing all errors with links to fields, focus first error field on form submit failure, (7) Implement required field indicators with asterisk (*) and "required" in label text, aria-required="true" on input, visual indicator at 3:1 contrast ratio, (8) Add autocomplete attributes to inputs (autocomplete="email", autocomplete="tel", autocomplete="name") for autofill support.

## Dependent Tasks
- task_001_fe_accessibility_audit_infrastructure.md (audit identifies form issues)
- task_002_fe_core_accessibility_features.md (LiveRegion component for error announcements)

## Impacted Components
- app/src/components/forms/AccessibleInput.tsx (NEW)
- app/src/components/forms/AccessibleSelect.tsx (NEW)  
- app/src/components/forms/AccessibleCheckbox.tsx (NEW)
- app/src/components/forms/AccessibleRadio.tsx (NEW)
- app/src/components/forms/FormError.tsx (NEW - error message component)
- app/src/components/forms/ValidationSummary.tsx (NEW - error summary at top of form)
- app/src/pages/LoginPage.tsx (MODIFY - use accessible form components)
- app/src/pages/AppointmentBookingPage.tsx (MODIFY - use accessible form components)
- app/src/pages/PatientIntakePage.tsx (MODIFY - use accessible form components)
- app/src/pages/ProfilePage.tsx (MODIFY - use accessible form components)
- app/src/pages/UserManagementPage.tsx (MODIFY - use accessible form components)

## Implementation Plan
1. **Create AccessibleInput Component**:
   ```typescript
   import React, { useId } from 'react';
   import './AccessibleInput.css';
   
   interface AccessibleInputProps {
     label: string;
     type?: string;
     value: string;
     onChange: (value: string) => void;
     required?: boolean;
     error?: string;
     helpText?: string;
     placeholder?: string;
     autocomplete?: string;
     disabled?: boolean;
   }
   
   export const AccessibleInput: React.FC<AccessibleInputProps> = ({
     label,
     type = 'text',
     value,
     onChange,
     required = false,
     error,
     helpText,
     placeholder,
     autocomplete,
     disabled = false,
   }) => {
     const inputId = useId();
     const errorId = `${inputId}-error`;
     const helpId = `${inputId}-help`;
     
     const describedBy = [];
     if (error) describedBy.push(errorId);
     if (helpText) describedBy.push(helpId);
     
     return (
       <div className="form-field">
         <label htmlFor={inputId} className="form-label">
           {label}
           {required && <span className="required-indicator" aria-label="required">*</span>}
         </label>
         
         {helpText && (
           <div id={helpId} className="help-text">
             {helpText}
           </div>
         )}
         
         <input
           id={inputId}
           type={type}
           value={value}
           onChange={(e) => onChange(e.target.value)}
           required={required}
           disabled={disabled}
           placeholder={placeholder}
           autoComplete={autocomplete}
           aria-required={required}
           aria-invalid={!!error}
           aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
           className={error ? 'input-error' : ''}
         />
         
         {error && (
           <div id={errorId} className="error-message" role="alert" aria-live="assertive">
             <span aria-hidden="true">⚠</span> {error}
           </div>
         )}
       </div>
     );
   };
   ```

2. **Create AccessibleSelect Component**:
   ```typescript
   import React, { useId } from 'react';
   
   interface Option {
     value: string;
     label: string;
     disabled?: boolean;
   }
   
   interface OptionGroup {
     label: string;
     options: Option[];
   }
   
   interface AccessibleSelectProps {
     label: string;
     value: string;
     onChange: (value: string) => void;
     options?: Option[];
     optionGroups?: OptionGroup[];
     required?: boolean;
     error?: string;
     helpText?: string;
     placeholder?: string;
     disabled?: boolean;
   }
   
   export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
     label,
     value,
     onChange,
     options,
     optionGroups,
     required = false,
     error,
     helpText,
     placeholder = 'Select an option...',
     disabled = false,
   }) => {
     const selectId = useId();
     const errorId = `${selectId}-error`;
     const helpId = `${selectId}-help`;
     
     const describedBy = [];
     if (error) describedBy.push(errorId);
     if (helpText) describedBy.push(helpId);
     
     return (
       <div className="form-field">
         <label htmlFor={selectId} className="form-label">
           {label}
           {required && <span className="required-indicator">*</span>}
         </label>
         
         {helpText && <div id={helpId} className="help-text">{helpText}</div>}
         
         <select
           id={selectId}
           value={value}
           onChange={(e) => onChange(e.target.value)}
           required={required}
           disabled={disabled}
           aria-required={required}
           aria-invalid={!!error}
           aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
           className={error ? 'select-error' : ''}
         >
           <option value="" disabled>
             {placeholder}
           </option>
           
           {options && options.map(opt => (
             <option key={opt.value} value={opt.value} disabled={opt.disabled}>
               {opt.label}
             </option>
           ))}
           
           {optionGroups && optionGroups.map(group => (
             <optgroup key={group.label} label={group.label}>
               {group.options.map(opt => (
                 <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                   {opt.label}
                 </option>
               ))}
             </optgroup>
           ))}
         </select>
         
         {error && (
           <div id={errorId} className="error-message" role="alert">
             <span aria-hidden="true">⚠</span> {error}
           </div>
         )}
       </div>
     );
   };
   ```

3. **Create AccessibleCheckbox and AccessibleRadio**:
   ```typescript
   // AccessibleCheckbox.tsx
   interface AccessibleCheckboxProps {
     label: string;
     checked: boolean;
     onChange: (checked: boolean) => void;
     required?: boolean;
     disabled?: boolean;
   }
   
   export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
     label,
     checked,
     onChange,
     required = false,
     disabled = false,
   }) => {
     const checkboxId = useId();
     
     return (
       <div className="checkbox-field">
         <input
           type="checkbox"
           id={checkboxId}
           checked={checked}
           onChange={(e) => onChange(e.target.checked)}
           required={required}
           disabled={disabled}
           aria-required={required}
           aria-checked={checked}
         />
         <label htmlFor={checkboxId}>
           {label}
           {required && <span className="required-indicator">*</span>}
         </label>
       </div>
     );
   };
   
   // AccessibleRadio.tsx - Radio button group
   interface RadioOption {
     value: string;
     label: string;
     disabled?: boolean;
   }
   
   interface AccessibleRadioGroupProps {
     legend: string;
     name: string;
     value: string;
     onChange: (value: string) => void;
     options: RadioOption[];
     required?: boolean;
     error?: string;
   }
   
   export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
     legend,
     name,
     value,
     onChange,
     options,
     required = false,
     error,
   }) => {
     return (
       <fieldset className="radio-group">
         <legend className="form-label">
           {legend}
           {required && <span className="required-indicator">*</span>}
         </legend>
         
         {options.map(option => {
           const radioId = `${name}-${option.value}`;
           return (
             <div key={option.value} className="radio-field">
               <input
                 type="radio"
                 id={radioId}
                 name={name}
                 value={option.value}
                 checked={value === option.value}
                 onChange={(e) => onChange(e.target.value)}
                 disabled={option.disabled}
                 aria-required={required}
               />
               <label htmlFor={radioId}>{option.label}</label>
             </div>
           );
         })}
         
         {error && (
           <div className="error-message" role="alert">
             <span aria-hidden="true">⚠</span> {error}
           </div>
         )}
       </fieldset>
     );
   };
   ```

4. **Create FormError and ValidationSummary Components**:
   ```typescript
   // FormError.tsx
   interface FormErrorProps {
     message: string;
     severity?: 'error' | 'warning';
   }
   
   export const FormError: React.FC<FormErrorProps> = ({ 
     message, 
     severity = 'error' 
   }) => {
     return (
       <div 
         className={`form-error ${severity}`}
         role="alert"
         aria-live={severity === 'error' ? 'assertive' : 'polite'}
       >
         <span aria-hidden="true">{severity === 'error' ? '⚠' : 'ℹ'}</span>
         {message}
       </div>
     );
   };
   
   // ValidationSummary.tsx
   interface FieldError {
     field: string;
     message: string;
   }
   
   interface ValidationSummaryProps {
     errors: FieldError[];
     onFieldFocus: (field: string) => void;
   }
   
   export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
     errors, 
     onFieldFocus 
   }) => {
     if (errors.length === 0) return null;
     
     return (
       <div 
         className="validation-summary" 
         role="alert" 
         aria-labelledby="error-summary-title"
       >
         <h3 id="error-summary-title">
           Please correct the following {errors.length} error{errors.length > 1 ? 's' : ''}:
         </h3>
         <ul>
           {errors.map((error, idx) => (
             <li key={idx}>
               <button
                 type="button"
                 onClick={() => onFieldFocus(error.field)}
                 className="error-link"
               >
                 {error.field}: {error.message}
               </button>
             </li>
           ))}
         </ul>
       </div>
     );
   };
   ```

5. **Update Login Form Example**:
   ```typescript
   import { AccessibleInput } from '../components/forms/AccessibleInput';
   import { ValidationSummary } from '../components/forms/ValidationSummary';
   
   export const LoginPage: React.FC = () => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [errors, setErrors] = useState<Record<string, string>>({});
     
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       
       const validationErrors: Record<string, string> = {};
       if (!email) validationErrors.email = 'Email is required';
       if (!password) validationErrors.password = 'Password is required';
       
       if (Object.keys(validationErrors).length > 0) {
         setErrors(validationErrors);
         // Focus first error field
         const firstErrorField = Object.keys(validationErrors)[0];
         document.getElementById(`${firstErrorField}-input`)?.focus();
         return;
       }
       
       // Submit form...
     };
     
     const handleFieldFocus = (field: string) => {
       document.getElementById(`${field}-input`)?.focus();
     };
     
     return (
       <form onSubmit={handleSubmit} aria-labelledby="login-title">
         <h1 id="login-title">Login</h1>
         
         <ValidationSummary
           errors={Object.entries(errors).map(([field, message]) => ({ 
             field, 
             message 
           }))}
           onFieldFocus={handleFieldFocus}
         />
         
         <AccessibleInput
           label="Email"
           type="email"
           value={email}
           onChange={setEmail}
           required
           error={errors.email}
           autocomplete="email"
           helpText="Enter your registered email address"
         />
         
         <AccessibleInput
           label="Password"
           type="password"
           value={password}
           onChange={setPassword}
           required
           error={errors.password}
           autocomplete="current-password"
         />
         
         <button type="submit">Login</button>
       </form>
     );
   };
   ```

6. **Add Autocomplete Attributes**:
   ```typescript
   // Common autocomplete values for accessibility
   const autocompleteMapping = {
     email: 'email',
     password: 'current-password',
     newPassword: 'new-password',
     firstName: 'given-name',
     lastName: 'family-name',
     phone: 'tel',
     addressLine1: 'address-line1',
     city: 'address-level2',
     state: 'address-level1',
     zip: 'postal-code',
     country: 'country-name',
     birthday: 'bday',
   };
   ```

## Current Project State
```
app/
├── src/
│   ├── components/
│   │   ├── forms/ (NEW folder)
│   │   │   ├── AccessibleInput.tsx (NEW)
│   │   │   ├── AccessibleSelect.tsx (NEW)
│   │   │   ├── AccessibleCheckbox.tsx (NEW)
│   │   │   ├── AccessibleRadio.tsx (NEW)
│   │   │   ├── FormError.tsx (NEW)
│   │   │   ├── ValidationSummary.tsx (NEW)
│   │   │   └── AccessibleInput.css (NEW)
│   │   └── ...
│   └── pages/
│       ├── LoginPage.tsx (MODIFY)
│       ├── AppointmentBookingPage.tsx (MODIFY)
│       ├── PatientIntakePage.tsx (MODIFY)
│       ├── ProfilePage.tsx (MODIFY)
│       └── UserManagementPage.tsx (MODIFY)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/components/forms/AccessibleInput.tsx | Accessible text input with label, error, help text |
| CREATE | app/src/components/forms/AccessibleSelect.tsx | Accessible select dropdown with optgroup support |
| CREATE | app/src/components/forms/AccessibleCheckbox.tsx | Accessible checkbox with proper label association |
| CREATE | app/src/components/forms/AccessibleRadio.tsx | Accessible radio button group with fieldset/legend |
| CREATE | app/src/components/forms/FormError.tsx | Error message component with ARIA live regions |
| CREATE | app/src/components/forms/ValidationSummary.tsx | Form validation summary with error links |
| CREATE | app/src/components/forms/AccessibleInput.css | Form field styles |
| MODIFY | app/src/pages/LoginPage.tsx | Replace inputs with AccessibleInput components |
| MODIFY | app/src/pages/AppointmentBookingPage.tsx | Replace form fields with accessible components |
| MODIFY | app/src/pages/PatientIntakePage.tsx | Replace form fields with accessible components |
| MODIFY | app/src/pages/ProfilePage.tsx | Replace form fields with accessible components |
| MODIFY | app/src/pages/UserManagementPage.tsx | Replace form fields with accessible components |

## External References
- [WAI-ARIA Authoring Practices - Forms](https://www.w3.org/WAI/ARIA/apg/patterns/form/)
- [WCAG 3.3.2 Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
- [WCAG 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
- [HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)

## Build Commands
```bash
cd app
npm install
npm run dev
npm test -- --testPathPattern=forms
```

## Implementation Validation Strategy
- [x] All form inputs have visible labels above field
- [x] Labels associated with inputs via htmlFor / id
- [x] Required fields have asterisk (*) and aria-required="true"
- [x] Error messages have role="alert" and aria-live="assertive"
- [x] Error messages appear below field on validation failure
- [x] Help text linked via aria-describedby
- [x] Validation summary lists all errors with links to fields
- [x] Focus moves to first error field on submit failure
- [x] Autocomplete attributes added to appropriate fields
- [ ] **[UI Tasks]** Validate form layout matches wireframes at all breakpoints
- [ ] Screen reader test: NVDA announces labels, errors, help text
- [ ] Keyboard test: Tab through form, Enter submits, Space toggles checkboxes

## Implementation Checklist
- [x] Create app/src/components/forms/ folder
- [x] Create AccessibleInput.tsx with label, input, error, help text
- [x] Add useId() hook for unique IDs
- [x] Add aria-required, aria-invalid, aria-describedby to input
- [x] Add role="alert", aria-live="assertive" to error message
- [x] Create AccessibleSelect.tsx with dropdown and optgroup support
- [x] Create AccessibleCheckbox.tsx with checkbox label association
- [x] Create AccessibleRadio.tsx with fieldset/legend for radio groups
- [x] Create FormError.tsx with severity levels (error/warning)
- [x] Create ValidationSummary.tsx with error list and focus links
- [x] Add autocompleteMapping object with common autocomplete values
- [x] Modify LoginPage.tsx to use AccessibleInput
- [x] Add ValidationSummary to LoginPage
- [x] Add handleFieldFocus function for error links
- [ ] Modify BookingPage forms to use accessible components
- [ ] Modify IntakePage forms to use accessible components
- [ ] Modify ProfilePage forms to use accessible components
- [ ] Modify UserManagementPage forms to use accessible components
- [ ] Test form validation: Submit empty form, verify errors appear
- [ ] Test error focus: Click error in summary, verify field receives focus
- [ ] Test screen reader: Verify labels, errors, help text announced
- [ ] Write unit tests for accessible form components
- [ ] Commit all changes to version control
