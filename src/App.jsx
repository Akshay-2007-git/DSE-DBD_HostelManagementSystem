
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, DoorOpen, ClipboardList, CreditCard,
  Wrench, ShieldCheck, Search, Bell, Plus, Pencil, Trash2,
  Menu, X, BedDouble, UserCheck, IndianRupee, AlertCircle,
  CheckCircle2, Clock3, LogOut, RefreshCw
} from "lucide-react";

const API_URL = "http://127.0.0.1:5000/api";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studentModal, setStudentModal] = useState(false);
  const [allocationModal, setAllocationModal] = useState(false);
  const [toast, setToast] = useState("");

  const activeAllocations = allocations.filter(
    (a) => a.status === "ACTIVE"
  );

  const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const availableBeds = totalBeds - activeAllocations.length;

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const nav = (name) => {
    setPage(name);
    setQuery("");
    setSidebarOpen(false);
  };

  const loadAllData = async () => {
    setLoadingData(true);

    try {
      const responses = await Promise.all([
        fetch(`${API_URL}/students`),
        fetch(`${API_URL}/rooms`),
        fetch(`${API_URL}/allocations`)
      ]);

      const results = await Promise.all(
        responses.map((response) => response.json())
      );

      responses.forEach((response, index) => {
        if (!response.ok || !results[index].success) {
          throw new Error(
            results[index].message || "Unable to load hostel data"
          );
        }
      });

      setStudents(results[0].data.map((s) => ({
        id: Number(s.student_id),
        roll: s.roll_no,
        name: s.name,
        gender: s.gender,
        phone: s.phone,
        email: s.email,
        dept: s.department,
        year: Number(s.year_of_study)
      })));

      setRooms(results[1].data.map((r) => ({
        id: Number(r.room_id),
        number: String(r.room_number),
        floor: Number(r.floor_number),
        capacity: Number(r.capacity),
        type: r.room_type,
        occupiedBeds: Number(r.occupied_beds || 0),
        availableBeds: Number(r.available_beds ?? r.capacity)
      })));

      setAllocations(results[2].data.map((a) => ({
        id: Number(a.allocation_id),
        studentId: Number(a.student_id),
        roomId: Number(a.room_id),
        bed: Number(a.bed_number),
        date: String(a.allocation_date).slice(0, 10),
        status: a.status
      })));
    } catch (error) {
      console.error("Failed to load hostel data:", error);
      notify(`Could not load data: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const addStudent = async (student) => {
    try {
      const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_no: student.roll.trim(),
          name: student.name.trim(),
          gender: student.gender,
          phone: student.phone.trim(),
          email: student.email.trim(),
          department: student.dept,
          year_of_study: Number(student.year)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to add student");
      }

      setStudentModal(false);
      await loadAllData();
      notify("Student saved successfully");
    } catch (error) {
      notify(error.message || "Could not add student");
    }
  };

  const addAllocation = async (data) => {
    const room = rooms.find((r) => r.id === Number(data.roomId));
    const bed = Number(data.bed);

    if (!room || bed < 1 || bed > room.capacity) {
      notify("Invalid bed number");
      return;
    }

    if (activeAllocations.some(
      (a) => a.roomId === room.id && a.bed === bed
    )) {
      notify("That bed is already occupied");
      return;
    }

    if (activeAllocations.some(
      (a) => a.studentId === Number(data.studentId)
    )) {
      notify("Student already has an active allocation");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: Number(data.studentId),
          room_id: Number(data.roomId),
          bed_number: bed
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to allocate bed");
      }

      setAllocationModal(false);
      await loadAllData();
      notify("Bed allocated successfully");
    } catch (error) {
      notify(error.message || "Could not allocate bed");
    }
  };

  const removeAllocation = async (id) => {
    if (!window.confirm("Cancel this allocation?")) return;

    try {
      const response = await fetch(
        `${API_URL}/allocations/${id}/cancel`,
        { method: "PATCH" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to cancel allocation");
      }

      await loadAllData();
      notify("Allocation cancelled");
    } catch (error) {
      notify(error.message || "Could not cancel allocation");
    }
  };

  const pageContent = {
    Dashboard: (
      <Dashboard
        students={students}
        rooms={rooms}
        allocations={activeAllocations}
        availableBeds={availableBeds}
        nav={nav}
      />
    ),
    Students: (
      <Students
        students={students}
        query={query}
        setQuery={setQuery}
        onAdd={() => setStudentModal(true)}
      />
    ),
    Rooms: <Rooms rooms={rooms} allocations={activeAllocations} />,
    Allocations: (
      <Allocations
        students={students}
        rooms={rooms}
        allocations={allocations}
        query={query}
        setQuery={setQuery}
        onAdd={() => setAllocationModal(true)}
        onCancel={removeAllocation}
      />
    ),
    Payments: (
      <Payments
        students={students}
        notify={notify}
        query={query}
        setQuery={setQuery}
      />
    ),
    Maintenance: (
      <Maintenance
        students={students}
        rooms={rooms}
        notify={notify}
        query={query}
        setQuery={setQuery}
      />
    ),
    Administration: <Administration notify={notify} />
  }[page];

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><BedDouble size={23} /></div>
          <div>
            <strong>Hostel<span>Hub</span></strong>
            <small>Management System</small>
          </div>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X />
          </button>
        </div>

        <div className="menu-label">MAIN MENU</div>

        <nav>
          {[
            ["Dashboard", LayoutDashboard],
            ["Students", Users],
            ["Rooms", DoorOpen],
            ["Allocations", ClipboardList],
            ["Payments", CreditCard],
            ["Maintenance", Wrench],
            ["Administration", ShieldCheck]
          ].map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => nav(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-mini">
            <div className="avatar">A</div>
            <div>
              <b>Administrator</b>
              <small>System Admin</small>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu />
            </button>
            <div>
              <div className="breadcrumb">Hostel Management /</div>
              <h1>{page}</h1>
            </div>
          </div>

          <div className="top-actions">
            <div className="search-top">
              <Search size={17} />
              <input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="icon-btn" title="Notifications">
              <Bell size={19} />
              <i />
            </button>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <section className="content">
          {loadingData
            ? <div className="panel" style={{ padding: 16 }}>Loading hostel data...</div>
            : pageContent}
        </section>
      </main>

      {studentModal && (
        <StudentModal
          onClose={() => setStudentModal(false)}
          onSave={addStudent}
        />
      )}

      {allocationModal && (
        <AllocationModal
          students={students}
          rooms={rooms}
          allocations={activeAllocations}
          onClose={() => setAllocationModal(false)}
          onSave={addAllocation}
        />
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

/* DASHBOARD */

function Dashboard({ students, rooms, allocations, availableBeds, nav }) {
  const recent = allocations.slice(-5).reverse();

  return (
    <div>
      <div className="welcome">
        <div>
          <h2>Good morning, Administrator 👋</h2>
          <p>Here's what's happening in your hostel today.</p>
        </div>
        <button className="primary" onClick={() => nav("Allocations")}>
          <Plus size={18} /> New Allocation
        </button>
      </div>

      <div className="stats">
        <Stat icon={<Users />} label="Total Students" value={students.length} note="Registered students" />
        <Stat
          icon={<DoorOpen />}
          label="Total Rooms"
          value={rooms.length}
          note={`${rooms.filter(r => r.type === "Double").length} double · ${rooms.filter(r => r.type === "Triple").length} triple`}
        />
        <Stat icon={<UserCheck />} label="Active Allocations" value={allocations.length} note="Currently occupied" />
        <Stat icon={<BedDouble />} label="Available Beds" value={availableBeds} note="Ready for allocation" />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Recent Allocations</h3><p>Latest room assignments</p></div>
            <button className="text-btn" onClick={() => nav("Allocations")}>View all →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Room</th><th>Bed</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map(a => (
                  <AllocationRow key={a.id} a={a} students={students} rooms={rooms} />
                ))}
                {recent.length === 0 && <EmptyRow colSpan={4} message="No allocations yet." />}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Room Occupancy</h3><p>Current bed utilization</p></div>
            <button className="text-btn" onClick={() => nav("Rooms")}>View rooms →</button>
          </div>
          <div className="occupancy-list">
            {rooms.slice(0, 5).map(r => {
              const used = allocations.filter(a => a.roomId === r.id).length;
              const pct = r.capacity ? Math.round(used / r.capacity * 100) : 0;

              return (
                <div className="occ" key={r.id}>
                  <div className="occ-top"><span>Room {r.number}</span><b>{used}/{r.capacity}</b></div>
                  <div className="progress"><span style={{ width: `${pct}%` }} /></div>
                  <small>{r.type} room · Floor {r.floor}</small>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="quick-grid">
        <button onClick={() => nav("Students")}><Users /><span><b>Student Management</b><small>Register & manage students</small></span>→</button>
        <button onClick={() => nav("Rooms")}><DoorOpen /><span><b>Room Management</b><small>View rooms & availability</small></span>→</button>
        <button onClick={() => nav("Allocations")}><ClipboardList /><span><b>Allocation Management</b><small>Assign beds to students</small></span>→</button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, note }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>
    </div>
  );
}

/* STUDENTS */

function Students({ students, query, setQuery, onAdd }) {
  const filtered = students.filter(s =>
    Object.values(s).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHead title="Student Management" subtitle="Register, view and manage hostel students." button="Add Student" onClick={onAdd} />
      <div className="filterbar">
        <div className="table-search"><Search size={17} /><input placeholder="Search students..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <span>{filtered.length} students</span>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Roll No.</th><th>Student</th><th>Gender</th><th>Phone</th><th>Email</th><th>Department</th><th>Year</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><b>{s.roll}</b></td>
                  <td><Person name={s.name} /></td>
                  <td>{s.gender}</td><td>{s.phone}</td><td>{s.email}</td>
                  <td><span className="tag">{s.dept}</span></td><td>Year {s.year}</td>
                </tr>
              ))}
              {filtered.length === 0 && <EmptyRow colSpan={7} message="No students found." />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ROOMS */

function Rooms({ rooms, allocations }) {
  return (
    <div>
      <PageHead title="Room Management" subtitle="Monitor room capacity and bed availability." />
      <div className="room-summary">
        <div><BedDouble /><b>{allocations.length}</b><span>Occupied beds</span></div>
        <div><CheckCircle2 /><b>{rooms.reduce((x, r) => x + r.capacity, 0) - allocations.length}</b><span>Available beds</span></div>
        <div><DoorOpen /><b>{rooms.length}</b><span>Total rooms</span></div>
      </div>
      <div className="rooms-grid">
        {rooms.map(r => {
          const used = allocations.filter(a => a.roomId === r.id).length;
          const free = r.capacity - used;
          const full = free === 0;

          return (
            <div className="room-card" key={r.id}>
              <div className="room-top">
                <div className="room-number">Room {r.number}</div>
                <span className={`status ${full ? "danger" : "success"}`}>{full ? "Full" : "Available"}</span>
              </div>
              <p>Floor {r.floor} · {r.type} room</p>
              <div className="beds">
                {Array.from({ length: r.capacity }).map((_, i) => (
                  <div key={i} className={`bed ${i < used ? "occupied" : ""}`}>
                    <BedDouble size={17} /><small>Bed {i + 1}</small>
                  </div>
                ))}
              </div>
              <div className="room-bottom"><span>{used} occupied</span><b>{free} available</b></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ALLOCATIONS */

function Allocations({ students, rooms, allocations, query, setQuery, onAdd, onCancel }) {
  const filtered = allocations.filter(a =>
    `${a.id} ${students.find(s => s.id === a.studentId)?.name} ${rooms.find(r => r.id === a.roomId)?.number} ${a.status}`
      .toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHead title="Room & Bed Allocation" subtitle="Assign and track hostel beds for students." button="New Allocation" onClick={onAdd} />
      <div className="filterbar">
        <div className="table-search"><Search size={17} /><input placeholder="Search allocations..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <span>{filtered.length} records</span>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Room</th><th>Bed</th><th>Allocation Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>#{String(a.id).padStart(3, "0")}</td>
                  <td><Person name={students.find(s => s.id === a.studentId)?.name || "Unknown"} /></td>
                  <td><b>Room {rooms.find(r => r.id === a.roomId)?.number || "—"}</b></td>
                  <td><span className="bed-pill">Bed {a.bed}</span></td>
                  <td>{a.date}</td>
                  <td><span className={`status ${a.status === "ACTIVE" ? "success" : "muted"}`}>{a.status}</span></td>
                  <td>{a.status === "ACTIVE" && <button className="row-btn danger-btn" title="Cancel allocation" onClick={() => onCancel(a.id)}><LogOut size={15} /></button>}</td>
                </tr>
              ))}
              {filtered.length === 0 && <EmptyRow colSpan={7} message="No allocations found." />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* PAYMENTS */

function Payments({ students, notify, query, setQuery }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "UPI",
    reference_no: ""
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load payments");
      }
      setPayments(result.data || []);
    } catch (error) {
      notify(`Payments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, []);

  const paidPayments = payments.filter(p => p.status === "PAID");
  const totalCollected = paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const filtered = payments.filter(p =>
    `${p.payment_id} ${p.student_name || ""} ${p.roll_no || ""} ${p.payment_method || ""} ${p.reference_no || ""} ${p.status || ""}`
      .toLowerCase().includes(query.toLowerCase())
  );

  const savePayment = async (event) => {
    event.preventDefault();
    if (!form.student_id) {
      notify("Please select a student");
      return;
    }
    if (Number(form.amount) <= 0) {
      notify("Amount must be greater than zero");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: Number(form.student_id),
          amount: Number(form.amount),
          payment_date: form.payment_date,
          payment_method: form.payment_method,
          reference_no: form.reference_no.trim()
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to record payment");
      }

      setModalOpen(false);
      setForm({
        student_id: "",
        amount: "",
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "UPI",
        reference_no: ""
      });
      await loadPayments();
      notify("Payment recorded successfully");
    } catch (error) {
      notify(error.message || "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Payments Management"
        subtitle="Record student payments and track hostel collections."
        button="Record Payment"
        onClick={() => setModalOpen(true)}
      />

      <div className="stats">
        <Stat icon={<IndianRupee />} label="Total Collected" value={`₹${totalCollected.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} note="Successful payments" />
        <Stat icon={<CreditCard />} label="Transactions" value={payments.length} note="All payment records" />
        <Stat icon={<CheckCircle2 />} label="Paid Transactions" value={paidPayments.length} note="Successfully recorded" />
      </div>

      <div className="filterbar">
        <div className="table-search"><Search size={17} /><input placeholder="Search payments..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <button className="secondary" onClick={loadPayments}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="panel">
        <div className="panel-head"><div><h3>Payment Records</h3><p>Payment history stored in PostgreSQL</p></div><span>{filtered.length} records</span></div>
        {loading ? <p style={{ padding: 16 }}>Loading payments...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Payment ID</th><th>Student</th><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.payment_id}>
                    <td>#{String(p.payment_id).padStart(3, "0")}</td>
                    <td><div className="person"><div className="person-avatar">{(p.student_name || "?")[0]}</div><span>{p.student_name || `Student ${p.student_id}`}<small>{p.roll_no || ""}</small></span></div></td>
                    <td>{String(p.payment_date || "").slice(0, 10)}</td>
                    <td>{p.payment_method}</td>
                    <td>{p.reference_no || "—"}</td>
                    <td><b>₹{Number(p.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></td>
                    <td><span className={`status ${p.status === "PAID" ? "success" : p.status === "PENDING" ? "muted" : "danger"}`}>{p.status}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={7} message="No payment records found." />}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title="Record Student Payment" onClose={() => setModalOpen(false)}>
          <form onSubmit={savePayment}>
            <div className="form-grid">
              <Field
                label="Student"
                name="student_id"
                value={form.student_id}
                onChange={e => setForm({ ...form, student_id: e.target.value })}
                select
                required
                options={[
                  { value: "", label: "Select student" },
                  ...students.map(s => ({ value: s.id, label: `${s.roll} — ${s.name}` }))
                ]}
              />
              <Field label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              <Field label="Payment Date" name="payment_date" type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required />
              <Field label="Payment Method" name="payment_method" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} select options={["UPI", "Cash", "Card", "Bank Transfer", "Other"]} />
              <Field label="Reference Number (optional)" name="reference_no" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} />
            </div>
            <ModalActions onClose={() => setModalOpen(false)} save={saving ? "Saving..." : "Save Payment"} disabled={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* MAINTENANCE */

function Maintenance({ students, rooms, notify, query, setQuery }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    room_id: "",
    student_id: "",
    title: "",
    description: "",
    category: "Electrical",
    priority: "MEDIUM"
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/maintenance`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load maintenance requests");
      }
      setRequests(result.data || []);
    } catch (error) {
      notify(`Maintenance: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const filtered = requests.filter(r =>
    `${r.maintenance_id} ${r.title || ""} ${r.room_number || ""} ${r.student_name || ""} ${r.category || ""} ${r.priority || ""} ${r.status || ""}`
      .toLowerCase().includes(query.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update request");
      }
      await loadRequests();
      notify(`Request updated to ${status}`);
    } catch (error) {
      notify(error.message || "Could not update maintenance request");
    }
  };

  const saveRequest = async (event) => {
    event.preventDefault();
    if (!form.room_id) {
      notify("Please select a room");
      return;
    }
    if (!form.title.trim()) {
      notify("Please enter a request title");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: Number(form.room_id),
          student_id: form.student_id ? Number(form.student_id) : null,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          priority: form.priority
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create maintenance request");
      }

      setModalOpen(false);
      setForm({
        room_id: "",
        student_id: "",
        title: "",
        description: "",
        category: "Electrical",
        priority: "MEDIUM"
      });
      await loadRequests();
      notify("Maintenance request created");
    } catch (error) {
      notify(error.message || "Could not create maintenance request");
    } finally {
      setSaving(false);
    }
  };

  const pending = requests.filter(r => r.status === "PENDING").length;
  const inProgress = requests.filter(r => r.status === "IN_PROGRESS").length;
  const completed = requests.filter(r => r.status === "COMPLETED").length;

  return (
    <div>
      <PageHead title="Maintenance Management" subtitle="Create and track hostel maintenance requests." button="New Request" onClick={() => setModalOpen(true)} />

      <div className="stats">
        <Stat icon={<AlertCircle />} label="Pending" value={pending} note="Awaiting action" />
        <Stat icon={<Clock3 />} label="In Progress" value={inProgress} note="Being worked on" />
        <Stat icon={<CheckCircle2 />} label="Completed" value={completed} note="Resolved requests" />
      </div>

      <div className="filterbar">
        <div className="table-search"><Search size={17} /><input placeholder="Search maintenance requests..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <button className="secondary" onClick={loadRequests}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="panel">
        <div className="panel-head"><div><h3>Maintenance Requests</h3><p>Track room issues and their resolution</p></div><span>{filtered.length} requests</span></div>
        {loading ? <p style={{ padding: 16 }}>Loading requests...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID / Request</th><th>Room</th><th>Reported By</th><th>Category</th><th>Priority</th><th>Status</th><th>Update Status</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.maintenance_id}>
                    <td><b>#{r.maintenance_id}</b><div>{r.title}</div><small>{r.description || ""}</small></td>
                    <td>Room {r.room_number || r.room_id}</td>
                    <td>{r.student_name || "Administrator"}</td>
                    <td>{r.category || "Other"}</td>
                    <td><span className={`status ${r.priority === "URGENT" || r.priority === "HIGH" ? "danger" : "muted"}`}>{r.priority}</span></td>
                    <td><span className={`status ${r.status === "COMPLETED" ? "success" : r.status === "IN_PROGRESS" ? "muted" : "danger"}`}>{String(r.status || "").replace("_", " ")}</span></td>
                    <td>
                      <select
                        aria-label={`Update request ${r.maintenance_id} status`}
                        value={r.status}
                        onChange={e => updateStatus(r.maintenance_id, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <EmptyRow colSpan={7} message="No maintenance requests found." />}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title="Create Maintenance Request" onClose={() => setModalOpen(false)}>
          <form onSubmit={saveRequest}>
            <div className="form-grid">
              <Field label="Room" name="room_id" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })} select required options={[
                { value: "", label: "Select room" },
                ...rooms.map(r => ({ value: r.id, label: `Room ${r.number} — ${r.type}` }))
              ]} />
              <Field label="Student (optional)" name="student_id" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} select options={[
                { value: "", label: "Administrator / Not specified" },
                ...students.map(s => ({ value: s.id, label: `${s.roll} — ${s.name}` }))
              ]} />
              <Field label="Request Title" name="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <Field label="Category" name="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} select options={["Electrical", "Plumbing", "Furniture", "Cleaning", "Internet", "Other"]} />
              <Field label="Priority" name="priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} select options={["LOW", "MEDIUM", "HIGH", "URGENT"]} />
              <label className="field">
                <span>Description</span>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </label>
            </div>
            <ModalActions onClose={() => setModalOpen(false)} save={saving ? "Submitting..." : "Create Request"} disabled={saving} />
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ADMINISTRATION */

function Administration({ notify }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/summary`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load administration summary");
      }
      setSummary(result.data);
    } catch (error) {
      notify(`Administration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  return (
    <div>
      <PageHead title="Administration" subtitle="Hostel overview and system information." />
      <div className="panel">
        <div className="panel-head">
          <div><h3>Hostel Overview</h3><p>Live figures retrieved from the backend</p></div>
          <button className="secondary" onClick={loadSummary}><RefreshCw size={15} /> Refresh</button>
        </div>

        {loading ? <p style={{ padding: 16 }}>Loading administration summary...</p> : summary ? (
          <>
            <div className="stats">
              <Stat icon={<Users />} label="Total Students" value={summary.total_students ?? 0} note="Registered students" />
              <Stat icon={<DoorOpen />} label="Total Rooms" value={summary.total_rooms ?? 0} note="Configured rooms" />
              <Stat icon={<ClipboardList />} label="Active Allocations" value={summary.active_allocations ?? 0} note="Current assignments" />
              <Stat icon={<BedDouble />} label="Total Beds" value={summary.total_beds ?? 0} note="Room capacity" />
              <Stat icon={<IndianRupee />} label="Total Collected" value={`₹${Number(summary.total_collected || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`} note="Recorded paid transactions" />
              <Stat icon={<Wrench />} label="Open Maintenance" value={summary.open_maintenance ?? 0} note="Not yet completed" />
            </div>

            <div className="panel" style={{ marginTop: 20, padding: 20 }}>
              <h3>System Information</h3>
              <p>Application: HostelHub Management System</p>
              <p>Backend: Flask REST API</p>
              <p>Database: PostgreSQL</p>
              <p>Payments recorded: {summary.paid_transactions ?? 0}</p>
              <p>Available beds: {Math.max(0, Number(summary.total_beds || 0) - Number(summary.active_allocations || 0))}</p>
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>
            <p>Could not load the administration summary.</p>
            <button className="primary" onClick={loadSummary}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* SHARED COMPONENTS */

function AllocationRow({ a, students, rooms }) {
  const student = students.find(s => s.id === a.studentId);
  const room = rooms.find(r => r.id === a.roomId);

  return (
    <tr>
      <td><Person name={student?.name || "Unknown"} /></td>
      <td>Room {room?.number || "—"}</td>
      <td>Bed {a.bed}</td>
      <td><span className="status success">ACTIVE</span></td>
    </tr>
  );
}

function Person({ name }) {
  return (
    <div className="person">
      <div className="person-avatar">{name?.[0] || "?"}</div>
      <span>{name}</span>
    </div>
  );
}

function EmptyRow({ colSpan, message }) {
  return <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 24 }}>{message}</td></tr>;
}

function PageHead({ title, subtitle, button, onClick }) {
  return (
    <div className="page-head">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      {button && <button className="primary" onClick={onClick}><Plus size={18} />{button}</button>}
    </div>
  );
}

function StudentModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    roll: "", name: "", gender: "Male", phone: "",
    email: "", dept: "AI & DS", year: 2
  });

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Modal title="Register Student" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
        <div className="form-grid">
          <Field label="Roll Number" name="roll" value={form.roll} onChange={change} required />
          <Field label="Full Name" name="name" value={form.name} onChange={change} required />
          <Field label="Gender" name="gender" value={form.gender} onChange={change} select options={["Male", "Female"]} />
          <Field label="Phone" name="phone" value={form.phone} onChange={change} required />
          <Field label="Email" name="email" value={form.email} onChange={change} type="email" required />
          <Field label="Department" name="dept" value={form.dept} onChange={change} select options={["AI & DS", "CSE", "ECE", "EEE", "Mechanical"]} />
          <Field label="Year of Study" name="year" value={form.year} onChange={change} select options={[1, 2, 3, 4]} />
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

function AllocationModal({ students, rooms, allocations, onClose, onSave }) {
  const [form, setForm] = useState({
    studentId: students[0]?.id || "",
    roomId: rooms[0]?.id || "",
    bed: 1
  });

  const room = rooms.find(r => r.id === Number(form.roomId));
  const occupied = allocations.filter(a => a.roomId === Number(form.roomId)).map(a => a.bed);

  return (
    <Modal title="New Room Allocation" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
        <div className="form-grid">
          <Field label="Student" name="studentId" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} select options={students.map(s => ({ value: s.id, label: `${s.roll} — ${s.name}` }))} />
          <Field label="Room" name="roomId" value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value, bed: 1 })} select options={rooms.map(r => ({ value: r.id, label: `Room ${r.number} — ${r.type}` }))} />
          <Field label="Bed Number" name="bed" value={form.bed} onChange={e => setForm({ ...form, bed: e.target.value })} select options={Array.from({ length: room?.capacity || 1 }, (_, i) => ({ value: i + 1, label: `Bed ${i + 1}${occupied.includes(i + 1) ? " — Occupied" : ""}`, disabled: occupied.includes(i + 1) }))} />
        </div>
        <div className="availability-note"><CheckCircle2 size={17} />{room ? `${room.capacity - occupied.length} bed(s) available in Room ${room.number}` : ""}</div>
        <ModalActions onClose={onClose} save="Allocate Bed" />
      </form>
    </Modal>
  );
}

function Field({ label, name, value, onChange, type = "text", select, options = [], required }) {
  return (
    <label className="field">
      <span>{label}</span>
      {select ? (
        <select name={name} value={value} onChange={onChange} required={required}>
          {options.map(o => typeof o === "object"
            ? <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
            : <option key={o} value={o}>{o}</option>
          )}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required} />
      )}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, save = "Save Student", disabled = false }) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="primary" disabled={disabled}>{save}</button>
    </div>
  );
}

export default App;
