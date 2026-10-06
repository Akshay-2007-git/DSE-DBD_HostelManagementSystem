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