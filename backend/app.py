import os
from datetime import date

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import IntegrityError
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    }
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "hostel_management"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Akshay@2007")
}


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health_check():

    try:

        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("SELECT 1;")

        cursor.fetchone()

        cursor.close()

        connection.close()

        return jsonify({
            "success": True,
            "message": "Flask backend and PostgreSQL are connected"
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Database connection failed",
            "error": str(error)
        }), 500


# ============================================================
# DASHBOARD
# ============================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM students) AS total_students,

                (SELECT COUNT(*) FROM rooms) AS total_rooms,

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
        """)

        result = cursor.fetchone()

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# GET ALL STUDENTS
# ============================================================

@app.route("/api/students", methods=["GET"])
def get_students():

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
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
            ORDER BY student_id;
        """)

        students = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": students
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# ADD STUDENT
# ============================================================

@app.route("/api/students", methods=["POST"])
def add_student():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        required_fields = [
            "roll_no",
            "name",
            "gender",
            "phone",
            "email",
            "department",
            "year_of_study"
        ]

        for field in required_fields:

            if field not in data or str(data[field]).strip() == "":

                return jsonify({
                    "success": False,
                    "message": f"{field} is required"
                }), 400

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
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
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING
                student_id,
                roll_no,
                name,
                gender,
                phone,
                email,
                department,
                year_of_study;
        """, (
            data["roll_no"],
            data["name"],
            data["gender"],
            data["phone"],
            data["email"],
            data["department"],
            int(data["year_of_study"])
        ))

        student = cursor.fetchone()

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Student added successfully",
            "data": student
        }), 201

    except IntegrityError as error:

        if connection:
            connection.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be added. Roll number, phone or email may already exist.",
            "error": str(error)
        }), 409

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# GET ALL ROOMS
# ============================================================

@app.route("/api/rooms", methods=["GET"])
def get_rooms():

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                r.room_id,
                r.room_number,
                r.floor_number,
                r.capacity,
                r.room_type,

                COUNT(a.allocation_id)
                FILTER (WHERE a.status = 'ACTIVE')
                AS occupied_beds,

                r.capacity -
                COUNT(a.allocation_id)
                FILTER (WHERE a.status = 'ACTIVE')
                AS available_beds

            FROM rooms r

            LEFT JOIN allocations a
                ON r.room_id = a.room_id

            GROUP BY
                r.room_id,
                r.room_number,
                r.floor_number,
                r.capacity,
                r.room_type

            ORDER BY r.room_id;
        """)

        rooms = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": rooms
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# GET ALL ALLOCATIONS
# ============================================================

@app.route("/api/allocations", methods=["GET"])
def get_allocations():

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                a.allocation_id,
                a.student_id,
                a.room_id,
                a.bed_number,
                a.allocation_date,
                a.status,

                s.roll_no,
                s.name AS student_name,

                r.room_number,
                r.room_type

            FROM allocations a

            JOIN students s
                ON a.student_id = s.student_id

            JOIN rooms r
                ON a.room_id = r.room_id

            ORDER BY
                a.allocation_id;
        """)

        allocations = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": allocations
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# CREATE ROOM ALLOCATION
# ============================================================

@app.route("/api/allocations", methods=["POST"])
def create_allocation():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        required_fields = [
            "student_id",
            "room_id",
            "bed_number"
        ]

        for field in required_fields:

            if field not in data:

                return jsonify({
                    "success": False,
                    "message": f"{field} is required"
                }), 400

        student_id = int(data["student_id"])
        room_id = int(data["room_id"])
        bed_number = int(data["bed_number"])

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        # ----------------------------------------------------
        # LOCK THE ROOM
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                room_id,
                room_number,
                capacity
            FROM rooms
            WHERE room_id = %s
            FOR UPDATE;
        """, (room_id,))

        room = cursor.fetchone()

        if not room:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Room not found"
            }), 404

        # ----------------------------------------------------
        # VALIDATE BED NUMBER
        # ----------------------------------------------------

        if bed_number < 1 or bed_number > room["capacity"]:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": f"Invalid bed number. Room {room['room_number']} has {room['capacity']} beds."
            }), 400

        # ----------------------------------------------------
        # CHECK STUDENT EXISTS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT student_id, name
            FROM students
            WHERE student_id = %s;
        """, (student_id,))

        student = cursor.fetchone()

        if not student:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Student not found"
            }), 404

        # ----------------------------------------------------
        # CHECK STUDENT ACTIVE ALLOCATION
        # ----------------------------------------------------

        cursor.execute("""
            SELECT allocation_id
            FROM allocations
            WHERE student_id = %s
              AND status = 'ACTIVE'
            FOR UPDATE;
        """, (student_id,))

        existing_student_allocation = cursor.fetchone()

        if existing_student_allocation:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Student already has an active allocation"
            }), 409

        # ----------------------------------------------------
        # CHECK BED OCCUPANCY
        # ----------------------------------------------------

        cursor.execute("""
            SELECT allocation_id
            FROM allocations
            WHERE room_id = %s
              AND bed_number = %s
              AND status = 'ACTIVE'
            FOR UPDATE;
        """, (
            room_id,
            bed_number
        ))

        existing_bed = cursor.fetchone()

        if existing_bed:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": f"Bed {bed_number} in Room {room['room_number']} is already occupied"
            }), 409

        # ----------------------------------------------------
        # CREATE ALLOCATION
        # ----------------------------------------------------

        cursor.execute("""
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
                %s,
                %s,
                %s,
                CURRENT_DATE,
                'ACTIVE'
            )
            RETURNING
                allocation_id,
                student_id,
                room_id,
                bed_number,
                allocation_date,
                status;
        """, (
            student_id,
            room_id,
            bed_number
        ))

        allocation = cursor.fetchone()

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Bed allocated successfully",
            "data": allocation
        }), 201

    except IntegrityError as error:

        if connection:
            connection.rollback()

        return jsonify({
            "success": False,
            "message": "Allocation conflict. The student or bed may already be allocated.",
            "error": str(error)
        }), 409

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# CANCEL ALLOCATION
# ============================================================

@app.route("/api/allocations/<int:allocation_id>/cancel", methods=["PATCH"])
def cancel_allocation(allocation_id):

    connection = None
    cursor = None

    try:

        connection = get_connection()

        cursor = connection.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            UPDATE allocations

            SET status = 'CANCELLED'

            WHERE allocation_id = %s
              AND status = 'ACTIVE'

            RETURNING
                allocation_id,
                student_id,
                room_id,
                bed_number,
                allocation_date,
                status;
        """, (allocation_id,))

        allocation = cursor.fetchone()

        if not allocation:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": "Active allocation not found"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Allocation cancelled successfully",
            "data": allocation
        })

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# ROOT API
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "application": "Hostel Management System",
        "backend": "Flask REST API",
        "database": "PostgreSQL",
        "status": "running"
    })


# ============================================================
# ERROR HANDLER
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "message": "API endpoint not found"
    }), 404


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))

    print()
    print("=" * 60)
    print("HOSTEL MANAGEMENT SYSTEM")
    print("Flask Backend")
    print("=" * 60)
    print(f"Server: http://{host}:{port}")
    print("Database: PostgreSQL")
    print("Database name:", DB_CONFIG["database"])
    print("=" * 60)
    print()

    app.run(
        host=host,
        port=port,
        debug=True
    )