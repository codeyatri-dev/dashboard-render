import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginPage from "./LoginPage";
import { fetchInstagramFollowers } from "./apiHelpers";

// components and hook (new files)
import Metric from "./components/Metric";
import LineChart from "./components/LineChart";
import IntegratedCalendar from "./components/IntegratedCalendar";
import ProjectColumn from "./components/ProjectColumn";
import EventColumn from "./components/EventColumn";
import Modal from "./components/Modal";
import NewProjectForm from "./components/NewProjectForm";
import NewEventForm from "./components/NewEventForm";
import CustomConfetti from "./components/CustomConfetti";
import useDragDrop from "./hooks/useDragDrop";



// Helper functions
function cx(...xs) { return xs.filter(Boolean).join(" "); }

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function onResize() { setSize({ width: window.innerWidth, height: window.innerHeight }); }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function formatDateStr(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch { return dateStr; }
}

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
      <CalendarDashboard />
    </div>
  );
}





function generateTimeSeries() {
  const labels = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (11 - i) * 3);
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  });
  const rnd = (base, idx) => Math.max(0, Math.round(base + Math.sin(idx / 2) * 200 + idx * 40));
  return {
    labels,
    whatsapp: labels.map((_, i) => rnd(2500, i)),
    linkedin: labels.map((_, i) => rnd(1800, i)),
    instagram: labels.map((_, i) => rnd(3200, i)),
    website: labels.map((_, i) => rnd(5000, i)),
  };
}

