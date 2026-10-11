# Hostel Management System

## DSE & DBD PBL Project

A web-based **Hostel Management System** developed as part of the **Database Systems Engineering (DSE) and Database Design (DBD)** PBL project.

The system provides a centralized platform for managing students, hostel rooms, room allocations, and hostel occupancy information. It uses a **React frontend**, **Python Flask backend**, and **PostgreSQL database**.

---

## Team Members

- Akshay Chandra
- Manoj
- Pranith Reddy
- Sai Charan

---

## Project Overview

Managing hostel information manually can lead to difficulties in maintaining student records, room availability, and room allocations.

The Hostel Management System provides a digital solution to:

- Manage student information
- Manage hostel rooms
- Allocate rooms and beds to students
- Track active room allocations
- Monitor room occupancy
- Display available beds
- View hostel management information through a dashboard

The application follows a frontend-backend-database architecture.

---

## Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS
- Lucide React

### Backend

- Python
- Flask
- REST API

### Database

- PostgreSQL
- pgAdmin

### Development Tools

- Visual Studio Code
- PyCharm
- Git
- GitHub

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │      + Vite         │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Flask Backend    │
                    │      Python         │
                    └──────────┬──────────┘
                               │
                         SQL Queries
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      Database       │
                    └─────────────────────┘

---

## Features

### 1. Dashboard
- View an overview of hostel information.
- Monitor student count, room count, and room occupancy.
- View key hostel statistics.

### 2. Student Management
- View registered students.
- Add new student records.
- Store student details, including roll number, name, contact information, department, and year of study.
- Maintain student records in PostgreSQL.

### 3. Room Management
- View hostel rooms and their details.
- Track room capacity and occupancy.
- View occupied and available beds.

### 4. Room Allocation
- Allocate rooms and beds to registered students.
- View room allocation records.
- Track active allocations.
- Cancel active allocations when required.

### 5. Payment Management
- Record student payments.
- Store payment amount, date, payment method, and reference number.
- View payment records and collection summaries.

### 6. Maintenance Management
- Create maintenance requests for hostel rooms.
- Record request descriptions, categories, and priorities.
- Track maintenance status: Pending, In Progress, and Completed.

### 7. Administration
- View a consolidated summary of hostel operations.
- Monitor student, room, allocation, payment, and maintenance information.

---

## Project Structure

```text
Hostel-Management-System/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── src/
│   ├── App.jsx
│   └── ...
├── public/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

*Note: This structure is illustrative. Adjust it to match the actual folders and files in your repository. The `.env` file contains local configuration and must not be committed to GitHub.*

---

## Installation and Setup

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Python 3
- PostgreSQL
- pgAdmin (optional, for database management)
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

Replace the placeholders with your actual GitHub repository URL and project folder name.

### 2. Configure the PostgreSQL Database

1. Start PostgreSQL.
2. Open pgAdmin and connect to your PostgreSQL server.
3. Create a database for the Hostel Management System.
4. Execute the project's database schema and setup SQL scripts in that database.

**Important:** If the database already contains your project data, do not rerun a setup script that drops and recreates tables.

### 3. Configure the Backend

Open a terminal in the project root and run:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a local `.env` file inside the `backend` directory with your own PostgreSQL connection settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Use the environment variable names expected by your actual `app.py`. Never commit real database credentials to GitHub.

Start the backend:

```bash
python app.py
```

The backend runs at the host and port configured in the application. For a local development setup, this may be `http://127.0.0.1:5000`.

### 4. Configure the Frontend

Open a **second terminal** in the project root:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite in the terminal, commonly `http://localhost:5173`.

---

## API Endpoints

The Flask backend exposes REST API endpoints for the application's modules.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database connectivity |
| GET | `/api/students` | Retrieve students |
| POST | `/api/students` | Add a student |
| GET | `/api/rooms` | Retrieve rooms and occupancy |
| GET | `/api/allocations` | Retrieve allocations |
| POST | `/api/allocations` | Create an allocation |
| PATCH | `/api/allocations/<id>/cancel` | Cancel an allocation |
| GET | `/api/payments` | Retrieve payment records |
| POST | `/api/payments` | Record a payment |
| GET | `/api/maintenance` | Retrieve maintenance requests |
| POST | `/api/maintenance` | Create a maintenance request |
| PATCH | `/api/maintenance/<id>` | Update maintenance status |
| GET | `/api/admin/summary` | Retrieve administrative statistics |

*These endpoints reflect the backend implementation described for the project. Verify them against your current `backend/app.py` before publishing the README.*

---

## Database

PostgreSQL is used to persist hostel management data.

The database includes tables for:

- Students
- Rooms
- Allocations
- Payments
- Maintenance Requests

Foreign key constraints help maintain relationships between students, rooms, allocations, payments, and maintenance requests.

---

## Testing

The following checks can be performed to verify the application:

- Confirm that the backend health endpoint reports a successful database connection.
- Add a student and verify the record in PostgreSQL.
- Allocate a room and check its occupancy.
- Record a payment and verify the payment record in PostgreSQL.
- Create a maintenance request and update its status.
- Refresh the application and confirm that saved records remain available.

---

## Security Notes

- Keep database passwords and other secrets in a local `.env` file.
- Add `.env` and virtual environment folders to `.gitignore`.
- Do not publish database credentials or private configuration values.
- Use appropriate authentication and authorization before deploying the application for real-world use.

---

## Future Enhancements

Potential future improvements include:

- User authentication and role-based access control.
- Student and administrator dashboards.
- Payment receipts and downloadable reports.
- Search, filtering, and pagination.
- Email or notification support.
- Production deployment and automated testing.

---

## Team Members

- Akshay Chandra
- Manoj
- Pranith Reddy
- Sai Charan

---

## Academic Project

Developed as part of the **Database Systems Engineering (DSE) and Database Design (DBD) PBL project**.                    