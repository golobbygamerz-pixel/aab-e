// ============================================================
// AAB E-HAYAT — Express + SQLite backend
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------- Database ----------
const DB_PATH = path.join(__dirname, 'aab-e-hayat.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    capacity INTEGER NOT NULL,
    bed TEXT NOT NULL,
    size TEXT NOT NULL,
    image TEXT NOT NULL,
    amenities TEXT NOT NULL,
    total_rooms INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL UNIQUE,
    guest_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    room_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER NOT NULL DEFAULT 0,
    rooms INTEGER NOT NULL DEFAULT 1,
    nights INTEGER NOT NULL,
    total_price REAL NOT NULL,
    special_request TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------- Seed rooms ----------
const roomCount = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;
if (roomCount === 0) {
  const insert = db.prepare(`
    INSERT INTO rooms (name, description, price, capacity, bed, size, image, amenities, total_rooms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seed = [
    {
      name: 'Deluxe Room',
      description: 'A refined retreat with warm textures, garden views and everything you need for a restorative stay.',
      price: 220,
      capacity: 2,
      bed: 'King Bed',
      size: '42 m²',
      image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=80',
      amenities: 'King Bed, Wi-Fi, Air Conditioning, Smart TV, Private Bathroom, Room Service',
      total_rooms: 5,
    },
    {
      name: 'Executive Room',
      description: 'Elevated comfort with a private lounge corner, marble bath and a suite of executive privileges.',
      price: 320,
      capacity: 3,
      bed: 'King Bed + Sofa',
      size: '55 m²',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=80',
      amenities: 'King Bed, Wi-Fi, Air Conditioning, Smart TV, Private Bathroom, Room Service, Lounge Access',
      total_rooms: 4,
    },
    {
      name: 'Luxury Suite',
      description: 'The pinnacle of AAB E-HAYAT living — a spacious suite with panoramic views and a private terrace.',
      price: 520,
      capacity: 4,
      bed: 'Super King',
      size: '88 m²',
      image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1600&q=80',
      amenities: 'Super King, Wi-Fi, Air Conditioning, Smart TV, Private Bathroom, Room Service, Private Terrace, Butler Service',
      total_rooms: 2,
    },
  ];
  const tx = db.transaction(() => {
    for (const r of seed) {
      insert.run(r.name, r.description, r.price, r.capacity, r.bed, r.size, r.image, r.amenities, r.total_rooms);
    }
  });
  tx();
  console.log('[db] Seeded rooms.');
}

// ---------- Helpers ----------
function isDateISO(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
function nightsBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00Z').getTime();
  const d2 = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((d2 - d1) / 86400000);
}
function todayUTCISO() {
  return new Date().toISOString().split('T')[0];
}
function generateBookingId() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const prefix = `AEH-${yyyy}${mm}${dd}-`;
  const row = db.prepare(`SELECT booking_id FROM bookings WHERE booking_id LIKE ? ORDER BY id DESC LIMIT 1`).get(prefix + '%');
  let next = 1;
  if (row) {
    const tail = parseInt(row.booking_id.slice(prefix.length), 10);
    if (!isNaN(tail)) next = tail + 1;
  }
  return prefix + String(next).padStart(3, '0');
}

// Overlap: two ranges [a1, a2) and [b1, b2) overlap when a1 < b2 && b1 < a2
function roomsBookedForRange(roomId, checkIn, checkOut, excludeBookingId) {
  let sql = `
    SELECT COALESCE(SUM(rooms), 0) AS used
    FROM bookings
    WHERE room_id = ?
      AND status IN ('pending','confirmed','checked_in')
      AND check_in < ?
      AND check_out > ?
  `;
  const params = [roomId, checkOut, checkIn];
  if (excludeBookingId) {
    sql += ` AND id != ?`;
    params.push(excludeBookingId);
  }
  const row = db.prepare(sql).get(...params);
  return row.used || 0;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !token.startsWith('aab-admin-')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

function validEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ============================================================
// PUBLIC API
// ============================================================

// GET /api/rooms
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.prepare(`SELECT * FROM rooms ORDER BY id ASC`).all();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch rooms.' });
  }
});

// GET /api/rooms/:id
app.get('/api/rooms/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid room id.' });
  try {
    const room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(id);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch room.' });
  }
});

// POST /api/availability  { check_in, check_out, rooms }
app.post('/api/availability', (req, res) => {
  const { check_in, check_out, rooms } = req.body || {};
  const roomsWanted = Math.max(1, Number(rooms) || 1);

  if (!isDateISO(check_in) || !isDateISO(check_out)) {
    return res.status(400).json({ error: 'Invalid dates. Use YYYY-MM-DD.' });
  }
  if (check_in < todayUTCISO()) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
  }
  const nights = nightsBetween(check_in, check_out);
  if (nights <= 0) {
    return res.status(400).json({ error: 'Check-out must be after check-in.' });
  }

  try {
    const allRooms = db.prepare(`SELECT * FROM rooms ORDER BY id ASC`).all();
    const available = [];
    for (const r of allRooms) {
      const used = roomsBookedForRange(r.id, check_in, check_out);
      const remaining = r.total_rooms - used;
      if (remaining >= roomsWanted) {
        available.push({ ...r, remaining });
      }
    }
    res.json({ available: available.length > 0, nights, rooms: available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to check availability.' });
  }
});

// POST /api/bookings
app.post('/api/bookings', (req, res) => {
  const {
    guest_name, email, phone, room_id, check_in, check_out,
    adults, children, rooms, special_request,
  } = req.body || {};

  const adultsN = Number(adults);
  const childrenN = Number(children) || 0;
  const roomsN = Number(rooms) || 1;

  if (!guest_name || String(guest_name).trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a valid guest name.' });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!phone || String(phone).trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a valid phone number.' });
  }
  if (!isDateISO(check_in) || !isDateISO(check_out)) {
    return res.status(400).json({ error: 'Invalid dates. Use YYYY-MM-DD.' });
  }
  if (check_in < todayUTCISO()) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
  }
  const nights = nightsBetween(check_in, check_out);
  if (nights <= 0) {
    return res.status(400).json({ error: 'Check-out must be after check-in.' });
  }
  if (!Number.isInteger(adultsN) || adultsN < 1) {
    return res.status(400).json({ error: 'At least one adult is required.' });
  }
  if (childrenN < 0) return res.status(400).json({ error: 'Children cannot be negative.' });
  if (!Number.isInteger(roomsN) || roomsN < 1 || roomsN > 10) {
    return res.status(400).json({ error: 'Rooms must be between 1 and 10.' });
  }

  try {
    const room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(Number(room_id));
    if (!room) return res.status(404).json({ error: 'Selected room not found.' });

    if (adultsN + childrenN > room.capacity * roomsN) {
      return res.status(400).json({
        error: `This room accommodates up to ${room.capacity} guests per room. Please add more rooms or choose a larger suite.`,
      });
    }

    const used = roomsBookedForRange(room.id, check_in, check_out);
    const remaining = room.total_rooms - used;
    if (remaining < roomsN) {
      return res.status(409).json({
        error: remaining <= 0
          ? 'This room is fully booked for the selected dates.'
          : `Only ${remaining} room(s) of this type available for the selected dates.`,
      });
    }

    const total_price = Math.round(room.price * nights * roomsN * 100) / 100;
    const booking_id = generateBookingId();

    const stmt = db.prepare(`
      INSERT INTO bookings
        (booking_id, guest_name, email, phone, room_id, check_in, check_out,
         adults, children, rooms, nights, total_price, special_request, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    const info = stmt.run(
      booking_id,
      String(guest_name).trim(),
      String(email).trim(),
      String(phone).trim(),
      room.id,
      check_in,
      check_out,
      adultsN,
      childrenN,
      roomsN,
      nights,
      total_price,
      String(special_request || '').trim()
    );

    const booking = db.prepare(`
      SELECT b.*, r.name AS room_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to complete booking. Please try again.' });
  }
});

// GET /api/bookings/:bookingId
app.get('/api/bookings/:bookingId', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, r.name AS room_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.booking_id = ?
    `).get(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch booking.' });
  }
});

// POST /api/contact
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Please provide your name.' });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!message || String(message).trim().length < 5) {
    return res.status(400).json({ error: 'Please provide a message.' });
  }
  try {
    db.prepare(`INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)`).run(
      String(name).trim(),
      String(email).trim(),
      String(message).trim()
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to send message.' });
  }
});

