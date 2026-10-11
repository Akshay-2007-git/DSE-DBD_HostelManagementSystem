import os
from contextlib import contextmanager
from datetime import date
from decimal import Decimal, InvalidOperation

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "hostel_management"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        cursor_factory=RealDictCursor,
    )


@contextmanager
def db_connection():
    conn = get_connection()

    try:
        with conn:
            yield conn
    finally:
        conn.close()


# =========================================================
# JSON RESPONSES
# =========================================================

def success(data=None, message="OK", status=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status


def failure(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status


def row_to_json(row):
    if row is None:
        return None

    result = {}

    for key, value in dict(row).items():
        if isinstance(value, Decimal):
            result[key] = float(value)
        elif hasattr(value, "isoformat"):
            result[key] = value.isoformat()
        else:
            result[key] = value

    return result


def rows_to_json(rows):
    return [row_to_json(row) for row in rows]


def database_error_message(exc):
    if isinstance(exc, psycopg2.errors.UniqueViolation):
        return "A record with a duplicate unique value already exists."

    if isinstance(exc, psycopg2.errors.ForeignKeyViolation):
        return "The selected student or room does not exist."

    if isinstance(exc, psycopg2.errors.CheckViolation):
        return "One or more values violate a database validation rule."

    app.logger.exception("Database operation failed")
    return "Database operation failed. Check the backend terminal."


# =========================================================
# HOME AND HEALTH CHECK
# =========================================================

@app.get("/")
def index():
    return jsonify({
        "application": "Hostel Management System",
        "backend": "Flask REST API",
        "database": "PostgreSQL",
        "status": "running"
    })


@app.get("/api/health")
def health():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()

        return jsonify({
            "success": True,
            "status": "healthy",
            "database": "connected"
        })

    except Exception as exc:
        app.logger.exception("Health check failed")

        return jsonify({
            "success": False,
            "status": "unhealthy",
            "message": str(exc)
        }), 500


# =========================================================
# STUDENTS
# =========================================================

@app.get("/api/students")
def get_students():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        student_id,
                        roll_no,
                        name,
                        gender,
                        phone,
                        email,
                        department,
                        year_of_study
                    FROM students
                    ORDER BY student_id
                """)

                rows = cur.fetchall()

        return success(rows_to_json(rows))

    except Exception as exc:
        app.logger.exception("Get students failed")
        return failure(str(exc), 500)


@app.post("/api/students")
def create_student():
    data = request.get_json(silent=True) or {}

    required = [
        "roll_no", "name", "gender", "phone",
        "email", "department", "year_of_study"
    ]

    if any(data.get(key) in (None, "") for key in required):
        return failure("All student fields are required.")

    try:
        year = int(data["year_of_study"])

        if year not in (1, 2, 3, 4):
            return failure("Year of study must be between 1 and 4.")

        if data["gender"] not in ("Male", "Female"):
            return failure("Gender must be Male or Female.")

        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO students (
                        roll_no,
                        name,
                        gender,
                        phone,
                        email,
                        department,
                        year_of_study
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                """, (
                    data["roll_no"].strip(),
                    data["name"].strip(),
                    data["gender"],
                    data["phone"].strip(),
                    data["email"].strip().lower(),
                    data["department"].strip(),
                    year
                ))

                saved = row_to_json(cur.fetchone())

        return success(saved, "Student created", 201)

    except (TypeError, ValueError):
        return failure("Year of study must be a valid number.")

    except psycopg2.Error as exc:
        return failure(
            database_error_message(exc),
            409 if isinstance(exc, psycopg2.errors.UniqueViolation) else 400
        )

    except Exception as exc:
        app.logger.exception("Create student failed")
        return failure(str(exc), 500)


# =========================================================
# ROOMS
# =========================================================

@app.get("/api/rooms")
def get_rooms():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        r.room_id,
                        r.room_number,
                        r.floor_number,
                        r.capacity,
                        r.room_type,
                        COUNT(a.allocation_id)
                            FILTER (WHERE a.status = 'ACTIVE')::int
                            AS occupied_beds,
                        (
                            r.capacity -
                            COUNT(a.allocation_id)
                                FILTER (WHERE a.status = 'ACTIVE')
                        )::int AS available_beds
                    FROM rooms r
                    LEFT JOIN allocations a
                        ON a.room_id = r.room_id
                    GROUP BY r.room_id
                    ORDER BY r.room_id
                """)

                rows = cur.fetchall()

        return success(rows_to_json(rows))

    except Exception as exc:
        app.logger.exception("Get rooms failed")
        return failure(str(exc), 500)


# =========================================================
# ALLOCATIONS
# =========================================================

@app.get("/api/allocations")
def get_allocations():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        allocation_id,
                        student_id,
                        room_id,
                        bed_number,
                        allocation_date,
                        status
                    FROM allocations
                    ORDER BY allocation_id DESC
                """)

                rows = cur.fetchall()

        return success(rows_to_json(rows))

    except Exception as exc:
        app.logger.exception("Get allocations failed")
        return failure(str(exc), 500)


