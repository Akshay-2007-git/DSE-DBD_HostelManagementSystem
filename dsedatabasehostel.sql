-- ============================================================
-- HOSTEL MANAGEMENT SYSTEM
-- FINAL DATABASE SETUP
-- ============================================================

-- ============================================================
-- DROP OLD TABLES
-- ============================================================

DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS students CASCADE;


-- ============================================================
-- STUDENT TABLE
-- ============================================================

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,

    roll_no VARCHAR(20) UNIQUE NOT NULL,

    name VARCHAR(100) NOT NULL,

    gender VARCHAR(10) NOT NULL
        CHECK (gender IN ('Male', 'Female')),

    phone VARCHAR(15) UNIQUE NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    department VARCHAR(100) NOT NULL,

    year_of_study INT NOT NULL
        CHECK (year_of_study BETWEEN 1 AND 4)
);


-- ============================================================
-- ROOM TABLE
-- ============================================================

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,

    room_number VARCHAR(10) UNIQUE NOT NULL,

    floor_number INT NOT NULL
        CHECK (floor_number >= 0),

    capacity INT NOT NULL
        CHECK (capacity > 0),

    room_type VARCHAR(30) NOT NULL
);


-- ============================================================
-- ALLOCATION TABLE
-- ============================================================

CREATE TABLE allocations (
    allocation_id SERIAL PRIMARY KEY,

    student_id INT NOT NULL,

    room_id INT NOT NULL,

    bed_number INT NOT NULL,

    allocation_date DATE NOT NULL
        DEFAULT CURRENT_DATE,

    status VARCHAR(20) NOT NULL
        DEFAULT 'ACTIVE',

    CONSTRAINT fk_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT fk_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id),

    CONSTRAINT valid_bed_number
        CHECK (bed_number > 0),

    CONSTRAINT valid_status
        CHECK (status IN ('ACTIVE', 'CANCELLED'))
);


-- ============================================================
-- PREVENT DUPLICATE ACTIVE ROOM/BED ALLOCATION
-- ============================================================

CREATE UNIQUE INDEX unique_active_room_bed
ON allocations(room_id, bed_number)
WHERE status = 'ACTIVE';


-- ============================================================
-- PREVENT A STUDENT FROM HAVING
-- MORE THAN ONE ACTIVE ALLOCATION
-- ============================================================

CREATE UNIQUE INDEX unique_active_student
ON allocations(student_id)
WHERE status = 'ACTIVE';


-- ============================================================
-- INSERT STUDENTS
-- ============================================================

INSERT INTO students
(
    roll_no,
    name,
    gender,
    phone,
    email,
    department,
    year_of_study
)
VALUES
(
    '25AI001',
    'Rahul Kumar',
    'Male',
    '9876543210',
    'rahul@gmail.com',
    'AI & DS',
    2
),

(
    '25AI002',
    'Priya Sharma',
    'Female',
    '9876543211',
    'priya@gmail.com',
    'AI & DS',
    2
),

(
    '25AI003',
    'Arjun Reddy',
    'Male',
    '9876543212',
    'arjun@gmail.com',
    'CSE',
    2
),

(
    '25AI004',
    'Sneha Rao',
    'Female',
    '9876543213',
    'sneha@gmail.com',
    'CSE',
    1
),

(
    '25AI005',
    'Kiran Kumar',
    'Male',
    '9876543214',
    'kiran@gmail.com',
    'ECE',
    3
);


-- ============================================================
-- INSERT ROOMS
-- ============================================================

INSERT INTO rooms
(
    room_number,
    floor_number,
    capacity,
    room_type
)
VALUES
(
    '101',
    1,
    2,
    'Double'
),

(
    '102',
    1,
    2,
    'Double'
),

(
    '103',
    1,
    3,
    'Triple'
),

(
    '201',
    2,
    2,
    'Double'
),

(
    '202',
    2,
    3,
    'Triple'
),

(
    '301',
    3,
    2,
    'Double'
);


