from flask import request
from functools import wraps
import sqlite3
import time

def log_visitor(app):
    @app.before_request
    @wraps(app.before_request)
    def before_request():
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent')
        timestamp = int(time.time())

        # Connect to the SQLite database
        conn = sqlite3.connect('db/visitors.db')
        cursor = conn.cursor()

        # Check for duplicate requests from the same IP address within a 10-minute window
        ten_minutes_ago = timestamp - 600
        cursor.execute("SELECT COUNT(*) FROM visitors WHERE ip_address = ? AND timestamp > ?", (ip_address, ten_minutes_ago))
        count = cursor.fetchone()[0]

        if count == 0:
            # Log the visitor entry
            cursor.execute("INSERT INTO visitors (ip_address, user_agent, timestamp) VALUES (?, ?, ?)",
                           (ip_address, user_agent, timestamp))
            conn.commit()

        conn.close()