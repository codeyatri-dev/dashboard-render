import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PHASES = [
  "MVP",
  "ProductResearch",
  "ResearchPaper",
  "ReadytoLaunch"
];

const NewProjectForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      lead: '',
      priority: 'medium',
      description: '',
      status: 'planning',
      phase: PHASES[0],
      githubrepo: '',
      phone: ''
    }
  );

  // keep form in sync when editing
  useEffect(() => {
    setFormData(initialData || {
      title: '',
      lead: '',
      priority: 'medium',
      description: '',
      status: 'planning',
      phase: PHASES[0],
      githubrepo: '',
      phone: ''
    });
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.lead) {
      onSubmit({
        ...formData,
        id: initialData?.id || Date.now()
      });
    }
  };

  const titleLabel = initialData ? "Edit Project" : "Create New Project";
  const submitText = initialData ? "Save Project" : "Create Project";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" noValidate>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{titleLabel}</h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white">✕</button>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-title">Title</label>
        <input
          id="proj-title"
          name="title"
          autoComplete="off"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
          placeholder="Enter project title..."
          required
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-lead">Project Lead</label>
        <input
          id="proj-lead"
          name="lead"
          autoComplete="off"
          value={formData.lead}
          onChange={(e) => setFormData(prev => ({ ...prev, lead: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
          placeholder="Enter lead name..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-priority">Priority</label>
          <select
            id="proj-priority"
            name="priority"
            value={formData.priority}
            onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-status">Status</label>
          <select
            id="proj-status"
            name="status"
            value={formData.status}
            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-phase">Phase</label>
        <select
          id="proj-phase"
          name="phase"
          value={formData.phase}
          onChange={e => setFormData(prev => ({ ...prev, phase: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
        >
          {PHASES.map(p => (
            <option key={p} value={p}>{p.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-desc">Description</label>
        <textarea
          id="proj-desc"
          name="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white h-28 resize-none"
          placeholder="Short description..."
        />
      </div>

      {/* GitHub + Phone moved above action row for visibility */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-github">GitHub Repo</label>
          <input
            id="proj-github"
            name="githubrepo"
            type="url"
            autoComplete="off"
            value={formData.githubrepo}
            onChange={e => setFormData(prev => ({ ...prev, githubrepo: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
            placeholder="https://github.com/yourrepo"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1" htmlFor="proj-phone">Phone</label>
          <input
            id="proj-phone"
            name="phone"
            type="tel"
            autoComplete="off"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.03 }}
          className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-cyan-500/25"
        >
          {submitText}
        </motion.button>
      </div>
    </form>
  );
};

export default NewProjectForm;
