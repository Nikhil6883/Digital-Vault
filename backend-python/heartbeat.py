import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

def run_check():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, email, status, next_checkin_due_at 
        FROM users 
        WHERE next_checkin_due_at < NOW() AND status != 'RELEASED'
    """)
    overdue_users = cursor.fetchall()

    for user in overdue_users:
        if user["status"] == "ACTIVE":
            new_status = "WARNING_SENT"
        elif user["status"] == "WARNING_SENT":
            new_status = "GRACE_PERIOD"
        elif user["status"] == "GRACE_PERIOD":
            new_status = "RELEASED"
        else:
            continue

        cursor.execute(
            "UPDATE users SET status = %s WHERE id = %s",
            (new_status, user["id"])
        )
        print(f"[{datetime.now()}] {user['email']}: {user['status']} -> {new_status}")

        cursor.execute(
            "INSERT INTO access_logs (user_id, action) VALUES (%s, %s)",
            (user["id"], f"Status changed to {new_status}")
        )

    conn.commit()
    cursor.close()
    conn.close()
    print(f"[{datetime.now()}] Check complete. {len(overdue_users)} user(s) processed.")

if __name__ == "__main__":
    run_check()