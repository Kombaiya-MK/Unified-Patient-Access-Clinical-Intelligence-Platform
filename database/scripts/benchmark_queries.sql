-- ============================================================================
-- Performance Benchmark Queries
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Benchmark queries with EXPLAIN ANALYZE to verify performance targets
-- Target Latencies:
--   - Slot availability: < 100ms
--   - Patient lookup: < 200ms
--   - Appointment listing: < 150ms
--   - Document similarity search: < 200ms
-- Usage: psql -U postgres -d upaci -f scripts/benchmark_queries.sql
-- ============================================================================

\timing on
\echo ''
\echo '============================================================================'
\echo 'Performance Benchmark Report'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- Setup: Enable timing and detailed output
-- ============================================================================

\set QUIET on
SET work_mem = '256MB';
SET random_page_cost = 1.1;
\set QUIET off

-- ============================================================================
-- BENCHMARK 1: Slot Availability Query (Target: < 100ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 1: Slot Availability Query'
\echo 'Target: < 100ms'
\echo 'Query: Find available time slots for a specific doctor on a given date'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    ts.id,
    ts.slot_date,
    ts.slot_start,
    ts.slot_end,
    ts.max_appointments,
    ts.booked_count,
    d.name AS department_name,
    u.first_name || ' ' || u.last_name AS doctor_name
FROM app.time_slots ts
JOIN app.departments d ON ts.department_id = d.id
JOIN app.users u ON ts.doctor_id = u.id
WHERE ts.doctor_id = (SELECT id FROM app.users WHERE role = 'doctor' LIMIT 1)
  AND ts.slot_date = CURRENT_DATE + INTERVAL '1 day'
  AND ts.is_available = TRUE
ORDER BY ts.slot_start;

-- ============================================================================
-- BENCHMARK 2: Patient Lookup by Email (Target: < 200ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 2: Patient Lookup by Email'
\echo 'Target: < 200ms'
\echo 'Query: Find patient profile by email with full details'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    pp.id AS profile_id,
    pp.medical_record_number,
    pp.date_of_birth,
    pp.gender,
    pp.blood_type,
    pp.address_line1,
    pp.city,
    pp.state,
    physician.first_name || ' ' || physician.last_name AS primary_physician
FROM app.users u
LEFT JOIN app.patient_profiles pp ON u.id = pp.user_id
LEFT JOIN app.users physician ON pp.primary_physician_id = physician.id
WHERE u.email = (SELECT email FROM app.users WHERE role = 'patient' LIMIT 1)
  AND u.is_active = TRUE;

-- ============================================================================
-- BENCHMARK 3: Patient Appointment History (Target: < 150ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 3: Patient Appointment History'
\echo 'Target: < 150ms'
\echo 'Query: List recent appointments for a patient with filters'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    a.id,
    a.appointment_date,
    a.status,
    a.appointment_type,
    a.reason_for_visit,
    a.duration_minutes,
    doctor.first_name || ' ' || doctor.last_name AS doctor_name,
    dept.name AS department_name
FROM app.appointments a
JOIN app.users doctor ON a.doctor_id = doctor.id
JOIN app.departments dept ON a.department_id = dept.id
WHERE a.patient_id = (SELECT id FROM app.patient_profiles LIMIT 1)
  AND a.status IN ('pending', 'confirmed', 'completed')
  AND a.appointment_date >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY a.appointment_date DESC
LIMIT 20;

-- ============================================================================
-- BENCHMARK 4: Doctor's Daily Schedule (Target: < 150ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 4: Doctor Daily Schedule'
\echo 'Target: < 150ms'
\echo 'Query: List all appointments for a doctor on a specific day'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    a.id,
    a.appointment_date,
    a.duration_minutes,
    a.status,
    a.appointment_type,
    patient.first_name || ' ' || patient.last_name AS patient_name,
    pp.medical_record_number,
    a.reason_for_visit
FROM app.appointments a
JOIN app.patient_profiles pp ON a.patient_id = pp.id
JOIN app.users patient ON pp.user_id = patient.id
WHERE a.doctor_id = (SELECT id FROM app.users WHERE role = 'doctor' LIMIT 1)
  AND DATE(a.appointment_date) = CURRENT_DATE
ORDER BY a.appointment_date;

-- ============================================================================
-- BENCHMARK 5: Active Medications for Patient (Target: < 100ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 5: Active Medications for Patient'
\echo 'Target: < 100ms'
\echo 'Query: List current medications for a patient'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    m.id,
    m.medication_name,
    m.dosage,
    m.frequency,
    m.route,
    m.start_date,
    m.end_date,
    m.instructions,
    prescriber.first_name || ' ' || prescriber.last_name AS prescribed_by
FROM app.medications m
JOIN app.users prescriber ON m.prescribed_by_user_id = prescriber.id
WHERE m.patient_id = (SELECT id FROM app.patient_profiles LIMIT 1)
  AND m.is_active = TRUE
ORDER BY m.start_date DESC;

-- ============================================================================
-- BENCHMARK 6: Waitlist Priority Queue (Target: < 100ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 6: Waitlist Priority Queue'
\echo 'Target: < 100ms'
\echo 'Query: Get prioritized waitlist for a department'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    w.id,
    w.requested_date,
    w.priority,
    w.status,
    w.reason,
    patient.first_name || ' ' || patient.last_name AS patient_name,
    pp.medical_record_number,
    pp.date_of_birth,
    EXTRACT(YEAR FROM AGE(pp.date_of_birth)) AS patient_age,
    w.created_at
FROM app.waitlist w
JOIN app.patient_profiles pp ON w.patient_id = pp.id
JOIN app.users patient ON pp.user_id = patient.id
WHERE w.department_id = (SELECT id FROM app.departments LIMIT 1)
  AND w.status = 'waiting'
ORDER BY w.priority DESC, w.created_at ASC
LIMIT 50;

-- ============================================================================
-- BENCHMARK 7: Clinical Document Search (Target: < 150ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 7: Clinical Document Search'
\echo 'Target: < 150ms'
\echo 'Query: Search patient documents by type and date range'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    cd.id,
    cd.document_type,
    cd.title,
    cd.document_date,
    cd.is_confidential,
    cd.tags,
    creator.first_name || ' ' || creator.last_name AS created_by,
    cd.created_at
FROM app.clinical_documents cd
JOIN app.users creator ON cd.created_by_user_id = creator.id
WHERE cd.patient_id = (SELECT id FROM app.patient_profiles LIMIT 1)
  AND cd.document_type IN ('prescription', 'lab_result', 'consultation_note')
  AND cd.document_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY cd.document_date DESC;

-- ============================================================================
-- BENCHMARK 8: Vector Similarity Search (Target: < 200ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 8: Vector Similarity Search'
\echo 'Target: < 200ms'
\echo 'Query: Find similar clinical documents using vector embeddings'
\echo 'Note: Requires sample embeddings to exist'
\echo '---'
\echo ''

DO $$
DECLARE
    sample_embedding vector(1536);
    embedding_count INT;
BEGIN
    -- Check if embeddings exist
    SELECT COUNT(*) INTO embedding_count 
    FROM app.clinical_documents 
    WHERE embedding IS NOT NULL;
    
    IF embedding_count > 0 THEN
        -- Get a sample embedding
        SELECT embedding INTO sample_embedding 
        FROM app.clinical_documents 
        WHERE embedding IS NOT NULL 
        LIMIT 1;
        
        RAISE NOTICE 'Running vector similarity search...';
        
        -- Run the benchmark query
        EXPLAIN (ANALYZE, BUFFERS, TIMING)
        SELECT 
            cd.id,
            cd.title,
            cd.document_type,
            cd.document_date,
            cd.embedding <-> sample_embedding AS similarity_distance
        FROM app.clinical_documents cd
        WHERE cd.embedding IS NOT NULL
        ORDER BY cd.embedding <-> sample_embedding
        LIMIT 10;
    ELSE
        RAISE NOTICE 'No embeddings found - skipping vector similarity test';
        RAISE NOTICE 'To test: Load sample documents with embeddings';
    END IF;
END $$;

-- ============================================================================
-- BENCHMARK 9: Unread Notifications (Target: < 100ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 9: Unread Notifications'
\echo 'Target: < 100ms'
\echo 'Query: Get unread notifications for a user'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.priority,
    n.created_at,
    n.expires_at,
    a.appointment_date,
    a.status AS appointment_status
FROM app.notifications n
LEFT JOIN app.appointments a ON n.related_appointment_id = a.id
WHERE n.user_id = (SELECT id FROM app.users WHERE role = 'patient' LIMIT 1)
  AND n.is_read = FALSE
  AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
ORDER BY n.priority DESC, n.created_at DESC
LIMIT 20;

-- ============================================================================
-- BENCHMARK 10: Audit Log Query (Target: < 200ms)
-- ============================================================================

\echo ''
\echo '---'
\echo 'BENCHMARK 10: Audit Log Query'
\echo 'Target: < 200ms'
\echo 'Query: Get audit trail for a specific record'
\echo '---'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 
    al.id,
    al.action,
    al.timestamp,
    u.first_name || ' ' || u.last_name AS performed_by,
    u.email,
    al.ip_address,
    al.old_values,
    al.new_values
FROM app.audit_logs al
LEFT JOIN app.users u ON al.user_id = u.id
WHERE al.table_name = 'appointments'
  AND al.record_id = (SELECT id FROM app.appointments LIMIT 1)
ORDER BY al.timestamp DESC;

-- ============================================================================
-- Summary and Performance Analysis
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'PERFORMANCE SUMMARY'
\echo '============================================================================'
\echo ''
\echo 'Review the execution times above and compare against targets:'
\echo ''
\echo '  ✓ <  100ms: Excellent'
\echo '  ✓ < 200ms: Good'
\echo '  ⚠ < 500ms: Acceptable'
\echo '  ✗ >= 500ms: Needs optimization'
\echo ''
\echo 'Look for:'
\echo '  1. "Index Scan" (good) vs "Seq Scan" (bad) in EXPLAIN output'
\echo '  2. "Buffers: shared hit=" (cache hits) vs "read=" (disk reads)'
\echo '  3. "Planning Time" should be << "Execution Time"'
\echo '  4. "Rows Removed by Filter" should be minimal'
\echo ''
\echo 'If queries exceed targets:'
\echo '  - Check index usage with: analyze_index_usage.sql'
\echo '  - Run VACUUM ANALYZE to update statistics'
\echo '  - Review query plans for sequential scans'
\echo '  - Consider additional composite indexes'
\echo '  - Increase shared_buffers if many disk reads'
\echo ''
\echo '============================================================================'

\timing off
