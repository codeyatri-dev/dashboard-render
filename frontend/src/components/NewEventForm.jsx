import React, { useState } from "react";
import { motion } from "framer-motion";

const NewEventForm = ({ onSubmit, onCancel, preselectedDate = null, initialData = null }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      date: preselectedDate || new Date().toISOString().split('T')[0],
      description: '',
      status: 'upcoming',
      eventtype: '',
      participants: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      onSubmit({
        ...formData,
        id: initialData?.id || Date.now()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Create New Event</h2>
        <button type="button" onClick={onCancel} className="text-slate-400">✕</button>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Event Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
          placeholder="Enter event title..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
          >
            <option value="upcoming">Upcoming</option>
            <option value="this_week">This Week</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white h-24 resize-none"
          placeholder="Enter event description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Event Type</label>
          <select
            value={formData.eventtype}
            onChange={(e) => setFormData(prev => ({ ...prev, eventtype: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
          >
            <option value="">Select type</option>
            <option value="Educational">Educational</option>
            <option value="Workshop">Workshop</option>
            <option value="Webinar">Webinar</option>
            <option value="Meetup">Meetup</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Expected Participants</label>
          <input
            type="number"
            min="0"
            value={formData.participants}
            onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
            placeholder="e.g. 200"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.03 }}
          className="px-6 py-2 rounded-xl bg-slate-700 text-white"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white"
        >
          Create Event
        </motion.button>
      </div>
    </form>
  );
};

export default NewEventForm;