-- ============================================================
-- INSERT INITIAL ALLOCATIONS
-- ============================================================

INSERT INTO allocations
(
    student_id,
    room_id,
    bed_number,
    allocation_date,
    status
)
VALUES
(
    1,
    1,
    1,
    '2026-09-01',
    'ACTIVE'
),

(
    2,
    1,
    2,
    '2026-09-01',
    'ACTIVE'
),

(
    3,
    2,
    1,
    '2026-09-02',
    'ACTIVE'
),

(
    4,
    2,
    2,
    '2026-09-02',
    'ACTIVE'
),

(
    5,
    3,
    1,
    '2026-09-03',
    'ACTIVE'
);


-- ============================================================
-- VIEW STUDENTS
-- ============================================================

SELECT *
FROM students
ORDER BY student_id;


-- ============================================================
-- VIEW ROOMS
-- ============================================================

SELECT *
FROM rooms
ORDER BY room_id;


-- ============================================================
-- VIEW ALLOCATIONS
-- ============================================================

SELECT *
FROM allocations
ORDER BY allocation_id;


-- ============================================================
-- ALLOCATION REPORT
-- ============================================================

SELECT
    a.allocation_id,
    s.roll_no,
    s.name AS student_name,
    r.room_number,
    a.bed_number,
    a.allocation_date,
    a.status

FROM allocations a

JOIN students s
    ON a.student_id = s.student_id

JOIN rooms r
    ON a.room_id = r.room_id

ORDER BY
    r.room_number,
    a.bed_number;


-- ============================================================
-- ROOM AVAILABILITY
-- ============================================================

SELECT
    r.room_number,

    r.floor_number,

    r.room_type,

    r.capacity,

    COUNT(a.allocation_id) AS occupied_beds,

    r.capacity -
    COUNT(a.allocation_id) AS available_beds

FROM rooms r

LEFT JOIN allocations a
    ON r.room_id = a.room_id
    AND a.status = 'ACTIVE'

GROUP BY
    r.room_id,
    r.room_number,
    r.floor_number,
    r.room_type,
    r.capacity

ORDER BY
    r.room_number;


-- ============================================================
-- DASHBOARD SUMMARY
-- ============================================================

SELECT
    (
        SELECT COUNT(*)
        FROM students
    ) AS total_students,

    (
        SELECT COUNT(*)
        FROM rooms
    ) AS total_rooms,

    (
        SELECT COUNT(*)
        FROM allocations
        WHERE status = 'ACTIVE'
    ) AS active_allocations,

    (
        SELECT COALESCE(SUM(capacity), 0)
        FROM rooms
    )
    -
    (
        SELECT COUNT(*)
        FROM allocations
        WHERE status = 'ACTIVE'
    ) AS available_beds;
-- =========================================================
-- HOSTEL MANAGEMENT SYSTEM: NEW FEATURE TABLES
-- Run on the existing hostel_management database
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,

    student_id INT NOT NULL
        REFERENCES students(student_id) ON DELETE RESTRICT,

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),

    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN (
            'UPI',
            'Cash',
            'Card',
            'Bank Transfer',
            'Other'
        )),

    reference_no VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'PAID'
        CHECK (status IN ('PAID', 'PENDING', 'FAILED')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id
ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date
ON payments(payment_date DESC);


-- =========================================================
-- MAINTENANCE REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS maintenance_requests (
    maintenance_id SERIAL PRIMARY KEY,

    room_id INT NOT NULL
        REFERENCES rooms(room_id) ON DELETE RESTRICT,

    student_id INT
        REFERENCES students(student_id) ON DELETE SET NULL,

    title VARCHAR(120) NOT NULL,

    description TEXT NOT NULL,

    category VARCHAR(40) NOT NULL,

    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_status
ON maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_room_id
ON maintenance_requests(room_id);


-- =========================================================
-- VERIFY TABLES
-- =========================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payments', 'maintenance_requests')
ORDER BY table_name;

