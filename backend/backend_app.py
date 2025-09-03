# backend_app.py
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_socketio import SocketIO
import json, os, sqlite3
from urllib.parse import urlparse
from datetime import datetime, timedelta, timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build
import instagram

print(f"Instagram module loaded: {hasattr(instagram, 'get_exact_followers')}, PROFILE_URLS={getattr(instagram, 'PROFILE_URLS', None)}")

# ------------------------------
# Flask App Setup
# ------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Use eventlet for production-friendly SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ------------------------------
# SQLite Visitor DB Setup
# ------------------------------
VISITOR_DB = os.path.join(os.path.dirname(__file__), "visitors.db")

def get_db():
    db = getattr(g, '_visitor_db', None)
    if db is None:
        db = g._visitor_db = sqlite3.connect(VISITOR_DB, isolation_level=None)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA journal_mode=DELETE")
    return db

def init_db():
    db = sqlite3.connect(VISITOR_DB, isolation_level=None)
    db.execute("PRAGMA journal_mode=DELETE")
    db.execute("""
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            user_agent TEXT,
            timestamp DATETIME NOT NULL
        )
    """)
    db.commit()
    db.close()

init_db()

@app.teardown_appcontext
def close_db(error):
    db = getattr(g, '_visitor_db', None)
    if db is not None:
        db.close()

# ------------------------------
# Visitor Middleware
# ------------------------------
@app.before_request
def log_visitor():
    if request.method != "GET" or request.path.startswith("/static"):
        return
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    ua = request.headers.get("User-Agent", "")
    now = datetime.now(timezone.utc)
    db = get_db()
    ten_min_ago = now - timedelta(minutes=10)
    cur = db.execute(
        "SELECT 1 FROM visitors WHERE ip_address=? AND timestamp>=?",
        (ip, ten_min_ago.strftime("%Y-%m-%d %H:%M:%S"))
    )
    if cur.fetchone() is None:
        db.execute(
            "INSERT INTO visitors (ip_address, user_agent, timestamp) VALUES (?, ?, ?)",
            (ip, ua, now.strftime("%Y-%m-%d %H:%M:%S"))
        )
        db.commit()
        print(f"Visitor logged: {ip} - {ua} - {now}")

@app.route("/api/visitors", methods=["GET"])
def visitor_stats():
    db = get_db()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    total = db.execute("SELECT COUNT(*) FROM visitors").fetchone()[0]
    today = db.execute("SELECT COUNT(*) FROM visitors WHERE timestamp>=?", (today_start.strftime("%Y-%m-%d %H:%M:%S"),)).fetchone()[0]
    week = db.execute("SELECT COUNT(*) FROM visitors WHERE timestamp>=?", (week_start.strftime("%Y-%m-%d %H:%M:%S"),)).fetchone()[0]
    return jsonify({"total": total, "today": today, "week": week})

# ------------------------------
# Instagram API
# ------------------------------
@app.route("/api/followers", methods=["GET"])
def fetch_followers():
    now = datetime.now()
    use_exact = (now - instagram.last_exact_fetch).total_seconds() >= instagram.EXACT_FETCH_INTERVAL_HOURS * 3600
    url = instagram.PROFILE_URLS[0]
    username = urlparse(url).path.strip("/").split("/")[0]
    count = instagram.run_coro(instagram.get_exact_followers(url) if use_exact else instagram.get_public_followers(url))
    if use_exact:
        instagram.last_exact_fetch = now
    count_int = 0
    try:
        count_int = int(str(count).replace(",", "")) if count else 0
    except:
        pass
    instagram.save_follower_history(username, count_int)
    return str(count_int), 200, {"Content-Type": "text/plain; charset=utf-8"}

@app.route("/api/followers/history", methods=["GET"])
def fetch_follower_history():
    if not os.path.exists(instagram.HISTORY_FILE):
        return {}
    with open(instagram.HISTORY_FILE, 'r') as f:
        return json.load(f)

@app.route("/api/followers/<username>", methods=["GET"])
def get_profile_followers(username):
    now = datetime.now()
    url = f"https://www.instagram.com/{username}/"
    use_exact = (now - instagram.last_exact_fetch).total_seconds() >= instagram.EXACT_FETCH_INTERVAL_HOURS * 3600
    count = instagram.run_coro(instagram.get_exact_followers(url) if use_exact else instagram.get_public_followers(url))
    if use_exact:
        instagram.last_exact_fetch = now
    count_int = 0
    try:
        count_int = int(str(count).replace(",", "")) if count else 0
    except:
        pass
    instagram.save_follower_history(username, count_int)
    return str(count_int), 200, {"Content-Type": "text/plain; charset=utf-8"}

# ------------------------------
# Login API
# ------------------------------
creds = {}
try:
    with open("credentials.json", "r") as f:
        creds = json.load(f)
except:
    creds = {}

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if data.get("username") == creds.get("username") and data.get("password") == creds.get("password"):
        return jsonify({"success": True, "message": "Login successful"})
    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route("/login", methods=["GET"])
def login_info():
    return jsonify({"message": "Login API is running. Use POST request."})

# ------------------------------
# Google Calendar API
# ------------------------------
SCOPES = ['https://www.googleapis.com/auth/calendar']
SERVICE_ACCOUNT_FILE = 'abstract-banner-469311-p3-1aed959a2771.json'

service = None
calendar_id = None
try:
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build('calendar', 'v3', credentials=credentials)
    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", calendar_id)
except Exception as e:
    print(f"Warning: Google Calendar service not initialized: {e}")

@app.route('/events', methods=['GET'])
def get_events():
    if service is None:
        return jsonify({'error': 'Google Calendar service not configured'}), 500
    now = datetime.now(timezone.utc).isoformat()
    events_result = service.events().list(calendarId=calendar_id, timeMin=now, maxResults=20, singleEvents=True, orderBy='startTime').execute()
    return jsonify(events_result.get('items', []))

@app.route('/events', methods=['POST'])
def add_event():
    if service is None:
        return jsonify({'error': 'Google Calendar service not configured'}), 500
    event_data = request.get_json(force=True)
    event = service.events().insert(calendarId=calendar_id, body=event_data).execute()
    return jsonify(event)

@app.route('/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    event_data = request.json
    event = service.events().update(calendarId=calendar_id, eventId=event_id, body=event_data).execute()
    return jsonify(event)

@app.route('/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
    return jsonify({'success': True})

# ------------------------------
# Root
# ------------------------------
@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Unified Backend API is running"})

# ------------------------------
# Run App (Render ready)
# ------------------------------
if __name__ == "__main__":
    import eventlet
    port = int(os.environ.get("PORT", 8000))
    socketio.run(app, host="0.0.0.0", port=port)
