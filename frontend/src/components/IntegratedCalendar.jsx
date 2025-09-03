import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

// --- Helpers ---
const formatLocalDate = (d) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt)) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD (local, no UTC shift)
};

const addDays = (ymd, n = 1) => {
  const dt = new Date(`${ymd}T00:00:00`);
  dt.setDate(dt.getDate() + n);
  return formatLocalDate(dt);
};

function IntegratedCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [addingEvent, setAddingEvent] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -- Load events from backend
  const loadEvents = () => {
    fetch("http://localhost:8000/events")
      .then((res) => res.json())
      .then((data) => {
        const googleEvents = (Array.isArray(data) ? data : []).map((e) => ({
          id: e.id,
          title: e.summary,
          start: e.start.date ?? e.start.dateTime,
          end: e.end?.date ?? e.end?.dateTime,
          allDay: Boolean(e.start.date),
          details: e,
        }));
        setEvents(googleEvents);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setError("Failed to load events.");
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // -- Helpers
  const getEventsForDate = (dateStr) => {
    return events.filter((ev) => {
      const start = formatLocalDate(ev.start);
      const end = ev.end ? formatLocalDate(ev.end) : null;

      if (ev.allDay) {
        return end ? (dateStr >= start && dateStr < end) : start === dateStr;
      }
      return start === dateStr;
    });
  };

  const getEventTitlesForDate = (dateStr) => {
    return getEventsForDate(dateStr).map((ev) => ev.title || ev.details?.summary || "");
  };

  function renderDayCell(info) {
    const dateStr = formatLocalDate(info.date); 
    const eventList = getEventTitlesForDate(dateStr);

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Date number */}
        <span>{info.dayNumberText}</span>

        {/* Multiple highlights */}
        {eventList.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap justify-center">
            {eventList.slice(0, 3).map((_, idx) => (
              <span key={idx} className="w-2 h-2 rounded-full bg-cyan-400"></span>
            ))}
            {eventList.length > 3 && (
              <span className="text-[10px] text-gray-500">
                +{eventList.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  const handleDateClick = (info) => {
    const ymd = info.dateStr;
    setSelectedDateStr(ymd);
    setSelectedEvents(getEventsForDate(ymd));
    setShowModal(true);
    setEditingEvent(null);
    setAddingEvent(false);
  };

  const handleEventClick = (info) => {
    const clicked = events.find((e) => e.id === info.event.id);
    if (!clicked) return;
    const ymd = formatLocalDate(clicked.start);
    setSelectedDateStr(ymd);
    setSelectedEvents([clicked]);
    setShowModal(true);
    setEditingEvent(clicked);
    setAddingEvent(false);
    setFormData({
      title: clicked.details.summary || "",
      description: clicked.details.description || "",
      date:
        clicked.details.start?.date ??
        (clicked.details.start?.dateTime
          ? clicked.details.start.dateTime.split("T")[0]
          : formatLocalDate(clicked.start)) ??
        "",
    });
  };

  useEffect(() => {
    if (selectedDateStr) {
      setSelectedEvents(getEventsForDate(selectedDateStr));
    }
  }, [events, selectedDateStr]);

  const saveAdd = async () => {
    if (!formData.title || !formData.date) return;
    setSaving(true);
    setError("");

    const payload = {
      summary: formData.title,
      description: formData.description,
      start: { date: formData.date },
      end: { date: addDays(formData.date, 1) },
    };

    try {
      const res = await fetch("http://localhost:8000/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newE = await res.json();

      setEvents((prev) => [
        ...prev,
        {
          id: newE.id,
          title: newE.summary,
          start: newE.start.date,
          end: newE.end?.date,
          allDay: true,
          details: newE,
        },
      ]);
      setAddingEvent(false);
      setEditingEvent(null);
      setFormData({ title: "", description: "", date: "" });
      setShowModal(false);
    } catch (err) {
      console.error("Add failed:", err);
      setError("Failed to add event.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editingEvent) return;
    setSaving(true);
    setError("");

    const payload = {
      summary: formData.title,
      description: formData.description,
      start: { date: formData.date },
      end: { date: addDays(formData.date, 1) },
    };

    try {
      const res = await fetch(
        `http://localhost:8000/events/${editingEvent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEvent.id
            ? {
                id: updated.id,
                title: updated.summary,
                start: updated.start.date,
                end: updated.end?.date,
                allDay: true,
                details: updated,
              }
            : ev
        )
      );
      setAddingEvent(false);
      setEditingEvent(null);
      setFormData({ title: "", description: "", date: "" });
      setShowModal(false);
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to update event.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (ev) => {
    try {
      const res = await fetch(`http://localhost:8000/events/${ev.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadEvents();
      setShowModal(false);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete event.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-2">
      <div className="rounded-xl">
      <h3 className="text-xs font-semibold text-cyan-300 opacity-80 tracking-wide mb-2">
        Calendar
      </h3>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={600}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        dayCellContent={renderDayCell}
        themeSystem="standard"
      />
      </div>


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-2xl w-[380px] max-h-[70vh] overflow-y-auto relative">
            <button
              className="absolute top-3 right-4 text-slate-400 hover:text-cyan-400 text-xl"
              onClick={() => {
                setShowModal(false);
                setEditingEvent(null);
                setAddingEvent(false);
                setError("");
              }}
            >
              ✕
            </button>
            <div className="mb-3">
              <div className="text-xs text-slate-400">Date</div>
              <div className="font-semibold text-cyan-300">
                {selectedDateStr}
              </div>
            </div>
            {error && (
              <div className="mb-3 p-2 rounded-xl bg-red-700 text-white text-sm font-bold">
                {error}
              </div>
            )}
            <div className="space-y-2 mb-3">
              {selectedEvents.length === 0 ? (
                <div className="text-slate-400">No events on this date.</div>
              ) : (
                selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2 rounded bg-slate-800 flex flex-col gap-1"
                  >
                    <div className="font-semibold text-cyan-300">
                      {ev.title || ev.details?.summary || "Untitled Event"}
                    </div>
                    {ev.details?.description && (
                      <div className="text-xs text-slate-200">
                        {ev.details.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                        onClick={() => {
                          setEditingEvent(ev);
                          setAddingEvent(false);
                          setFormData({
                            title: ev.title || ev.details?.summary || "",
                            description: ev.details?.description || "",
                            date: formatLocalDate(ev.start),
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                        onClick={() => deleteEvent(ev)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!addingEvent && !editingEvent && (
              <button
                className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-cyan-600 text-white font-medium shadow hover:shadow-green-500/25 transition-all"
                onClick={() => {
                  setAddingEvent(true);
                  setEditingEvent(null);
                  setFormData({
                    title: "",
                    description: "",
                    date: selectedDateStr,
                  });
                }}
              >
                + Add Event
              </button>
            )}

            {(addingEvent || editingEvent) && (
              <div className="space-y-3 mt-4">
                <input
                  type="text"
                  className="w-full border border-cyan-500/30 bg-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <textarea
                  className="w-full border border-cyan-500/30 bg-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  rows={3}
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="w-full border border-cyan-500/30 bg-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
                <div className="flex gap-2 pt-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow hover:shadow-cyan-500/25 transition-all"
                    onClick={editingEvent ? saveEdit : saveAdd}
                    disabled={saving || !formData.title || !formData.date}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-all"
                    onClick={() => {
                      setEditingEvent(null);
                      setAddingEvent(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegratedCalendar;
