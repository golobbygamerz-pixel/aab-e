import { useEffect, useState, useMemo, FormEvent } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Search, ArrowRight, Play, BedDouble, UtensilsCrossed, Sparkles,
  MapPin, Headphones, Wifi, Snowflake, Tv, Bath, BellRing, Users, Maximize,
  Calendar, Mail, Phone, Clock, ChevronLeft, ChevronRight, LogOut, Check,
  XCircle, TrendingUp, DollarSign, Loader2
} from 'lucide-react';

// ============================================================
// CONFIG
// ============================================================
const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

// ============================================================
// TYPES
// ============================================================
type Room = {
  id: number;
  name: string;
  description: string;
  price: number;
  capacity: number;
  bed: string;
  size: string;
  image: string;
  amenities: string;
  total_rooms: number;
};

type Booking = {
  id: number;
  booking_id: string;
  guest_name: string;
  email: string;
  phone: string;
  room_id: number;
  room_name?: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  rooms: number;
  nights: number;
  total_price: number;
  special_request: string;
  status: string;
  created_at: string;
};

// ============================================================
// API HELPERS
// ============================================================
async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
  }
  return data as T;
}

// ============================================================
// DATE HELPERS
// ============================================================
function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}
function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function nightsBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

// ============================================================
// HEADER
// ============================================================
function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setSearchOpen(false); }, [loc.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/rooms', label: 'Rooms' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header__inner container">
          <Link to="/" className="logo">
            <span className="logo__main">AAB E-HAYAT</span>
            <span className="logo__sub">HOTEL &amp; RESORT</span>
          </Link>
          <nav className="nav nav--desktop">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`nav__link ${loc.pathname === l.to ? 'is-active' : ''}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="header__actions">
            <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(s => !s)}>
              <Search size={18} />
            </button>
            <button className="btn btn--primary btn--sm hide-mobile" onClick={() => nav('/book')}>
              Book Now
            </button>
            <button className="icon-btn burger" aria-label="Menu" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="header__search"
            >
              <div className="container header__searchInner">
                <Search size={16} />
                <input
                  autoFocus
                  placeholder="Search rooms, suites, amenities…"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setSearchOpen(false);
                      nav('/rooms');
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mobile-menu__head container">
              <span className="logo__main">AAB E-HAYAT</span>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <motion.nav
              className="mobile-menu__nav container"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
              }}
            >
              {links.map(l => (
                <motion.div
                  key={l.to}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                >
                  <Link to={l.to} className="mobile-menu__link" onClick={() => setOpen(false)}>
                    {l.label}
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
              ))}
              <motion.button
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="btn btn--primary mobile-menu__cta"
                onClick={() => { setOpen(false); nav('/book'); }}
              >
                Book Now
              </motion.button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="logo logo--light">
            <span className="logo__main">AAB E-HAYAT</span>
            <span className="logo__sub">HOTEL &amp; RESORT</span>
          </div>
          <p className="footer__text">
            A sanctuary of refined luxury where timeless hospitality meets modern elegance.
          </p>
        </div>
        <div>
          <h4 className="footer__title">Explore</h4>
          <ul className="footer__list">
            <li><Link to="/rooms">Rooms &amp; Suites</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="footer__title">Contact</h4>
          <ul className="footer__list">
            <li>Marina Boulevard, Waterfront District</li>
            <li>+1 (800) 555-0199</li>
            <li>reservations@aabehayat.com</li>
          </ul>
        </div>
        <div>
          <h4 className="footer__title">Hours</h4>
          <ul className="footer__list">
            <li>Reception — 24/7</li>
            <li>Check-in — 2:00 PM</li>
            <li>Check-out — 12:00 PM</li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom container">
        <span>© {new Date().getFullYear()} AAB E-HAYAT. All rights reserved.</span>
        <span>Crafted for those who seek the extraordinary.</span>
      </div>
    </footer>
  );
}

// ============================================================
// BOOKING SEARCH CARD (Hero)
// ============================================================
function BookingCard() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    checkIn: todayISO(1),
    checkOut: todayISO(3),
    adults: 2,
    children: 0,
    rooms: 1,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const nights = nightsBetween(form.checkIn, form.checkOut);

  async function check(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form.checkIn || !form.checkOut) {
      setMessage({ type: 'err', text: 'Please select check-in and check-out dates.' });
      return;
    }
    if (nights <= 0) {
      setMessage({ type: 'err', text: 'Check-out must be after check-in.' });
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ available: boolean; rooms: Room[] }>('/api/availability', {
        method: 'POST',
        body: JSON.stringify({
          check_in: form.checkIn,
          check_out: form.checkOut,
          rooms: form.rooms,
        }),
      });
      if (!data.available) {
        setMessage({ type: 'err', text: 'No rooms available for the selected dates.' });
      } else {
        const q = new URLSearchParams({
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: String(form.adults),
          children: String(form.children),
          rooms: String(form.rooms),
        }).toString();
        nav(`/rooms?${q}`);
      }
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      className="booking-card"
      onSubmit={check}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="booking-card__grid">
        <div className="field">
          <label>Check In</label>
          <input
            type="date"
            value={form.checkIn}
            min={todayISO()}
            onChange={e => setForm({ ...form, checkIn: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Check Out</label>
          <input
            type="date"
            value={form.checkOut}
            min={form.checkIn || todayISO()}
            onChange={e => setForm({ ...form, checkOut: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Adults</label>
          <select value={form.adults} onChange={e => setForm({ ...form, adults: +e.target.value })}>
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Children</label>
          <select value={form.children} onChange={e => setForm({ ...form, children: +e.target.value })}>
            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Rooms</label>
          <select value={form.rooms} onChange={e => setForm({ ...form, rooms: +e.target.value })}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="btn btn--primary booking-card__btn" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {loading ? 'Checking…' : 'Check Availability'}
        </button>
      </div>
      {message && (
        <div className={`form-msg form-msg--${message.type === 'ok' ? 'ok' : 'err'}`}>
          {message.text}
        </div>
      )}
      <div className="booking-card__meta">
        <span>{nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : 'Select dates'}</span>
        <span>Best rate guaranteed</span>
      </div>
    </motion.form>
  );
}

// ============================================================
// HOME
// ============================================================
function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg">
          <img src="/images/hero.jpg" alt="AAB E-HAYAT resort" />
          <div className="hero__overlay" />
        </div>
        <div className="container hero__inner">
          <motion.div
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            WELCOME TO AAB E-HAYAT
          </motion.div>
          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Luxury Stays,<br />Unforgettable Moments
          </motion.h1>
          <motion.p
            className="hero__desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            An exquisite retreat where every detail is designed to elevate your journey —
            from serene suites to impeccable service.
          </motion.p>
          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <Link to="/rooms" className="btn btn--primary">
              Explore Rooms <ArrowRight size={16} />
            </Link>
            <button className="btn btn--ghost" onClick={() => alert('Video tour coming soon.')}>
              <Play size={14} /> Watch Video
            </button>
          </motion.div>
        </div>
        <div className="container hero__bookingWrap">
          <BookingCard />
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container features__grid">
          {[
            { icon: BedDouble, t: 'Premium Rooms', d: 'Elegant, spacious and immaculately designed.' },
            { icon: UtensilsCrossed, t: 'Fine Dining', d: 'Curated menus by award-winning chefs.' },
            { icon: Sparkles, t: 'Relax & Rejuvenate', d: 'Signature spa and wellness rituals.' },
            { icon: MapPin, t: 'Prime Location', d: 'Moments from the city’s finest experiences.' },
            { icon: Headphones, t: '24/7 Support', d: 'Attentive concierge around the clock.' },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              className="feature"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <div className="feature__icon"><f.icon size={22} /></div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <RoomsPreview />
    </div>
  );
}

function RoomsPreview() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Room[]>('/api/rooms')
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          eyebrow="Our Rooms"
          title="Sanctuaries of Comfort"
          desc="Each room is a private retreat — crafted with intention, finished with care."
        />
        <div className="rooms-grid">
          {loading && [0, 1, 2].map(i => <div key={i} className="room-card room-card--skeleton" />)}
          {!loading && rooms.slice(0, 3).map((r, i) => (
            <motion.div
              key={r.id}
              className="room-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <div className="room-card__img">
                <img src={r.image} alt={r.name} loading="lazy" />
                <span className="room-card__price">${r.price}<em>/night</em></span>
              </div>
              <div className="room-card__body">
                <h3>{r.name}</h3>
                <p>{r.description}</p>
                <div className="room-card__meta">
                  <span><Users size={14} /> {r.capacity} Guests</span>
                  <span><BedDouble size={14} /> {r.bed}</span>
                </div>
                <div className="room-card__actions">
                  <Link to={`/rooms/${r.id}`} className="btn btn--ghost btn--sm">View Details</Link>
                  <Link to={`/book?room=${r.id}`} className="btn btn--primary btn--sm">Book Now</Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <motion.div
      className="section-head"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55 }}
    >
      <span className="section-head__eyebrow">{eyebrow}</span>
      <h2 className="section-head__title">{title}</h2>
      {desc && <p className="section-head__desc">{desc}</p>}
    </motion.div>
  );
}

// ============================================================
// ROOMS PAGE
// ============================================================
function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const guests = params.get('adults') || '';

  useEffect(() => {
    api<Room[]>('/api/rooms')
      .then(setRooms)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <PageHero
        image="/images/gallery-1.jpg"
        eyebrow="Rooms & Suites"
        title="Choose Your Sanctuary"
      />
      <section className="section">
        <div className="container">
          {(checkIn || checkOut || guests) && (
            <div className="stay-bar">
              <Calendar size={16} />
              <span>
                {checkIn ? fmtDate(checkIn) : 'Any date'} → {checkOut ? fmtDate(checkOut) : 'Any date'}
                {guests ? ` · ${guests} guest${+guests > 1 ? 's' : ''}` : ''}
              </span>
            </div>
          )}
          {err && <div className="form-msg form-msg--err">{err}</div>}
          <div className="rooms-grid">
            {loading && [0, 1, 2].map(i => <div key={i} className="room-card room-card--skeleton" />)}
            {rooms.map((r, i) => (
              <motion.div
                key={r.id}
                className="room-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <div className="room-card__img">
                  <img src={r.image} alt={r.name} loading="lazy" />
                  <span className="room-card__price">${r.price}<em>/night</em></span>
                </div>
                <div className="room-card__body">
                  <h3>{r.name}</h3>
                  <p>{r.description}</p>
                  <div className="room-card__meta">
                    <span><Users size={14} /> {r.capacity} Guests</span>
                    <span><BedDouble size={14} /> {r.bed}</span>
                    <span><Maximize size={14} /> {r.size}</span>
                  </div>
                  <div className="room-card__actions">
                    <Link to={`/rooms/${r.id}`} className="btn btn--ghost btn--sm">View Details</Link>
                    <Link to={`/book?room=${r.id}`} className="btn btn--primary btn--sm">Book Now</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// ROOM DETAILS
// ============================================================
function RoomDetails() {
  const { id } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<Room>(`/api/rooms/${id}`)
      .then(setRoom)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><Loader2 className="spin" /></div>;
  if (err || !room) return (
    <div className="page">
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <h2>Room not found</h2>
        <Link to="/rooms" className="btn btn--primary" style={{ marginTop: 24 }}>Back to Rooms</Link>
      </div>
    </div>
  );

  const amenities = room.amenities.split(',').map(s => s.trim()).filter(Boolean);
  const iconFor = (a: string) => {
    const k = a.toLowerCase();
    if (k.includes('wifi')) return <Wifi size={18} />;
    if (k.includes('air')) return <Snowflake size={18} />;
    if (k.includes('tv')) return <Tv size={18} />;
    if (k.includes('bath')) return <Bath size={18} />;
    if (k.includes('service')) return <BellRing size={18} />;
    if (k.includes('bed')) return <BedDouble size={18} />;
    return <Sparkles size={18} />;
  };

  return (
    <div className="page">
      <section className="room-detail">
        <div className="container">
          <Link to="/rooms" className="back-link">
            <ChevronLeft size={16} /> All Rooms
          </Link>
          <div className="room-detail__grid">
            <motion.div
              className="room-detail__img"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            >
              <img src={room.image} alt={room.name} />
            </motion.div>
            <motion.div
              className="room-detail__panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="section-head__eyebrow">Room</span>
              <h1>{room.name}</h1>
              <div className="room-detail__price">
                ${room.price}<em>/night</em>
              </div>
              <p>{room.description}</p>
              <div className="room-detail__specs">
                <div><Users size={16} /><span>Up to {room.capacity} guests</span></div>
                <div><BedDouble size={16} /><span>{room.bed}</span></div>
                <div><Maximize size={16} /><span>{room.size}</span></div>
              </div>
              <Link to={`/book?room=${room.id}`} className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                Book This Room
              </Link>
            </motion.div>
          </div>

          <div className="room-detail__amenities">
            <h3>Amenities</h3>
            <div className="amenities-grid">
              {amenities.map(a => (
                <div key={a} className="amenity">
                  <span className="amenity__icon">{iconFor(a)}</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// BOOK PAGE
// ============================================================
function BookPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const loc = useLocation();
  const nav = useNavigate();
  const params = new URLSearchParams(loc.search);
  const [form, setForm] = useState({
    guest_name: '',
    email: '',
    phone: '',
    room_id: params.get('room') || '',
    check_in: todayISO(1),
    check_out: todayISO(3),
    adults: 2,
    children: 0,
    rooms: 1,
    special_request: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Room[]>('/api/rooms').then(setRooms).catch(() => {});
  }, []);

  const selectedRoom = rooms.find(r => String(r.id) === String(form.room_id));
  const nights = nightsBetween(form.check_in, form.check_out);
  const total = selectedRoom ? selectedRoom.price * nights * form.rooms : 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.guest_name.trim()) return setError('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (!form.phone.trim()) return setError('Please enter a phone number.');
    if (!form.room_id) return setError('Please select a room.');
    if (nights <= 0) return setError('Check-out must be after check-in.');

    setLoading(true);
    try {
      const res = await api<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          room_id: Number(form.room_id),
          adults: Number(form.adults),
          children: Number(form.children),
          rooms: Number(form.rooms),
        }),
      });
      sessionStorage.setItem('lastBooking', JSON.stringify(res.booking));
      nav('/booking-success');
    } catch (err: any) {
      setError(err.message || 'Unable to complete booking.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHero image="/images/gallery-2.jpg" eyebrow="Reservation" title="Complete Your Booking" />
      <section className="section">
        <div className="container book-grid">
          <form className="book-form" onSubmit={submit}>
            <h3 className="book-form__title">Guest Details</h3>
            <div className="form-row">
              <div className="field">
                <label>Full Name *</label>
                <input
                  value={form.guest_name}
                  onChange={e => setForm({ ...form, guest_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Phone *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 555 000 1234"
                />
              </div>
              <div className="field">
                <label>Room Type *</label>
                <select value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
                  <option value="">Select a room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — ${r.price}/night
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="book-form__title">Stay Details</h3>
            <div className="form-row">
              <div className="field">
                <label>Check In</label>
                <input
                  type="date"
                  value={form.check_in}
                  min={todayISO()}
                  onChange={e => setForm({ ...form, check_in: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Check Out</label>
                <input
                  type="date"
                  value={form.check_out}
                  min={form.check_in || todayISO()}
                  onChange={e => setForm({ ...form, check_out: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row form-row--3">
              <div className="field">
                <label>Adults</label>
                <select value={form.adults} onChange={e => setForm({ ...form, adults: +e.target.value })}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Children</label>
                <select value={form.children} onChange={e => setForm({ ...form, children: +e.target.value })}>
                  {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Rooms</label>
                <select value={form.rooms} onChange={e => setForm({ ...form, rooms: +e.target.value })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Special Request</label>
              <textarea
                rows={3}
                value={form.special_request}
                onChange={e => setForm({ ...form, special_request: e.target.value })}
                placeholder="Airport pickup, high floor, anniversary celebration…"
              />
            </div>

            {error && <div className="form-msg form-msg--err">{error}</div>}

            <button className="btn btn--primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? 'Processing…' : 'Confirm Booking'}
            </button>
          </form>

          <aside className="book-summary">
            <h3>Reservation Summary</h3>
            {selectedRoom ? (
              <>
                <img src={selectedRoom.image} alt={selectedRoom.name} className="book-summary__img" />
                <div className="book-summary__row">
                  <span>Room</span><strong>{selectedRoom.name}</strong>
                </div>
                <div className="book-summary__row">
                  <span>Check In</span><strong>{fmtDate(form.check_in)}</strong>
                </div>
                <div className="book-summary__row">
                  <span>Check Out</span><strong>{fmtDate(form.check_out)}</strong>
                </div>
                <div className="book-summary__row">
                  <span>Nights</span><strong>{nights || '—'}</strong>
                </div>
                <div className="book-summary__row">
                  <span>Rooms</span><strong>{form.rooms}</strong>
                </div>
                <div className="book-summary__row">
                  <span>Rate</span><strong>${selectedRoom.price}/night</strong>
                </div>
                <div className="book-summary__total">
                  <span>Total</span>
                  <strong>${total.toLocaleString()}</strong>
                </div>
              </>
            ) : (
              <p className="book-summary__empty">Select a room to view your reservation summary.</p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// BOOKING SUCCESS
// ============================================================
function BookingSuccess() {
  const [booking, setBooking] = useState<Booking | null>(null);
  useEffect(() => {
    const raw = sessionStorage.getItem('lastBooking');
    if (raw) {
      try { setBooking(JSON.parse(raw)); } catch {}
    }
  }, []);

  if (!booking) {
    return (
      <div className="page">
        <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
          <h2>No recent booking found</h2>
          <Link to="/rooms" className="btn btn--primary" style={{ marginTop: 24 }}>Browse Rooms</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <motion.div
            className="success-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="success-card__badge"><Check size={28} /></div>
            <h1>Booking Confirmed</h1>
            <p className="success-card__sub">
              Thank you, {booking.guest_name}. Your reservation has been received and is pending confirmation.
            </p>

            <div className="success-card__id">
              <span>Booking ID</span>
              <strong>{booking.booking_id}</strong>
            </div>

            <div className="success-grid">
              <div><span>Room</span><strong>{booking.room_name || '—'}</strong></div>
              <div><span>Status</span><strong className={`status status--${booking.status}`}>{booking.status}</strong></div>
              <div><span>Check In</span><strong>{fmtDate(booking.check_in)}</strong></div>
              <div><span>Check Out</span><strong>{fmtDate(booking.check_out)}</strong></div>
              <div><span>Guests</span><strong>{booking.adults} adults, {booking.children} children</strong></div>
              <div><span>Rooms</span><strong>{booking.rooms}</strong></div>
              <div><span>Nights</span><strong>{booking.nights}</strong></div>
              <div><span>Total</span><strong>${Number(booking.total_price).toLocaleString()}</strong></div>
            </div>

            <div className="success-actions">
              <Link to="/" className="btn btn--ghost">Back to Home</Link>
              <Link to="/rooms" className="btn btn--primary">Book Another Stay</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// GALLERY
// ============================================================
const GALLERY = [
  { src: '/images/gallery-1.jpg', alt: 'Lobby' },
  { src: '/images/gallery-2.jpg', alt: 'Pool' },
  { src: '/images/gallery-3.jpg', alt: 'Suite' },
  { src: '/images/gallery-4.jpg', alt: 'Dining' },
  { src: '/images/room-1.jpg', alt: 'Deluxe' },
  { src: '/images/room-2.jpg', alt: 'Executive' },
  { src: '/images/room-3.jpg', alt: 'Luxury Suite' },
  { src: '/images/hero.jpg', alt: 'Resort' },
];

function GalleryPage() {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (active === null) return;
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') setActive(a => (a === null ? a : (a + 1) % GALLERY.length));
      if (e.key === 'ArrowLeft') setActive(a => (a === null ? a : (a - 1 + GALLERY.length) % GALLERY.length));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <div className="page">
      <PageHero image="/images/gallery-3.jpg" eyebrow="Gallery" title="Moments at AAB E-HAYAT" />
      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {GALLERY.map((g, i) => (
              <motion.button
                key={g.src + i}
                className={`gallery-item gallery-item--${(i % 7) + 1}`}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              >
                <img src={g.src} alt={g.alt} loading="lazy" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <button className="lightbox__close" onClick={() => setActive(null)}><X size={26} /></button>
            <button
              className="lightbox__nav lightbox__nav--prev"
              onClick={e => { e.stopPropagation(); setActive(a => a === null ? a : (a - 1 + GALLERY.length) % GALLERY.length); }}
            >
              <ChevronLeft size={28} />
            </button>
            <motion.img
              key={active}
              src={GALLERY[active].src}
              alt={GALLERY[active].alt}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="lightbox__nav lightbox__nav--next"
              onClick={e => { e.stopPropagation(); setActive(a => a === null ? a : (a + 1) % GALLERY.length); }}
            >
              <ChevronRight size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ABOUT
// ============================================================
function AboutPage() {
  return (
    <div className="page">
      <PageHero image="/images/gallery-4.jpg" eyebrow="Our Story" title="A Legacy of Hospitality" />
      <section className="section">
        <div className="container about">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-head__eyebrow">About AAB E-HAYAT</span>
            <h2 className="about__title">Where elegance becomes memory.</h2>
            <p>
              AAB E-HAYAT is a haven of quiet luxury — a place where the rhythm of the day slows,
              and every moment is thoughtfully composed. From the architecture to the amenities,
              everything is designed to let you truly unwind.
            </p>
          </motion.div>

          <div className="about__grid">
            {[
              {
                img: '/images/gallery-1.jpg',
                t: 'Hospitality',
                d: 'Warm, personal, and unscripted — our team anticipates rather than reacts.',
              },
              {
                img: '/images/room-2.jpg',
                t: 'Comfort',
                d: 'Spaces layered with natural textures, soft light, and refined restraint.',
              },
              {
                img: '/images/gallery-3.jpg',
                t: 'Experience',
                d: 'From private dining to wellness rituals — curated for the senses.',
              },
            ].map((s, i) => (
              <motion.div
                key={s.t}
                className="about__card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
              >
                <img src={s.img} alt={s.t} loading="lazy" />
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// CONTACT
// ============================================================
function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState(null);
    if (!form.name.trim()) return setState({ type: 'err', text: 'Please enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setState({ type: 'err', text: 'Please enter a valid email.' });
    if (!form.message.trim()) return setState({ type: 'err', text: 'Please enter a message.' });
    setLoading(true);
    try {
      await api('/api/contact', { method: 'POST', body: JSON.stringify(form) });
      setState({ type: 'ok', text: 'Thank you. Our team will get back to you shortly.' });
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      setState({ type: 'err', text: err.message || 'Unable to send message.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHero image="/images/gallery-2.jpg" eyebrow="Contact" title="We'd Love to Hear From You" />
      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <h3>Reach Us</h3>
            <div className="contact-info__item">
              <MapPin size={18} />
              <div><strong>Address</strong><p>Marina Boulevard, Waterfront District</p></div>
            </div>
            <div className="contact-info__item">
              <Phone size={18} />
              <div><strong>Phone</strong><p>+1 (800) 555-0199</p></div>
            </div>
            <div className="contact-info__item">
              <Mail size={18} />
              <div><strong>Email</strong><p>reservations@aabehayat.com</p></div>
            </div>
            <div className="contact-info__item">
              <Clock size={18} />
              <div><strong>Support Hours</strong><p>Reception open 24/7</p></div>
            </div>
            <div className="contact-map">
              <div className="contact-map__ph">
                <MapPin size={28} />
                <span>Map Placeholder</span>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={submit}>
            <h3>Send a Message</h3>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            {state && <div className={`form-msg form-msg--${state.type}`}>{state.text}</div>}
            <button className="btn btn--primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// PAGE HERO (shared)
// ============================================================
function PageHero({ image, eyebrow, title }: { image: string; eyebrow: string; title: string }) {
  return (
    <section className="page-hero">
      <div className="page-hero__bg">
        <img src={image} alt="" />
        <div className="page-hero__overlay" />
      </div>
      <div className="container page-hero__inner">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero__eyebrow"
        >
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
      </div>
    </section>
  );
}

// ============================================================
// ADMIN
// ============================================================
const STATUS_FLOW = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] as const;

function AdminPage() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('adminToken'));
  if (!token) return <AdminLogin onLogin={t => { sessionStorage.setItem('adminToken', t); setToken(t); }} />;
  return <AdminDashboard token={token} onLogout={() => { sessionStorage.removeItem('adminToken'); setToken(null); }} />;
}

function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onLogin(res.token);
    } catch (err: any) {
      setErr(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <motion.form
        className="admin-login__card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="logo" style={{ marginBottom: 8 }}>
          <span className="logo__main">AAB E-HAYAT</span>
          <span className="logo__sub">ADMIN PANEL</span>
        </div>
        <p className="admin-login__sub">Sign in to manage bookings</p>
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
        </div>
        {err && <div className="form-msg form-msg--err">{err}</div>}
        <button className="btn btn--primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="admin-login__hint">Default: admin / change-this-password</p>
      </motion.form>
    </div>
  );
}

type Stats = {
  total: number;
  pending: number;
  confirmed: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
  revenue: number;
};

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [s, b] = await Promise.all([
        api<Stats>('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        api<Booking[]>('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(s);
      setBookings(b);
    } catch (e: any) {
      setErr(e.message || 'Failed to load.');
      if (String(e.message).toLowerCase().includes('auth')) onLogout();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function updateStatus(id: number, status: string) {
    try {
      await api(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      await load();
      if (selected && selected.id === id) {
        setSelected({ ...selected, status });
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update.');
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="admin">
      <div className="admin__topbar">
        <div className="container admin__topbarInner">
          <div className="logo logo--light">
            <span className="logo__main">AAB E-HAYAT</span>
            <span className="logo__sub">ADMIN DASHBOARD</span>
          </div>
          <div className="admin__topbarActions">
            <button className="btn btn--ghost btn--sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 size={14} className="spin" /> : null} Refresh
            </button>
            <button className="btn btn--primary btn--sm" onClick={onLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container admin__body">
        {err && <div className="form-msg form-msg--err">{err}</div>}

        <div className="admin-stats">
          <StatCard label="Total" value={stats?.total ?? 0} icon={<TrendingUp size={18} />} />
          <StatCard label="Pending" value={stats?.pending ?? 0} tone="warn" />
          <StatCard label="Confirmed" value={stats?.confirmed ?? 0} tone="ok" />
          <StatCard label="Checked In" value={stats?.checked_in ?? 0} tone="info" />
          <StatCard label="Checked Out" value={stats?.checked_out ?? 0} />
          <StatCard label="Cancelled" value={stats?.cancelled ?? 0} tone="err" />
          <StatCard
            label="Revenue"
            value={`$${(stats?.revenue ?? 0).toLocaleString()}`}
            icon={<DollarSign size={18} />}
            tone="gold"
          />
        </div>

        <div className="admin-filters">
          {['all', ...STATUS_FLOW].map(f => (
            <button
              key={f}
              className={`chip ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Guests</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td data-label="Booking ID"><span className="mono">{b.booking_id}</span></td>
                  <td data-label="Guest">
                    <div><strong>{b.guest_name}</strong></div>
                    <div className="muted">{b.email}</div>
                  </td>
                  <td data-label="Room">{b.room_name || '—'}</td>
                  <td data-label="Check In">{fmtDate(b.check_in)}</td>
                  <td data-label="Check Out">{fmtDate(b.check_out)}</td>
                  <td data-label="Guests">{b.adults}+{b.children}</td>
                  <td data-label="Amount">${Number(b.total_price).toLocaleString()}</td>
                  <td data-label="Status"><span className={`status status--${b.status}`}>{b.status.replace('_', ' ')}</span></td>
                  <td className="admin-table__actions">
                    <button className="btn btn--ghost btn--xs" onClick={() => setSelected(b)}>View</button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>No bookings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal__head">
                <h3>Booking {selected.booking_id}</h3>
                <button className="icon-btn" onClick={() => setSelected(null)}><X size={20} /></button>
              </div>
              <div className="modal__body">
                <div className="kv"><span>Guest</span><strong>{selected.guest_name}</strong></div>
                <div className="kv"><span>Email</span><strong>{selected.email}</strong></div>
                <div className="kv"><span>Phone</span><strong>{selected.phone}</strong></div>
                <div className="kv"><span>Room</span><strong>{selected.room_name || '—'}</strong></div>
                <div className="kv"><span>Check In</span><strong>{fmtDate(selected.check_in)}</strong></div>
                <div className="kv"><span>Check Out</span><strong>{fmtDate(selected.check_out)}</strong></div>
                <div className="kv"><span>Adults / Children</span><strong>{selected.adults} / {selected.children}</strong></div>
                <div className="kv"><span>Rooms</span><strong>{selected.rooms}</strong></div>
                <div className="kv"><span>Nights</span><strong>{selected.nights}</strong></div>
                <div className="kv"><span>Total</span><strong>${Number(selected.total_price).toLocaleString()}</strong></div>
                <div className="kv"><span>Status</span><strong className={`status status--${selected.status}`}>{selected.status.replace('_', ' ')}</strong></div>
                {selected.special_request && (
                  <div className="kv kv--col"><span>Special Request</span><p>{selected.special_request}</p></div>
                )}
              </div>
              <div className="modal__actions">
                {(['confirmed', 'checked_in', 'checked_out', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    className={`btn btn--sm ${selected.status === s ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={selected.status === s}
                  >
                    {s === 'cancelled' ? <XCircle size={14} /> : <Check size={14} />}
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number | string; icon?: React.ReactNode; tone?: string }) {
  return (
    <div className={`stat-card ${tone ? `stat-card--${tone}` : ''}`}>
      <div className="stat-card__head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}

// ============================================================
// APP / ROUTES
// ============================================================
export default function App() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Header />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Routes location={loc}>
              <Route path="/" element={<Home />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:id" element={<RoomDetails />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}