// Main Dashboard Component (cleaned)
const CodeyatriDashboard = ({ onLogout }) => {
  const { width } = useWindowSize();

  const [metrics, setMetrics] = useState({
    whatsapp: 4250,
    linkedin: 2890,
    instagram: 8500,
    website: 12500,
  });

  const incrementMetric = (key, amount = 1) =>
    setMetrics(prev => ({ ...prev, [key]: Math.max(0, Math.round((Number(prev[key]) || 0) + amount)) }));
  const decrementMetric = (key, amount = 1) => incrementMetric(key, -amount);

  const [projects, setProjects] = useState({ active: [], planning: [], completed: [], paused: [] });
  // try to hydrate events from localStorage immediately so calendar highlights persist on reload
  const [events, setEvents] = useState(() => {
    try {
      const raw = localStorage.getItem('cy_events_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { /* ignore parse error */ }
    return { upcoming: [], this_week: [], completed: [], cancelled: [] };
  });

  // persist events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('cy_events_v1', JSON.stringify(events));
    } catch (e) { /* ignore storage errors */ }
  }, [events]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // popup shown when user clicks a date that has one or more events:
  // { date: 'YYYY-MM-DD', events: [ ... ] } or null
  const [datePopup, setDatePopup] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMessage, setCalendarMessage] = useState('');
  const [editProject, setEditProject] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [googleEventsFetched, setGoogleEventsFetched] = useState(false);

  const resetModals = () => {
    setSelectedProject(null); setSelectedEvent(null); setShowNewProjectForm(false);
    setShowNewEventForm(false); setEditProject(null); setSelectedDate(null);
  };

  // --- network helpers (parseJsonResponse, fetchFromSheetUrl, updateSheetUrl, deleteFromSheet) ---
  async function parseJsonResponse(response) {
    try {
      const text = await response.text();
      if (!text) return null;
      try { return JSON.parse(text); } catch {
        if (text.includes("\n") && text.includes(",")) {
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length >= 2) {
            const headers = lines[0].split(",").map(h => h.trim());
            return lines.slice(1).map(line => {
              const cols = line.split(",").map(c => c.trim());
              const obj = {};
              headers.forEach((h, i) => obj[h] = cols[i] ?? "");
              return obj;
            });
          }
        }
        return text;
      }
    } catch (err) {
      console.error('parseJsonResponse error', err);
      return null;
    }
  }

  async function fetchFromSheetUrl(sheetUrl) {
    try {
      const url = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=get';
      const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      const parsed = await parseJsonResponse(res);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && parsed.data && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && typeof parsed === 'object') {
        for (const k of Object.keys(parsed)) if (Array.isArray(parsed[k])) return parsed[k];
      }
      setCalendarMessage('Sheet returned no usable data.'); setTimeout(() => setCalendarMessage(''), 4000);
      return [];
    } catch (err) {
      console.error('fetchFromSheetUrl error', err);
      setCalendarMessage('Failed to fetch from Sheet (console).'); setTimeout(() => setCalendarMessage(''), 4000);
      return [];
    }
  }

  async function updateSheetUrl(sheetUrl, projectData) {
    try {
      const urlWithAction = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'action=update';
      const res = await fetch(urlWithAction, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectData)
      });
      if (res.ok) {
        try {
          const parsed = await parseJsonResponse(res);
          if (parsed && (parsed.success === true || parsed.results)) return true;
        } catch { /* ignore */ }
      }
    } catch (err) { /* ignore */ }
    try {
      const q = (sheetUrl.includes('?') ? '&' : '?') + 'action=update&data=' + encodeURIComponent(JSON.stringify(projectData));
      const res2 = await fetch(sheetUrl + q, { method: 'GET', mode: 'cors' });
      if (res2.ok) return true;
    } catch (err) { /* ignore */ }
    setCalendarMessage('Failed to sync to Sheet (see console).'); setTimeout(() => setCalendarMessage(''), 4000);
    return false;
  }

  async function deleteFromSheet(type, id) {
    try {
      const q = (SHEET_URL.includes('?') ? '&' : '?') + `type=${encodeURIComponent(type)}&action=delete&id=${encodeURIComponent(id)}`;
      const res = await fetch(SHEET_URL + q, { method: 'GET', mode: 'cors' });
      return res.ok;
    } catch (err) {
      console.error('deleteFromSheet error', err); return false;
    }
  }
  // --- end network helpers ---

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycby1aHvLC2xLiB4LZnlWxGlHvNri0rzpof7mgZ_LRg0Xzqof-bjpB0GHob8BzpgD9Oh0/exec';

  // Initialize projects
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setFetchError('');
      try {
        setCalendarMessage('Loading projects from Sheet...');
        const url = SHEET_URL + "?type=projects&action=get";
        const rows = await fetchFromSheetUrl(url);
        if (!mounted) return;
        const organized = { active: [], planning: [], completed: [], paused: [] };
        if (rows && rows.length) {
          rows.forEach(r => {
            const project = {
               id: String(r.id || r.ID || "").trim() || String(Date.now() + Math.random()),
               title: r.title || r.name || r.Title || '',
               lead: r.lead || r.Leader || r.leadName || '',
               priority: r.priority || 'medium',
               description: r.description || '',
               status: (r.status || 'planning').toString().toLowerCase(),
               phase: r.phase || 'MVP',
               githubrepo: r.githubrepo || r.github || '',
               phone: r.phone || ''
             };
            if (organized[project.status]) organized[project.status].push(project);
          });
        }
        setProjects(organized); setCalendarMessage('');
      } catch (err) {
        setFetchError('Failed to load projects from Sheet.'); setCalendarMessage('Failed to load projects from Sheet (console).');
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Initialize events
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setFetchError('');
      try {
        setCalendarMessage('Loading events from Sheet...');
        const url = SHEET_URL + "?type=events&action=get";
        const rows = await fetchFromSheetUrl(url);
        const organizedEvents = { upcoming: [], this_week: [], completed: [], cancelled: [] };
        if (rows && rows.length) {
          rows.forEach(r => {
            const event = {
              id: String(r.id || r.ID || "").trim() || String(Date.now() + Math.random()),
              title: r.title || '',
              description: r.description || '',
              date: r.date || '',
              status: (r.status || 'upcoming').toLowerCase(),
              eventtype: r.eventtype || r.type || '',
              participants: r.participants || r.participant || r.expectedParticipants || ''
            };
            if (organizedEvents[event.status]) organizedEvents[event.status].push(event);
          });
        }
        // merge fetched events with any existing (persisted) events to preserve highlights
        setEvents(prev => {
          const next = { ...prev };
          Object.keys(organizedEvents).forEach(col => {
            next[col] = Array.isArray(next[col]) ? next[col].slice() : [];
            (organizedEvents[col] || []).forEach(ev => {
              if (!next[col].some(e => String(e.id) === String(ev.id))) next[col].push(ev);
            });
          });
          return next;
        });
        setCalendarMessage('');
      } catch (err) {
        setFetchError('Failed to load events from Sheet.'); setCalendarMessage('Failed to load events from Sheet (console).');
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);


  // Instagram metric
  // Instagram metric
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const num = await fetchInstagramFollowers();
        if (!mounted) return;
        if (typeof num === 'number' && Number.isFinite(num)) setMetrics(prev => ({ ...prev, instagram: num }));
      } catch (err) { console.warn('fetchInstagramFollowers failed', err); }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch website visitor stats from Flask backend
  useEffect(() => {
    async function fetchWebsiteVisitors() {
      try {
        const res = await fetch("https://dashboard-render-3.onrender.com/api/visitors");
        const data = await res.json();
        // Expecting: { total: number, weekly: number }
        if (typeof data.total === "number") {
          setMetrics(prev => ({
            ...prev,
            website: data.total
          }));
        }
        // Optionally store weekly visitors for description
        setWebsiteWeekly(data.weekly || 0);
      } catch (err) {
        // fallback: do nothing or set error
      }
    }
    fetchWebsiteVisitors();
  }, []);

  // Store weekly visitors for description
  const [websiteWeekly, setWebsiteWeekly] = useState(0);

  // Drag & drop hook
  const dragHandlers = useDragDrop();

  function getEventsForDate(dateStr) {
    const all = [];
    Object.keys(events).forEach(blockId => {
      (events[blockId] || []).forEach(ev => { if (ev && ev.date === dateStr) all.push({ ...ev, blockId }); });
    });
    return all;
  }

  function handleDateClick(dateStr) {
    const eventsForDate = getEventsForDate(dateStr);
    if (eventsForDate.length > 0) {
      // show a small popup listing all events on this date; user can click a name to view details
      setDatePopup({ date: dateStr, events: eventsForDate });
    } else {
      // creation from calendar clicks is disabled.
      setSelectedDate(dateStr);
      setCalendarMessage('Creating events from the calendar is disabled. Use "+ New Event" to add events.');
      setTimeout(() => setCalendarMessage(''), 3000);
      // do NOT open the NewEventForm modal here
    }
  }

  function handleProjectMove(item, sourceColumn, targetColumn) {
    if (sourceColumn === targetColumn) return;
    setProjects(prev => {
      const next = { ...prev };
      next[sourceColumn] = (next[sourceColumn] || []).filter(p => p.id !== item.id);
      const updated = { ...item, status: targetColumn };
      next[targetColumn] = [...(next[targetColumn] || []), updated];
      const sheetUrl = SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=projects';
      updateSheetUrl(sheetUrl, { id: String(item.id).trim(), title: updated.title, lead: updated.lead, priority: updated.priority, description: updated.description, status: targetColumn })
        .then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync project move to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } })
        .catch(err => console.error('updateSheetUrl error', err));
      return next;
    });
    if (targetColumn === 'completed') { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }
  }

  function handleEventMove(item, sourceBlock, targetBlock) {
    if (sourceBlock === targetBlock) return;
    setEvents(prev => {
      const next = { ...prev };
      next[sourceBlock] = (next[sourceBlock] || []).filter(e => e.id !== item.id);
      const updated = { ...item, status: targetBlock };
      next[targetBlock] = [...(next[targetBlock] || []), updated];
      const sheetUrl = SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=events';
      updateSheetUrl(sheetUrl, { id: String(item.id).trim(), title: updated.title, description: updated.description, date: updated.date, status: targetBlock, eventtype: updated.eventtype || '', participants: updated.participants || '' })
        .then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync event move to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } })
        .catch(err => console.error('updateSheetUrl error', err));
      return next;
    });
  }

  function handleEditEvent(eventData) {
    setEvents(prev => {
      const next = {};
      Object.keys(prev).forEach(col => { next[col] = prev[col].filter(e => e.id !== eventData.id); });
      const status = eventData.status || 'upcoming'; if (!next[status]) next[status] = []; next[status].push(eventData);
      return next;
    });
    updateSheetUrl(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=events', eventData)
      .then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync event edit to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } })
      .catch(err => console.error('updateSheetUrl error', err));
    setEditEvent(null); setSelectedEvent(null);
  }

  function handleDeleteEvent(eventId) {
    setEvents(prev => {
      const next = {}; Object.keys(prev).forEach(col => { next[col] = prev[col].filter(e => e.id !== eventId); }); return next;
    });
    deleteFromSheet('events', String(eventId).trim()).then(ok => { if (!ok) { setCalendarMessage('Warning: failed to delete event from Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } }).catch(err => console.error('deleteFromSheet error', err));
    setSelectedEvent(null);
  }

  function handleEditProject(projectData) {
    setProjects(prev => {
      const next = {}; Object.keys(prev).forEach(col => { next[col] = prev[col].filter(p => p.id !== projectData.id); });
      const status = projectData.status || 'planning'; if (!next[status]) next[status] = []; next[status].push(projectData);
      return next;
    });
    updateSheetUrl(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=projects', projectData)
      .then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync project edit to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } })
      .catch(err => console.error('updateSheetUrl error', err));
    setEditProject(null);
  }

  function handleDeleteProject(projectId) {
    setProjects(prev => {
      const next = {}; Object.keys(prev).forEach(col => { next[col] = prev[col].filter(p => p.id !== projectId); }); return next;
    });
    deleteFromSheet('projects', String(projectId).trim()).then(ok => { if (!ok) { setCalendarMessage('Warning: failed to delete project from Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } }).catch(err => console.error('deleteFromSheet error', err));
    setSelectedProject(null);
    setEditProject(null);
  }

  function handleNewProject(projectData) {
    const newProject = { ...projectData, id: String(Date.now()) };
    setProjects(prev => ({ ...prev, [newProject.status || 'planning']: [...(prev[newProject.status || 'planning'] || []), newProject] }));
    updateSheetUrl(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=projects', newProject)
      .then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync new project to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } })
      .catch(err => console.error('updateSheetUrl error', err));
    setShowNewProjectForm(false);
  }

  function handleNewEvent(eventData) {
    const newEvent = { ...eventData, id: String(Date.now()) };
    setEvents(prev => ({ ...prev, [eventData.status]: [...(prev[eventData.status] || []), newEvent] }));
    updateSheetUrl(SHEET_URL + (SHEET_URL.includes('?') ? '&' : '?') + 'type=events', {
      id: newEvent.id, title: newEvent.title, description: newEvent.description, date: newEvent.date, status: newEvent.status, eventType: newEvent.eventType || '', participants: newEvent.participants || ''
    }).then(ok => { if (!ok) { setCalendarMessage('Warning: failed to sync new event to Sheet.'); setTimeout(() => setCalendarMessage(''), 4000); } }).catch(err => console.error('updateSheetUrl error', err));
    setShowNewEventForm(false); setSelectedDate(null);
  }

  const [timeSeries] = useState(() => generateTimeSeries());

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {loading && <div className="w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse mb-4"></div>}
      {fetchError && <div className="bg-red-700 text-white p-4 rounded-xl mb-4 text-center font-bold">{fetchError}</div>}

      <header className="border-b border-cyan-500/20 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <motion.div initial={{ y: 0 }} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.9, repeat: Infinity }} whileHover={{ rotateY: 24, rotateX: -8, scale: 1.12, y: -4 }} className="w-[180px] h-[72px] flex items-center justify-center bg-transparent ml-4">
              <img src="https://www.codeyatri.space/assets/img/Logo-White.png" alt="CodeYatri" className="w-full h-auto object-contain" style={{ maxWidth: 200 }} />
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-slate-400">Last updated</div>
              <div className="text-cyan-400 font-medium">Just now</div>
            </div>
            {onLogout && <button onClick={onLogout} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white">Logout</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          <Metric label="WhatsApp Members" value={metrics.whatsapp} accent="text-green-400" icon="💬" description="↗ +150 this week" onIncrement={() => incrementMetric('whatsapp', 50)} onDecrement={() => decrementMetric('whatsapp', 50)} />
          <Metric label="LinkedIn Followers" value={metrics.linkedin} accent="text-blue-400" icon="💼" description="↗ +89 this week" onIncrement={() => incrementMetric('linkedin', 20)} onDecrement={() => decrementMetric('linkedin', 20)} />
          <Metric label="Instagram Followers" value={metrics.instagram} accent="text-pink-400" icon="📸" description="↗ +234 this week" onIncrement={() => incrementMetric('instagram', 100)} onDecrement={() => decrementMetric('instagram', 100)} />
          <Metric
            label="Website Visitors"
            value={metrics.website}
            accent="text-yellow-400"
            icon="🌐"
            description={`↗ +${websiteWeekly} this week`}
            onIncrement={() => incrementMetric('website', 250)}
            onDecrement={() => decrementMetric('website', 250)}
          />
        </div>
      </header>

      {/* Analytics & Calendar */}
      <section className="flex flex-col gap-8 mt-6 mb-10">
        <div className="w-full h-[350px]">
          <LineChart data={timeSeries} metrics={metrics} />
        </div>
        <div className="w-full h-[600px]">
          <IntegratedCalendar />
        </div>
      </section>

      {/* Projects & Events sections (updated to reference UI) */}
      <section className="rounded-3xl p-6 border border-cyan-500/20 bg-gradient-to-br from-slate-900/30 to-slate-800/30 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Development Projects
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewProjectForm(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-cyan-500/25"
          >
            + New Project
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {projectColumns.map(col => (
            <ProjectColumn
              key={col.id}
              id={col.id}
              title={col.title}
              count={projects[col.id]?.length || 0}
              items={projects[col.id] || []}
              onSelect={setSelectedProject}
              onMove={handleProjectMove}
              dragHandlers={dragHandlers}
            />
          ))}
        </div>
        {Object.values(projects).flat().length === 0 && !loading && (
          <div className="text-center text-slate-400 mt-8 text-lg font-bold">
            No projects found. Click "+ New Project" to add one.
          </div>
        )}
      </section>

      <section className="rounded-3xl p-6 border border-cyan-500/20 bg-gradient-to-br from-slate-900/30 to-slate-800/30 backdrop-blur-xl mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Community Events
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewEventForm(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium shadow-lg hover:shadow-purple-500/25"
          >
            + New Event
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <EventColumn
            id="this_week"
            title="This Week"
            count={events.this_week?.length || 0}
            items={events.this_week || []}
            onSelect={item => setSelectedEvent({ ...item, kind: 'this_week' })}
            onMove={handleEventMove}
            dragHandlers={dragHandlers}
          />
          <EventColumn
            id="upcoming"
            title="Upcoming"
            count={events.upcoming?.length || 0}
            items={events.upcoming || []}
            onSelect={item => setSelectedEvent({ ...item, kind: 'upcoming' })}
            onMove={handleEventMove}
            dragHandlers={dragHandlers}
          />
          <EventColumn
            id="completed"
            title="Completed"
            count={events.completed?.length || 0}
            items={events.completed || []}
            onSelect={item => setSelectedEvent({ ...item, kind: 'completed' })}
            onMove={handleEventMove}
            dragHandlers={dragHandlers}
          />
          <EventColumn
            id="cancelled"
            title="Cancelled"
            count={events.cancelled?.length || 0}
            items={events.cancelled || []}
            onSelect={item => setSelectedEvent({ ...item, kind: 'cancelled' })}
            onMove={handleEventMove}
            dragHandlers={dragHandlers}
          />
        </div>

        {Object.values(events).flat().length === 0 && !loading && (
          <div className="text-center text-slate-400 mt-8 text-lg font-bold">
            No events found. Click "+ New Event" to add one.
          </div>
        )}
      </section>

      {/* Detail modals updated to reference layout */}
      <AnimatePresence>
        {selectedProject && (
          <Modal onClose={() => setSelectedProject(null)} zIndex={70}>
            <div className="p-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
                  <div className="text-sm text-slate-400">Lead: <span className="font-medium text-slate-200">{selectedProject.lead}</span></div>
                </div>
                <button type="button" onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Phase</label>
                  <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">
                    {selectedProject.phase?.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Priority</label>
                  <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">
                    {selectedProject.priority}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Github Repo Link</label>
                  <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-cyan-300 break-words">
                    {selectedProject.githubrepo ? (
                      <a href={selectedProject.githubrepo} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
                        {selectedProject.githubrepo}
                      </a>
                    ) : <span className="text-slate-400">—</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Phone</label>
                  <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">
                    {selectedProject.phone || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Description</label>
                  <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-auto">
                    {selectedProject.description || "No description provided."}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700 mt-6">
                <div>
                  <div className="text-sm text-slate-400">Created</div>
                  <div className="text-slate-200">2 weeks ago</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Last Update</div>
                  <div className="text-slate-200">3 days ago</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <motion.button onClick={() => setSelectedProject(null)} whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">Close</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors" onClick={() => { setEditProject(selectedProject); setSelectedProject(null); }}>Edit</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} className="px-3 py-1 rounded-lg bg-red-600/80 text-sm hover:bg-red-600 transition-colors" onClick={() => handleDeleteProject(selectedProject.id)}>Delete</motion.button>
              </div>
            </div>
          </Modal>
        )}

        {selectedEvent && (
          <Modal onClose={() => setSelectedEvent(null)} zIndex={70}>
            <div className="p-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xl font-bold text-white mb-2">{selectedEvent.title}</div>
                  <div className="text-sm text-slate-400 mb-1">{formatDateStr(selectedEvent.date)}</div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedEvent.kind === 'upcoming' ? 'bg-cyan-500/20 text-cyan-300' :
                      selectedEvent.kind === 'this_week' ? 'bg-purple-500/20 text-purple-300' :
                        selectedEvent.kind === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-red-500/20 text-red-300'
                    }`}>
                    {selectedEvent.kind?.replace('_', ' ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} className="px-3 py-1 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors" onClick={() => { setEditEvent(selectedEvent); setSelectedEvent(null); }}>Edit</motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleDeleteEvent(selectedEvent.id)} className="px-3 py-1 rounded-lg bg-red-600/80 text-sm hover:bg-red-600 transition-colors">Delete</motion.button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Description</div>
                  <div className="text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-auto">{selectedEvent.description || "No description provided."}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <div className="text-sm text-slate-400">Event Type</div>
                    <div className="text-slate-200">{selectedEvent.eventtype || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Expected Participants</div>
                    <div className="text-slate-200">{selectedEvent.participants || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <motion.button onClick={() => setSelectedEvent(null)} whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">Close</motion.button>
              </div>
            </div>
          </Modal>
        )}

        {/* Date click list modal: shows event names for the clicked date */}
        {datePopup && (
          <Modal onClose={() => setDatePopup(null)} zIndex={80}>
            <div className="p-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Events on {formatDateStr(datePopup.date)}</h3>
                <button type="button" onClick={() => setDatePopup(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-2">
                {datePopup.events.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEvent({ ...ev, kind: ev.blockId }); setDatePopup(null); }}
                    className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="font-medium text-white">{ev.title || 'Untitled Event'}</div>
                    <div className="text-xs text-slate-400">{formatDateStr(ev.date)}</div>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {editProject && (
          <Modal onClose={() => setEditProject(null)} zIndex={70}>
            <NewProjectForm initialData={editProject} onSubmit={(payload) => { handleEditProject(payload); setEditProject(null); }} onCancel={() => setEditProject(null)} />
          </Modal>
        )}
        {showNewProjectForm && (
          <Modal onClose={() => setShowNewProjectForm(false)} zIndex={70}>
            <NewProjectForm onSubmit={(payload) => { handleNewProject(payload); setShowNewProjectForm(false); }} onCancel={() => setShowNewProjectForm(false)} />
          </Modal>
        )}
        {editEvent && <Modal onClose={() => setEditEvent(null)}><NewEventForm onSubmit={handleEditEvent} onCancel={() => setEditEvent(null)} initialData={editEvent} /></Modal>}
        {showNewEventForm && <Modal onClose={() => { setShowNewEventForm(false); setSelectedDate(null); }}><NewEventForm onSubmit={handleNewEvent} onCancel={() => { setShowNewEventForm(false); setSelectedDate(null); }} preselectedDate={selectedDate} /></Modal>}
      </AnimatePresence>

      <CustomConfetti show={showConfetti} />
    </div>
  );
};

// project column definitions
const projectColumns = [
  { id: 'active', title: 'Active' },
  { id: 'planning', title: 'Planning' },
  { id: 'completed', title: 'Completed' },
  { id: 'paused', title: 'Paused' }
];

// App wrapper
const App = () => {
  const [auth, setAuth] = useState({ loggedIn: false, user: null, token: null });
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (username, password) => {
    setAuthLoading(true);
    try {
      const res = await fetch("https://dashboard-render-3.onrender.com/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.authenticated === true)) setAuth({ loggedIn: true, user: data.user || username, token: data.token || null });
      else alert(data.message || data.error || "Invalid credentials");
    } catch (err) {
      console.error("Login error", err); alert("Failed to connect to auth server.");
    } finally { setAuthLoading(false); }
  };

  const handleLogout = () => setAuth({ loggedIn: false, user: null, token: null });

  if (!auth.loggedIn) return <LoginPage onLogin={handleLogin} />;
  return <CodeyatriDashboard onLogout={handleLogout} />;
};

export default App;