@app.post("/api/allocations")
def create_allocation():
    data = request.get_json(silent=True) or {}

    try:
        student_id = int(data.get("student_id"))
        room_id = int(data.get("room_id"))
        bed_number = int(data.get("bed_number"))

        if bed_number < 1:
            return failure("Bed number must be at least 1.")

        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT capacity
                    FROM rooms
                    WHERE room_id = %s
                    FOR UPDATE
                """, (room_id,))

                room = cur.fetchone()

                if not room:
                    return failure("Room not found.", 404)

                if bed_number > room["capacity"]:
                    return failure("Bed number exceeds room capacity.")

                cur.execute("""
                    SELECT 1
                    FROM students
                    WHERE student_id = %s
                """, (student_id,))

                if not cur.fetchone():
                    return failure("Student not found.", 404)

                cur.execute("""
                    SELECT 1
                    FROM allocations
                    WHERE student_id = %s
                      AND status = 'ACTIVE'
                """, (student_id,))

                if cur.fetchone():
                    return failure(
                        "This student already has an active allocation.",
                        409
                    )

                cur.execute("""
                    SELECT 1
                    FROM allocations
                    WHERE room_id = %s
                      AND bed_number = %s
                      AND status = 'ACTIVE'
                """, (room_id, bed_number))

                if cur.fetchone():
                    return failure("That bed is already occupied.", 409)

                cur.execute("""
                    INSERT INTO allocations (
                        student_id,
                        room_id,
                        bed_number,
                        status
                    )
                    VALUES (%s, %s, %s, 'ACTIVE')
                    RETURNING *
                """, (student_id, room_id, bed_number))

                saved = row_to_json(cur.fetchone())

        return success(saved, "Allocation created", 201)

    except (TypeError, ValueError):
        return failure("Student, room, and bed must be valid numbers.")

    except psycopg2.Error as exc:
        return failure(
            database_error_message(exc),
            409 if isinstance(exc, psycopg2.errors.UniqueViolation) else 400
        )

    except Exception as exc:
        app.logger.exception("Create allocation failed")
        return failure(str(exc), 500)


@app.patch("/api/allocations/<int:allocation_id>/cancel")
def cancel_allocation(allocation_id):
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE allocations
                    SET status = 'CANCELLED'
                    WHERE allocation_id = %s
                      AND status = 'ACTIVE'
                    RETURNING allocation_id, status
                """, (allocation_id,))

                row = cur.fetchone()

                if not row:
                    return failure("Active allocation not found.", 404)

                saved = row_to_json(row)

        return success(saved, "Allocation cancelled")

    except Exception as exc:
        app.logger.exception("Cancel allocation failed")
        return failure(str(exc), 500)


# =========================================================
# PAYMENTS: LIST AND CREATE
# =========================================================

@app.get("/api/payments")
def get_payments():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        p.payment_id,
                        p.student_id,
                        s.roll_no,
                        s.name AS student_name,
                        p.amount,
                        p.payment_date,
                        p.payment_method,
                        p.reference_no,
                        p.status,
                        p.created_at
                    FROM payments p
                    JOIN students s
                        ON s.student_id = p.student_id
                    ORDER BY p.payment_date DESC, p.payment_id DESC
                """)

                rows = cur.fetchall()

        return success(rows_to_json(rows))

    except Exception as exc:
        app.logger.exception("Get payments failed")
        return failure(str(exc), 500)


@app.post("/api/payments")
def create_payment():
    data = request.get_json(silent=True) or {}

    try:
        student_id = int(data.get("student_id"))
        amount = Decimal(str(data.get("amount")))

        if not amount.is_finite() or amount <= 0:
            return failure("Payment amount must be greater than zero.")

        payment_date = (
            date.fromisoformat(data["payment_date"])
            if data.get("payment_date")
            else date.today()
        )

        method = str(data.get("payment_method", "")).strip()

        allowed_methods = {
            "UPI", "Cash", "Card", "Bank Transfer", "Other"
        }

        if method not in allowed_methods:
            return failure("Choose a valid payment method.")

        reference = (data.get("reference_no") or "").strip() or None

        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO payments (
                        student_id,
                        amount,
                        payment_date,
                        payment_method,
                        reference_no,
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, 'PAID')
                    RETURNING *
                """, (
                    student_id,
                    amount,
                    payment_date,
                    method,
                    reference
                ))

                saved = row_to_json(cur.fetchone())

        return success(saved, "Payment recorded", 201)

    except (TypeError, ValueError, InvalidOperation):
        return failure("Enter a valid student, amount, and payment date.")

    except psycopg2.Error as exc:
        return failure(database_error_message(exc), 400)

    except Exception as exc:
        app.logger.exception("Create payment failed")
        return failure(str(exc), 500)


