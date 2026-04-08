/**
 * Test data generators for load testing scenarios.
 * Produces randomised but realistic values each iteration, avoiding constant data
 * that could trigger deduplication or cache short-circuits.
 */

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer',
  'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Susan',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
  'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
];

const REASONS = [
  'Annual physical examination',
  'Follow-up visit for blood pressure check',
  'Persistent headache for two weeks',
  'Skin rash on left arm',
  'Lower back pain lasting one month',
  'Routine cholesterol screening',
  'Sore throat and mild fever',
  'Joint stiffness in the morning',
];

/**
 * Pick a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random first name */
export function randomFirstName() {
  return pick(FIRST_NAMES);
}

/** Random last name */
export function randomLastName() {
  return pick(LAST_NAMES);
}

/** Random full name */
export function randomName() {
  return `${randomFirstName()} ${randomLastName()}`;
}

/**
 * Random future date string (YYYY-MM-DD) between 1 and 30 days from now.
 * @returns {string}
 */
export function randomFutureDate() {
  const now = Date.now();
  const offsetDays = Math.floor(Math.random() * 30) + 1;
  const future = new Date(now + offsetDays * 86_400_000);
  return future.toISOString().slice(0, 10);
}

/**
 * Random appointment reason.
 * @returns {string}
 */
export function randomReason() {
  return pick(REASONS);
}

/**
 * Random department ID (1 – 5).
 * @returns {number}
 */
export function randomDepartmentId() {
  return Math.floor(Math.random() * 5) + 1;
}

/**
 * Random hour between 8 AM and 4 PM formatted as HH:00.
 * @returns {string}
 */
export function randomTimeSlot() {
  const hour = Math.floor(Math.random() * 9) + 8; // 8–16
  return `${String(hour).padStart(2, '0')}:00`;
}
