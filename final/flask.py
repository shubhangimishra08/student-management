from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

# Function to fetch student certificate applications from SQLite
def get_student_data():
    conn = sqlite3.connect("certificates.db")  # Your SQLite database
    cursor = conn.cursor()
    cursor.execute("SELECT id, student_name, certificate_type, applied_on, status FROM student_certificates")  
    data = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "name": row[1], "certificate": row[2], "date": row[3], "status": row[4]} for row in data]

# API endpoint to fetch student data
@app.route("/api/student_data", methods=["GET"])
def student_data():
    return jsonify(get_student_data())

# Serve Student Dashboard
@app.route("/student")
def student_dashboard():
    return render_template("studentdashboard.html")

# Serve Admin Dashboard
@app.route("/admin")
def admin_dashboard():
    return render_template("teacher.html")

if __name__ == "__main__":
    app.run(debug=True)