// ============================================================
// ADMIN API
// ============================================================

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  // Simple opaque token — demo only.
  const token = `aab-admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  res.json({ token, username });
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', authMiddleware, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, r.name AS room_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      ORDER BY b.id DESC
    `).all();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch bookings.' });
  }
});

// PATCH /api/admin/bookings/:id/status  { status }
app.patch('/api/admin/bookings/:id/status', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid booking id.' });
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  try {
    const row = db.prepare(`SELECT id FROM bookings WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Booking not found.' });
    db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, id);
    const updated = db.prepare(`
      SELECT b.*, r.name AS room_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.id = ?
    `).get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to update status.' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  try {
    const totals = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) AS checked_in,
        SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) AS checked_out,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM bookings
    `).get();

    const revenueRow = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) AS revenue
      FROM bookings
      WHERE status IN ('confirmed','checked_in','checked_out')
    `).get();

    res.json({
      total: totals.total || 0,
      pending: totals.pending || 0,
      confirmed: totals.confirmed || 0,
      checked_in: totals.checked_in || 0,
      checked_out: totals.checked_out || 0,
      cancelled: totals.cancelled || 0,
      revenue: revenueRow.revenue || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch stats.' });
  }
});

// ---------- Fallback ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`\n  AAB E-HAYAT backend running on http://localhost:${PORT}`);
  console.log(`  Admin credentials: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}\n`);
});