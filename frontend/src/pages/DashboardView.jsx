import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Metric from "../components/Metric";
import LineChart from "../components/LineChart";
import IntegratedCalendar from "../components/IntegratedCalendar";
import ProjectColumn from "../components/ProjectColumn";
import EventColumn from "../components/EventColumn";
import Modal from "../components/Modal";
import NewProjectForm from "../components/NewProjectForm";
import NewEventForm from "../components/NewEventForm";
import CustomConfetti from "../components/CustomConfetti";

// Presentational page: receives dashboard state & handlers as props
const DashboardView = (props) => {
  const {
    metrics, incrementMetric, decrementMetric,
    timeSeries,
    events, projects,
    projectColumns,
    dragHandlers,
    handleDateClick, getEventsForDate,
    handleProjectMove, handleEventMove,
    selectedProject, selectedEvent,
    editProject, editEvent,
    showNewProjectForm, showNewEventForm,
    setShowNewProjectForm, setShowNewEventForm,
    handleNewProject, handleNewEvent,
    handleEditProject, handleEditEvent,
    handleDeleteProject, handleDeleteEvent,
    showConfetti, onCloseModal, onLogout,
    // added handlers to enable selection from inside this view
    setSelectedProject, setSelectedEvent
  } = props;

  // gradients used for event columns
  const eventGradient = {
    this_week: "from-indigo-600 to-violet-500/20",
    upcoming: "from-cyan-500 to-blue-500/20",
    completed: "from-green-500 to-emerald-500/20",
    cancelled: "from-red-500 to-pink-500/20"
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header + Metrics */}
      <header className="border-b border-cyan-500/20 pb-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <motion.div initial={{ y: 0 }} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.9, repeat: Infinity }} className="w-[180px] h-[72px] flex items-center">
              <img src="https://www.codeyatri.space/assets/img/Logo-White.png" alt="CodeYatri" className="w-full object-contain" style={{ maxWidth: 200 }} />
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <div><div className="text-sm text-slate-400">Last updated</div><div className="text-cyan-400 font-medium">Just now</div></div>
            {onLogout && <button onClick={onLogout} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white">Logout</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Metric label="WhatsApp Members" value={metrics.whatsapp} accent="text-green-400" icon="💬" description="↗ +150 this week" onIncrement={() => incrementMetric('whatsapp', 50)} onDecrement={() => decrementMetric('whatsapp', 50)} />
          <Metric label="LinkedIn Followers" value={metrics.linkedin} accent="text-blue-400" icon="💼" description="↗ +89 this week" onIncrement={() => incrementMetric('linkedin', 20)} onDecrement={() => decrementMetric('linkedin', 20)} />
          <Metric label="Instagram Followers" value={metrics.instagram} accent="text-pink-400" icon="📸" description="↗ +234 this week" onIncrement={() => incrementMetric('instagram', 100)} onDecrement={() => decrementMetric('instagram', 100)} />
          <Metric label="Website Visitors" value={metrics.website} accent="text-yellow-400" icon="🌐" description="↗ +420 this week" onIncrement={() => incrementMetric('website', 250)} onDecrement={() => decrementMetric('website', 250)} />
        </div>
      </header>

      {/* Analytics & Calendar */}
      {/* Analytics & Calendar stacked */}
      <section className="flex flex-col gap-8 mb-6">
        {/* LineChart full width with fixed height */}
        <div className="w-full h-[350px]">
          <LineChart data={timeSeries} metrics={metrics} />
        </div>

        {/* Calendar full width below */}
        <div className="w-full">
          <IntegratedCalendar
            onDateClick={handleDateClick}
            onSelectEvent={(event) => setSelectedEvent(event)}
          />
        </div>
      </section>


      {/* Projects */}
      <section className="rounded-3xl p-6 mb-6 border border-cyan-500/20 bg-gradient-to-br from-slate-900/30 to-slate-800/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Development Projects</h2>
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowNewProjectForm(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white">+ New Project</motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {projectColumns.map(col => (
            <ProjectColumn key={col.id} id={col.id} title={col.title} count={projects[col.id]?.length || 0} items={projects[col.id] || []} onSelect={item => { if (typeof setSelectedProject === 'function') setSelectedProject(item); }} onMove={handleProjectMove} dragHandlers={dragHandlers} />
          ))}
        </div>
        {Object.values(projects).flat().length === 0 && (
          <div className="text-center text-slate-400 mt-6 text-lg font-bold">No projects found. Click "+ New Project" to add one.</div>
        )}
      </section>

      {/* Events */}
      {/* Events */}
      <section className="rounded-3xl p-6 mb-6 border border-cyan-500/20 bg-slate-900/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Community Events</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowNewEventForm(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white"
          >
            + New Event
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className={`rounded-2xl p-4 bg-gradient-to-br ${eventGradient.this_week}`}>
            <EventColumn
              id="this_week"
              title="This Week"
              count={events.this_week?.length || 0}
              items={events.this_week || []}
              onSelect={item => setSelectedEvent({ ...item, kind: 'this_week' })}
              onMove={handleEventMove}
              dragHandlers={dragHandlers}
            />
          </div>

          <div className={`rounded-2xl p-4 bg-gradient-to-br ${eventGradient.upcoming}`}>
            <EventColumn
              id="upcoming"
              title="Upcoming"
              count={events.upcoming?.length || 0}
              items={events.upcoming || []}
              onSelect={item => setSelectedEvent({ ...item, kind: 'upcoming' })}
              onMove={handleEventMove}
              dragHandlers={dragHandlers}
            />
          </div>

          <div className={`rounded-2xl p-4 bg-gradient-to-br ${eventGradient.completed}`}>
            <EventColumn
              id="completed"
              title="Completed"
              count={events.completed?.length || 0}
              items={events.completed || []}
              onSelect={item => setSelectedEvent({ ...item, kind: 'completed' })}
              onMove={handleEventMove}
              dragHandlers={dragHandlers}
            />
          </div>

          <div className={`rounded-2xl p-4 bg-gradient-to-br ${eventGradient.cancelled}`}>
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
        </div>

        {Object.values(events).flat().length === 0 && (
          <div className="text-center text-slate-400 mt-6 text-lg font-bold">
            No events found. Click "+ New Event" to add one.
          </div>
        )}
      </section>


      {/* Modals and Confetti */}
      <AnimatePresence>
        {selectedProject && <Modal onClose={onCloseModal}><div className="p-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
              <div className="text-sm text-slate-400">Lead: <span className="font-medium text-slate-200">{selectedProject.lead}</span></div>
            </div>
            <button type="button" onClick={onCloseModal} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Phase</label>
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">{selectedProject.phase?.replace('_',' ')}</div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Priority</label>
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">{selectedProject.priority}</div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Github Repo Link</label>
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-cyan-300 break-words">
                {selectedProject.githubrepo ? <a href={selectedProject.githubrepo} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">{selectedProject.githubrepo}</a> : <span className="text-slate-400">—</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Phone</label>
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white">{selectedProject.phone || "—"}</div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Description</label>
              <div className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-auto">{selectedProject.description || "No description provided."}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCloseModal} className="px-4 py-2 bg-white/10 rounded-lg">Close</button>
            <button onClick={() => { handleEditProject(selectedProject); onCloseModal(); }} className="px-4 py-2 bg-white/10 rounded-lg">Edit</button>
            <button onClick={() => { handleDeleteProject(selectedProject.id); onCloseModal(); }} className="px-3 py-1 bg-red-600/80 rounded-lg">Delete</button>
          </div>
        </div></Modal>}

        {selectedEvent && <Modal onClose={onCloseModal}><div className="p-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xl font-bold text-white mb-2">{selectedEvent.title}</div>
              <div className="text-sm text-slate-400 mb-1">{formatDateStr(selectedEvent.date)}</div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedEvent.blockId === 'upcoming' ? 'bg-cyan-500/20 text-cyan-300' : selectedEvent.blockId === 'this_week' ? 'bg-purple-500/20 text-purple-300' : selectedEvent.blockId === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{selectedEvent.blockId?.replace('_',' ') || selectedEvent.status}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { handleEditEvent(selectedEvent); onCloseModal(); }} className="px-3 py-1 rounded-lg bg-white/10 text-sm hover:bg-white/20">Edit</button>
              <button onClick={() => { handleDeleteEvent(selectedEvent.id); onCloseModal(); }} className="px-3 py-1 rounded-lg bg-red-600/80 text-sm hover:bg-red-600">Delete</button>
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
            <button onClick={onCloseModal} className="px-4 py-2 rounded-lg bg-white/10">Close</button>
          </div>
        </div></Modal>}
      </AnimatePresence>

      <CustomConfetti show={showConfetti} />
    </div>
  );
};

export default DashboardView;
