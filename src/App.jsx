import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  ClipboardList,
  CreditCard,
  Wrench,
  ShieldCheck,
  Search,
  Bell,
  Plus,
  Pencil,
  BedDouble,
  UserCheck,
  CheckCircle2,
  LogOut,
  Menu,
  X
} from "lucide-react";


const API_URL = "http://127.0.0.1:5000/api";


function App() {

  const [page, setPage] = useState("Dashboard");

  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [dashboard, setDashboard] = useState({
    total_students: 0,
    total_rooms: 0,
    active_allocations: 0,
    available_beds: 0
  });

  const [query, setQuery] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [studentModal, setStudentModal] = useState(false);

  const [allocationModal, setAllocationModal] = useState(false);

  const [toast, setToast] = useState("");

  const [loading, setLoading] = useState(true);


  // ==========================================================
  // LOAD DATA FROM FLASK
  // ==========================================================

  const loadData = async () => {

    try {

      setLoading(true);

      const [
        studentsResponse,
        roomsResponse,
        allocationsResponse,
        dashboardResponse
      ] = await Promise.all([

        fetch(`${API_URL}/students`),

        fetch(`${API_URL}/rooms`),

        fetch(`${API_URL}/allocations`),

        fetch(`${API_URL}/dashboard`)

      ]);


      const studentsResult = await studentsResponse.json();

      const roomsResult = await roomsResponse.json();

      const allocationsResult = await allocationsResponse.json();

      const dashboardResult = await dashboardResponse.json();


      if (!studentsResult.success) {
        throw new Error(studentsResult.message);
      }

      if (!roomsResult.success) {
        throw new Error(roomsResult.message);
      }

      if (!allocationsResult.success) {
        throw new Error(allocationsResult.message);
      }

      if (!dashboardResult.success) {
        throw new Error(dashboardResult.message);
      }


      // --------------------------------------------------------
      // CONVERT DATABASE DATA TO FRONTEND FORMAT
      // --------------------------------------------------------

      setStudents(
        studentsResult.data.map(student => ({
          id: student.student_id,
          roll: student.roll_no,
          name: student.name,
          gender: student.gender,
          phone: student.phone,
          email: student.email,
          dept: student.department,
          year: student.year_of_study
        }))
      );


      setRooms(
        roomsResult.data.map(room => ({
          id: room.room_id,
          number: room.room_number,
          floor: room.floor_number,
          capacity: room.capacity,
          type: room.room_type,
          occupiedBeds: Number(room.occupied_beds || 0),
          availableBeds: Number(room.available_beds || 0)
        }))
      );


      setAllocations(
        allocationsResult.data.map(allocation => ({
          id: allocation.allocation_id,
          studentId: allocation.student_id,
          roomId: allocation.room_id,
          bed: allocation.bed_number,
          date: allocation.allocation_date,
          status: allocation.status
        }))
      );


      setDashboard({
        total_students: Number(dashboardResult.data.total_students),
        total_rooms: Number(dashboardResult.data.total_rooms),
        active_allocations: Number(dashboardResult.data.active_allocations),
        available_beds: Number(dashboardResult.data.available_beds)
      });

    }

    catch (error) {

      console.error("Loading error:", error);

      notify(
        `Backend connection error: ${error.message}`
      );

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadData();

  }, []);


  // ==========================================================
  // TOAST
  // ==========================================================

  const notify = (message) => {

    setToast(message);

    setTimeout(() => {

      setToast("");

    }, 3000);

  };


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const nav = (name) => {

    setPage(name);

    setQuery("");

    setSidebarOpen(false);

  };


  // ==========================================================
  // ADD STUDENT
  // ==========================================================

  const addStudent = async (student) => {

    try {

      const response = await fetch(
        `${API_URL}/students`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            roll_no: student.roll,

            name: student.name,

            gender: student.gender,

            phone: student.phone,

            email: student.email,

            department: student.dept,

            year_of_study: Number(student.year)

          })

        }
      );


      const result = await response.json();


      if (!response.ok || !result.success) {

        throw new Error(
          result.message || "Unable to add student"
        );

      }


      setStudentModal(false);

      notify("Student added successfully");

      await loadData();

    }

    catch (error) {

      notify(error.message);

    }

  };


  // ==========================================================
  // ADD ALLOCATION
  // ==========================================================

  const addAllocation = async (data) => {

    try {

      const response = await fetch(
        `${API_URL}/allocations`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            student_id: Number(data.studentId),

            room_id: Number(data.roomId),

            bed_number: Number(data.bed)

          })

        }
      );


      const result = await response.json();


      if (!response.ok || !result.success) {

        throw new Error(
          result.message || "Unable to allocate bed"
        );

      }


      setAllocationModal(false);

      notify("Bed allocated successfully");

      await loadData();

    }

    catch (error) {

      notify(error.message);

    }

  };


  // ==========================================================
  // CANCEL ALLOCATION
  // ==========================================================

  const removeAllocation = async (id) => {

    try {

      const response = await fetch(
        `${API_URL}/allocations/${id}/cancel`,
        {
          method: "PATCH"
        }
      );


      const result = await response.json();


      if (!response.ok || !result.success) {

        throw new Error(
          result.message || "Unable to cancel allocation"
        );

      }


      notify("Allocation cancelled");

      await loadData();

    }

    catch (error) {

      notify(error.message);

    }

  };


  // ==========================================================
  // ACTIVE ALLOCATIONS
  // ==========================================================

  const activeAllocations =
    allocations.filter(
      allocation =>
        allocation.status === "ACTIVE"
    );


  // ==========================================================
  // PAGE CONTENT
  // ==========================================================

  const pageContent = {

    Dashboard:
      <Dashboard
        students={students}
        rooms={rooms}
        allocations={activeAllocations}
        availableBeds={dashboard.available_beds}
        nav={nav}
        loading={loading}
      />,


    Students:
      <Students
        students={students}
        query={query}
        setQuery={setQuery}
        onAdd={() => setStudentModal(true)}
      />,


    Rooms:
      <Rooms
        rooms={rooms}
        allocations={activeAllocations}
      />,


    Allocations:
      <Allocations
        students={students}
        rooms={rooms}
        allocations={allocations}
        query={query}
        setQuery={setQuery}
        onAdd={() => setAllocationModal(true)}
        onCancel={removeAllocation}
      />,


    Payments:
      <ComingSoon
        title="Payments Management"
        icon={<CreditCard size={34} />}
      />,


    Maintenance:
      <ComingSoon
        title="Maintenance Management"
        icon={<Wrench size={34} />}
      />,


    Administration:
      <ComingSoon
        title="Administration"
        icon={<ShieldCheck size={34} />}
      />

  }[page];


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="app">

      <aside
        className={
          `sidebar ${sidebarOpen ? "open" : ""}`
        }
      >

        <div className="brand">

          <div className="brand-icon">

            <BedDouble size={23} />

          </div>


          <div>

            <strong>
              Hostel<span>Hub</span>
            </strong>

            <small>
              Management System
            </small>

          </div>


          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >

            <X />

          </button>

        </div>


        <div className="menu-label">
          MAIN MENU
        </div>


        <nav>

          {[
            ["Dashboard", LayoutDashboard],
            ["Students", Users],
            ["Rooms", DoorOpen],
            ["Allocations", ClipboardList],
            ["Payments", CreditCard],
            ["Maintenance", Wrench],
            ["Administration", ShieldCheck]
          ].map(
            ([name, Icon]) => (

              <button
                key={name}
                className={
                  `nav-item ${
                    page === name
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  nav(name)
                }
              >

                <Icon size={19} />

                <span>
                  {name}
                </span>

              </button>

            )
          )}

        </nav>


        <div className="sidebar-bottom">

          <div className="admin-mini">

            <div className="avatar">
              A
            </div>

            <div>

              <b>
                Administrator
              </b>

              <small>
                System Admin
              </small>

            </div>

          </div>

        </div>

      </aside>


      {
        sidebarOpen &&
        <div
          className="overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      }


      <main className="main">

        <header className="topbar">

          <div className="top-left">

            <button
              className="hamburger"
              onClick={() =>
                setSidebarOpen(true)
              }
            >

              <Menu />

            </button>


            <div>

              <div className="breadcrumb">
                Hostel Management /
              </div>

              <h1>
                {page}
              </h1>

            </div>

          </div>


          <div className="top-actions">

            <div className="search-top">

              <Search size={17} />

              <input
                placeholder="Search..."
                value={query}
                onChange={
                  e =>
                    setQuery(
                      e.target.value
                    )
                }
              />

            </div>


            <button className="icon-btn">

              <Bell size={19} />

              <i />

            </button>


            <div className="top-avatar">
              A
            </div>

          </div>

        </header>


        <section className="content">

          {pageContent}

        </section>

      </main>


      {
        studentModal &&
        <StudentModal
          onClose={() =>
            setStudentModal(false)
          }
          onSave={addStudent}
        />
      }


      {
        allocationModal &&
        <AllocationModal
          students={students}
          rooms={rooms}
          allocations={activeAllocations}
          onClose={() =>
            setAllocationModal(false)
          }
          onSave={addAllocation}
        />
      }


      {
        toast &&
        <div className="toast">

          <CheckCircle2 size={18} />

          {toast}

        </div>
      }

    </div>

  );

}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard({
  students,
  rooms,
  allocations,
  availableBeds,
  nav,
  loading
}) {

  const recent =
    allocations
      .slice(-5)
      .reverse();


  return (

    <div>

      <div className="welcome">

        <div>

          <h2>
            Good morning, Administrator 👋
          </h2>

          <p>
            Here's what's happening in your hostel today.
          </p>

        </div>


        <button
          className="primary"
          onClick={() =>
            nav("Allocations")
          }
        >

          <Plus size={18} />

          New Allocation

        </button>

      </div>


      {
        loading ?

        <div className="panel loading-panel">
          Loading hostel data...
        </div>

        :

        <>

          <div className="stats">

            <Stat
              icon={<Users />}
              label="Total Students"
              value={students.length}
              note="Registered students"
            />


            <Stat
              icon={<DoorOpen />}
              label="Total Rooms"
              value={rooms.length}
              note={
                `${rooms.filter(
                  r => r.type === "Double"
                ).length} double · ${
                  rooms.filter(
                    r => r.type === "Triple"
                  ).length
                } triple`
              }
            />


            <Stat
              icon={<UserCheck />}
              label="Active Allocations"
              value={allocations.length}
              note="Currently occupied"
            />


            <Stat
              icon={<BedDouble />}
              label="Available Beds"
              value={availableBeds}
              note="Ready for allocation"
            />

          </div>


          <div className="grid-2">

            <div className="panel">

              <div className="panel-head">

                <div>

                  <h3>
                    Recent Allocations
                  </h3>

                  <p>
                    Latest room assignments
                  </p>

                </div>


                <button
                  className="text-btn"
                  onClick={() =>
                    nav("Allocations")
                  }
                >

                  View all →

                </button>

              </div>


              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Student
                      </th>

                      <th>
                        Room
                      </th>

                      <th>
                        Bed
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      recent.map(
                        allocation => (

                          <AllocationRow
                            key={allocation.id}
                            a={allocation}
                            students={students}
                            rooms={rooms}
                          />

                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </div>


            <div className="panel">

              <div className="panel-head">

                <div>

                  <h3>
                    Room Occupancy
                  </h3>

                  <p>
                    Current bed utilization
                  </p>

                </div>


                <button
                  className="text-btn"
                  onClick={() =>
                    nav("Rooms")
                  }
                >

                  View rooms →

                </button>

              </div>


              <div className="occupancy-list">

                {
                  rooms.slice(0, 5).map(
                    room => {

                      const used =
                        allocations.filter(
                          a =>
                            a.roomId ===
                            room.id
                        ).length;


                      const percentage =
                        room.capacity > 0
                          ? Math.round(
                              used /
                              room.capacity *
                              100
                            )
                          : 0;


                      return (

                        <div
                          className="occ"
                          key={room.id}
                        >

                          <div className="occ-top">

                            <span>
                              Room {room.number}
                            </span>

                            <b>
                              {used}/{room.capacity}
                            </b>

                          </div>


                          <div className="progress">

                            <span
                              style={{
                                width:
                                  `${percentage}%`
                              }}
                            />

                          </div>


                          <small>
                            {room.type} room · Floor {room.floor}
                          </small>

                        </div>

                      );

                    }
                  )
                }

              </div>

            </div>

          </div>


          <div className="quick-grid">

            <button
              onClick={() =>
                nav("Students")
              }
            >

              <Users />

              <span>

                <b>
                  Student Management
                </b>

                <small>
                  Register & manage students
                </small>

              </span>

              →

            </button>


            <button
              onClick={() =>
                nav("Rooms")
              }
            >

              <DoorOpen />

              <span>

                <b>
                  Room Management
                </b>

                <small>
                  View rooms & availability
                </small>

              </span>

              →

            </button>


            <button
              onClick={() =>
                nav("Allocations")
              }
            >

              <ClipboardList />

              <span>

                <b>
                  Allocation Management
                </b>

                <small>
                  Assign beds to students
                </small>

              </span>

              →

            </button>

          </div>

        </>

      }

    </div>

  );

}


// ============================================================
// STAT CARD
// ============================================================

function Stat({
  icon,
  label,
  value,
  note
}) {

  return (

    <div className="stat">

      <div className="stat-icon">
        {icon}
      </div>


      <div>

        <small>
          {label}
        </small>

        <strong>
          {value}
        </strong>

        <span>
          {note}
        </span>

      </div>

    </div>

  );

}


// ============================================================
// STUDENTS
// ============================================================

function Students({
  students,
  query,
  setQuery,
  onAdd
}) {

  const filtered =
    students.filter(
      student =>
        Object.values(student)
          .join(" ")
          .toLowerCase()
          .includes(
            query.toLowerCase()
          )
    );


  return (

    <div>

      <PageHead
        title="Student Management"
        subtitle="Register, view and manage hostel students."
        button="Add Student"
        onClick={onAdd}
      />


      <div className="filterbar">

        <div className="table-search">

          <Search size={17} />

          <input
            placeholder="Search by name, roll number, department..."
            value={query}
            onChange={
              e =>
                setQuery(
                  e.target.value
                )
            }
          />

        </div>


        <span>
          {filtered.length} students
        </span>

      </div>


      <div className="panel">

        <div className="table-wrap">

          <table>

            <thead>

              <tr>

                <th>Roll No.</th>
                <th>Student</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Department</th>
                <th>Year</th>
                <th>Action</th>

              </tr>

            </thead>


            <tbody>

              {
                filtered.map(
                  student => (

                    <tr
                      key={student.id}
                    >

                      <td>
                        <b>
                          {student.roll}
                        </b>
                      </td>


                      <td>

                        <div className="person">

                          <div className="person-avatar">
                            {student.name[0]}
                          </div>

                          <span>
                            {student.name}
                          </span>

                        </div>

                      </td>


                      <td>
                        {student.gender}
                      </td>


                      <td>
                        {student.phone}
                      </td>


                      <td>
                        {student.email}
                      </td>


                      <td>

                        <span className="tag">
                          {student.dept}
                        </span>

                      </td>


                      <td>
                        Year {student.year}
                      </td>


                      <td>

                        <button className="row-btn">

                          <Pencil size={15} />

                        </button>

                      </td>

                    </tr>

                  )
                )
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}


// ============================================================
// ROOMS
// ============================================================

function Rooms({
  rooms,
  allocations
}) {

  const active =
    allocations.filter(
      a => a.status === "ACTIVE"
    );


  const totalBeds =
    rooms.reduce(
      (sum, room) =>
        sum + room.capacity,
      0
    );


  const availableBeds =
    totalBeds -
    active.length;


  return (

    <div>

      <PageHead
        title="Room Management"
        subtitle="Monitor room capacity and bed availability."
      />


      <div className="room-summary">

        <div>

          <BedDouble />

          <b>
            {active.length}
          </b>

          <span>
            Occupied beds
          </span>

        </div>


        <div>

          <CheckCircle2 />

          <b>
            {availableBeds}
          </b>

          <span>
            Available beds
          </span>

        </div>


        <div>

          <DoorOpen />

          <b>
            {rooms.length}
          </b>

          <span>
            Total rooms
          </span>

        </div>

      </div>


      <div className="rooms-grid">

        {
          rooms.map(
            room => {

              const used =
                active.filter(
                  allocation =>
                    allocation.roomId ===
                    room.id
                ).length;


              const free =
                room.capacity -
                used;


              const full =
                free === 0;


              return (

                <div
                  className="room-card"
                  key={room.id}
                >

                  <div className="room-top">

                    <div className="room-number">
                      Room {room.number}
                    </div>


                    <span
                      className={
                        `status ${
                          full
                            ? "danger"
                            : "success"
                        }`
                      }
                    >

                      {
                        full
                          ? "Full"
                          : "Available"
                      }

                    </span>

                  </div>


                  <p>
                    Floor {room.floor} · {room.type} room
                  </p>


                  <div className="beds">

                    {
                      Array.from(
                        {
                          length:
                            room.capacity
                        }
                      ).map(
                        (_, index) => {

                          const occupied =
                            active.some(
                              allocation =>
                                allocation.roomId ===
                                  room.id &&
                                allocation.bed ===
                                  index + 1
                            );


                          return (

                            <div
                              key={index}
                              className={
                                `bed ${
                                  occupied
                                    ? "occupied"
                                    : ""
                                }`
                              }
                            >

                              <BedDouble
                                size={17}
                              />

                              <small>
                                Bed {index + 1}
                              </small>

                            </div>

                          );

                        }
                      )
                    }

                  </div>


                  <div className="room-bottom">

                    <span>
                      {used} occupied
                    </span>

                    <b>
                      {free} available
                    </b>

                  </div>

                </div>

              );

            }
          )
        }

      </div>

    </div>

  );

}


// ============================================================
// ALLOCATIONS
// ============================================================

function Allocations({
  students,
  rooms,
  allocations,
  query,
  setQuery,
  onAdd,
  onCancel
}) {

  const filtered =
    allocations.filter(
      allocation => {

        const student =
          students.find(
            s =>
              s.id ===
              allocation.studentId
          );


        const room =
          rooms.find(
            r =>
              r.id ===
              allocation.roomId
          );


        return `${allocation.id}
          ${student?.name || ""}
          ${room?.number || ""}
          ${allocation.status}`
          .toLowerCase()
          .includes(
            query.toLowerCase()
          );

      }
    );


  return (

    <div>

      <PageHead
        title="Room & Bed Allocation"
        subtitle="Assign and track hostel beds for students."
        button="New Allocation"
        onClick={onAdd}
      />


      <div className="filterbar">

        <div className="table-search">

          <Search size={17} />

          <input
            placeholder="Search allocations..."
            value={query}
            onChange={
              e =>
                setQuery(
                  e.target.value
                )
            }
          />

        </div>


        <span>
          {filtered.length} records
        </span>

      </div>


      <div className="panel">

        <div className="table-wrap">

          <table>

            <thead>

              <tr>

                <th>ID</th>
                <th>Student</th>
                <th>Room</th>
                <th>Bed</th>
                <th>Allocation Date</th>
                <th>Status</th>
                <th>Action</th>

              </tr>

            </thead>


            <tbody>

              {
                filtered.map(
                  allocation => {

                    const student =
                      students.find(
                        s =>
                          s.id ===
                          allocation.studentId
                      );


                    const room =
                      rooms.find(
                        r =>
                          r.id ===
                          allocation.roomId
                      );


                    return (

                      <tr
                        key={
                          allocation.id
                        }
                      >

                        <td>
                          #
                          {
                            String(
                              allocation.id
                            ).padStart(
                              3,
                              "0"
                            )
                          }
                        </td>


                        <td>

                          <div className="person">

                            <div className="person-avatar">
                              {student?.name?.[0]}
                            </div>

                            <span>
                              {student?.name}
                            </span>

                          </div>

                        </td>


                        <td>
                          <b>
                            Room {room?.number}
                          </b>
                        </td>


                        <td>

                          <span className="bed-pill">
                            Bed {allocation.bed}
                          </span>

                        </td>


                        <td>
                          {allocation.date}
                        </td>


                        <td>

                          <span
                            className={
                              `status ${
                                allocation.status ===
                                "ACTIVE"
                                  ? "success"
                                  : "muted"
                              }`
                            }
                          >

                            {allocation.status}

                          </span>

                        </td>


                        <td>

                          {
                            allocation.status ===
                            "ACTIVE" &&

                            <button
                              className="row-btn danger-btn"
                              title="Cancel"
                              onClick={() =>
                                onCancel(
                                  allocation.id
                                )
                              }
                            >

                              <LogOut
                                size={15}
                              />

                            </button>
                          }

                        </td>

                      </tr>

                    );

                  }
                )
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}


// ============================================================
// ALLOCATION ROW
// ============================================================

function AllocationRow({
  a,
  students,
  rooms
}) {

  const student =
    students.find(
      s =>
        s.id === a.studentId
    );


  const room =
    rooms.find(
      r =>
        r.id === a.roomId
    );


  return (

    <tr>

      <td>

        <div className="person">

          <div className="person-avatar">
            {student?.name?.[0]}
          </div>

          <span>
            {student?.name}
          </span>

        </div>

      </td>


      <td>
        Room {room?.number}
      </td>


      <td>
        Bed {a.bed}
      </td>


      <td>

        <span className="status success">
          ACTIVE
        </span>

      </td>

    </tr>

  );

}


// ============================================================
// PAGE HEADER
// ============================================================

function PageHead({
  title,
  subtitle,
  button,
  onClick
}) {

  return (

    <div className="page-head">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>


      {
        button &&

        <button
          className="primary"
          onClick={onClick}
        >

          <Plus size={18} />

          {button}

        </button>
      }

    </div>

  );

}


// ============================================================
// COMING SOON
// ============================================================

function ComingSoon({
  title,
  icon
}) {

  return (

    <div className="coming">

      <div className="coming-icon">
        {icon}
      </div>


      <h2>
        {title}
      </h2>


      <p>
        This module is planned in the next implementation phase.
      </p>


      <span>
        Review 4 · Module placeholder
      </span>

    </div>

  );

}


// ============================================================
// STUDENT MODAL
// ============================================================

function StudentModal({
  onClose,
  onSave
}) {

  const [
    form,
    setForm
  ] = useState({

    roll: "",
    name: "",
    gender: "Male",
    phone: "",
    email: "",
    dept: "AI & DS",
    year: 2

  });


  const change = event => {

    setForm({

      ...form,

      [event.target.name]:
        event.target.value

    });

  };


  return (

    <Modal
      title="Register Student"
      onClose={onClose}
    >

      <form
        onSubmit={event => {

          event.preventDefault();

          onSave(form);

        }}
      >

        <div className="form-grid">

          <Field
            label="Roll Number"
            name="roll"
            value={form.roll}
            onChange={change}
            required
          />


          <Field
            label="Full Name"
            name="name"
            value={form.name}
            onChange={change}
            required
          />


          <Field
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={change}
            select
            options={[
              "Male",
              "Female"
            ]}
          />


          <Field
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={change}
            required
          />


          <Field
            label="Email"
            name="email"
            value={form.email}
            onChange={change}
            type="email"
            required
          />


          <Field
            label="Department"
            name="dept"
            value={form.dept}
            onChange={change}
            select
            options={[
              "AI & DS",
              "CSE",
              "ECE",
              "EEE",
              "Mechanical"
            ]}
          />


          <Field
            label="Year of Study"
            name="year"
            value={form.year}
            onChange={change}
            select
            options={[
              1,
              2,
              3,
              4
            ]}
          />

        </div>


        <ModalActions
          onClose={onClose}
          save="Save Student"
        />

      </form>

    </Modal>

  );

}


// ============================================================
// ALLOCATION MODAL
// ============================================================

function AllocationModal({
  students,
  rooms,
  allocations,
  onClose,
  onSave
}) {

  const [
    form,
    setForm
  ] = useState({

    studentId:
      students[0]?.id || "",

    roomId:
      rooms[0]?.id || "",

    bed: 1

  });


  const room =
    rooms.find(
      r =>
        r.id ===
        Number(form.roomId)
    );


  const occupied =
    allocations
      .filter(
        allocation =>
          allocation.roomId ===
          Number(form.roomId)
      )
      .map(
        allocation =>
          allocation.bed
      );


  return (

    <Modal
      title="New Room Allocation"
      onClose={onClose}
    >

      <form
        onSubmit={event => {

          event.preventDefault();

          onSave(form);

        }}
      >

        <div className="form-grid">

          <Field
            label="Student"
            name="studentId"
            value={form.studentId}
            onChange={
              event =>
                setForm({
                  ...form,
                  studentId:
                    event.target.value
                })
            }
            select
            options={
              students.map(
                student => ({
                  value:
                    student.id,
                  label:
                    `${student.roll} — ${student.name}`
                })
              )
            }
          />


          <Field
            label="Room"
            name="roomId"
            value={form.roomId}
            onChange={
              event =>
                setForm({

                  ...form,

                  roomId:
                    event.target.value,

                  bed: 1

                })
            }
            select
            options={
              rooms.map(
                room => ({
                  value:
                    room.id,
                  label:
                    `Room ${room.number} — ${room.type}`
                })
              )
            }
          />


          <Field
            label="Bed Number"
            name="bed"
            value={form.bed}
            onChange={
              event =>
                setForm({
                  ...form,
                  bed:
                    event.target.value
                })
            }
            select
            options={
              Array.from(
                {
                  length:
                    room?.capacity || 1
                },
                (_, index) => ({
                  value:
                    index + 1,

                  label:
                    `Bed ${index + 1}${
                      occupied.includes(
                        index + 1
                      )
                        ? " — Occupied"
                        : ""
                    }`,

                  disabled:
                    occupied.includes(
                      index + 1
                    )

                })
              )
            }
          />

        </div>


        <div className="availability-note">

          <CheckCircle2 size={17} />

          {
            room
              ? `${room.capacity - occupied.length} bed(s) available in Room ${room.number}`
              : ""
          }

        </div>


        <ModalActions
          onClose={onClose}
          save="Allocate Bed"
        />

      </form>

    </Modal>

  );

}


// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  select,
  options = [],
  required
}) {

  return (

    <label className="field">

      <span>
        {label}
      </span>


      {
        select ?

        <select
          name={name}
          value={value}
          onChange={onChange}
        >

          {
            options.map(
              option =>

                typeof option ===
                "object" ?

                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >

                  {option.label}

                </option>

                :

                <option
                  key={option}
                  value={option}
                >

                  {option}

                </option>
            )
          }

        </select>

        :

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        />
      }

    </label>

  );

}


// ============================================================
// MODAL
// ============================================================

function Modal({
  title,
  onClose,
  children
}) {

  return (

    <div className="modal-backdrop">

      <div className="modal">

        <div className="modal-head">

          <h3>
            {title}
          </h3>


          <button
            onClick={onClose}
          >

            <X />

          </button>

        </div>


        {children}

      </div>

    </div>

  );

}


// ============================================================
// MODAL ACTIONS
// ============================================================

function ModalActions({
  onClose,
  save = "Save Student"
}) {

  return (

    <div className="modal-actions">

      <button
        type="button"
        className="secondary"
        onClick={onClose}
      >

        Cancel

      </button>


      <button
        type="submit"
        className="primary"
      >

        {save}

      </button>

    </div>

  );

}


export default App;