# =========================================================
# MAINTENANCE: LIST AND CREATE
# =========================================================

@app.get("/api/maintenance")
def get_maintenance():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        m.maintenance_id,
                        m.room_id,
                        r.room_number,
                        m.student_id,
                        s.name AS student_name,
                        m.title,
                        m.description,
                        m.category,
                        m.priority,
                        m.status,
                        m.created_at,
                        m.updated_at
                    FROM maintenance_requests m
                    JOIN rooms r
                        ON r.room_id = m.room_id
                    LEFT JOIN students s
                        ON s.student_id = m.student_id
                    ORDER BY
                        CASE m.status
                            WHEN 'PENDING' THEN 0
                            WHEN 'IN_PROGRESS' THEN 1
                            ELSE 2
                        END,
                        m.created_at DESC
                """)

                rows = cur.fetchall()

        return success(rows_to_json(rows))

    except Exception as exc:
        app.logger.exception("Get maintenance failed")
        return failure(str(exc), 500)


@app.post("/api/maintenance")
def create_maintenance():
    data = request.get_json(silent=True) or {}

    required = [
        "room_id", "title", "description", "category", "priority"
    ]

    if any(data.get(key) in (None, "") for key in required):
        return failure("Room, title, description, category, and priority are required.")

    try:
        room_id = int(data["room_id"])

        student_id = (
            int(data["student_id"])
            if data.get("student_id") not in (None, "")
            else None
        )

        title = str(data["title"]).strip()
        description = str(data["description"]).strip()
        category = str(data["category"]).strip()
        priority = str(data["priority"]).upper()

        if not title or not description or not category:
            return failure("Title, description, and category cannot be empty.")

        if priority not in {"LOW", "MEDIUM", "HIGH", "URGENT"}:
            return failure("Choose a valid priority.")

        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_requests (
                        room_id,
                        student_id,
                        title,
                        description,
                        category,
                        priority,
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, 'PENDING')
                    RETURNING *
                """, (
                    room_id,
                    student_id,
                    title,
                    description,
                    category,
                    priority
                ))

                saved = row_to_json(cur.fetchone())

        return success(saved, "Maintenance request created", 201)

    except (TypeError, ValueError):
        return failure("Room or student selection is invalid.")

    except psycopg2.Error as exc:
        return failure(database_error_message(exc), 400)

    except Exception as exc:
        app.logger.exception("Create maintenance failed")
        return failure(str(exc), 500)


# =========================================================
# MAINTENANCE: UPDATE STATUS
# =========================================================

@app.patch("/api/maintenance/<int:maintenance_id>")
def update_maintenance(maintenance_id):
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).upper()

    allowed_statuses = {
        "PENDING", "IN_PROGRESS", "COMPLETED"
    }

    if status not in allowed_statuses:
        return failure("Choose a valid maintenance status.")

    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE maintenance_requests
                    SET
                        status = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE maintenance_id = %s
                    RETURNING maintenance_id, status, updated_at
                """, (status, maintenance_id))

                row = cur.fetchone()

                if not row:
                    return failure("Maintenance request not found.", 404)

                saved = row_to_json(row)

        return success(saved, "Maintenance status updated")

    except Exception as exc:
        app.logger.exception("Update maintenance failed")
        return failure(str(exc), 500)


# =========================================================
# ADMINISTRATION: LIVE SYSTEM SUMMARY
# =========================================================

@app.get("/api/admin/summary")
def admin_summary():
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        (
                            SELECT COUNT(*)
                            FROM students
                        )::int AS total_students,

                        (
                            SELECT COUNT(*)
                            FROM rooms
                        )::int AS total_rooms,

                        (
                            SELECT COUNT(*)
                            FROM allocations
                            WHERE status = 'ACTIVE'
                        )::int AS active_allocations,

                        (
                            SELECT COALESCE(SUM(capacity), 0)
                            FROM rooms
                        )::int AS total_beds,

                        (
                            SELECT COUNT(*)
                            FROM payments
                            WHERE status = 'PAID'
                        )::int AS paid_transactions,

                        (
                            SELECT COALESCE(SUM(amount), 0)
                            FROM payments
                            WHERE status = 'PAID'
                        ) AS total_collected,

                        (
                            SELECT COUNT(*)
                            FROM maintenance_requests
                            WHERE status <> 'COMPLETED'
                        )::int AS open_maintenance
                """)

                summary = row_to_json(cur.fetchone())

        return success(summary)

    except Exception as exc:
        app.logger.exception("Administration summary failed")
        return failure(str(exc), 500)


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))

    app.run(host=host, port=port, debug=True)