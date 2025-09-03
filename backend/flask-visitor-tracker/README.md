# Flask Visitor Tracker

This project is a simple Flask application that tracks website visitors using an SQLite database. It logs visitor entries, checks for duplicate requests, and provides statistics about the visitors.

## Project Structure

```
flask-visitor-tracker
├── app.py               # Entry point of the application
├── models.py            # Database model for visitor information
├── middleware.py        # Middleware to log visitor entries
├── requirements.txt     # Project dependencies
├── README.md            # Project documentation
└── db
    └── visitors.db      # SQLite database file for storing visitor data
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd flask-visitor-tracker
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```
   python app.py
   ```

The application will start on `http://127.0.0.1:5000`.

## Usage

- The application logs each visitor's IP address, user agent, and timestamp.
- Visit the endpoint `/api/visitors` to retrieve visitor statistics.

## Visitor Statistics

The `/api/visitors` endpoint returns the total number of unique visitors and their details.

## License

This project is licensed under the MIT License.