from flask import Flask, jsonify, request
from flask_cors import CORS
from middleware import log_visitor
from models import Visitor, db
import os

app = Flask(__name__)
CORS(app)

# Configure the SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db/visitors.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# Middleware to log visitor entries
@app.before_request
def before_request():
    log_visitor(request)

# Route to return visitor statistics
@app.route('/api/visitors', methods=['GET'])
def get_visitor_statistics():
    total_visitors = Visitor.query.count()
    return jsonify({"total_visitors": total_visitors}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)