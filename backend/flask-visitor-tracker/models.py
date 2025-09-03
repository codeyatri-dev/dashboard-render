from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Visitor(db.Model):
    __tablename__ = 'visitors'

    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.String(256), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Visitor {self.ip_address} at {self.timestamp}>'

    @staticmethod
    def add_visitor(ip_address, user_agent):
        new_visitor = Visitor(ip_address=ip_address, user_agent=user_agent)
        db.session.add(new_visitor)
        db.session.commit()

    @staticmethod
    def get_visitor_statistics():
        total_visitors = Visitor.query.count()
        return {
            'total_visitors': total_visitors
        }