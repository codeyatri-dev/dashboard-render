import React, { useState } from "react";
import { motion } from "framer-motion";

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Please enter username and password');
      return;
    }
    setError('');
    onLogin(credentials.username, credentials.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/20 rounded-2xl shadow-2xl p-8 w-full max-w-sm"
        >
          <div className="flex justify-center mb-8">
            <motion.img
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              src="https://www.codeyatri.space/assets/img/Logo-White.png"
              alt="CodeYatri"
              className="w-24 h-24 object-contain"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username"
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Sign In
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
