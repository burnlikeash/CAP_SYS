# db_api.py
from fastapi import FastAPI
import mysql.connector
from typing import List, Dict

app = FastAPI(title="Database API - Smartphone Reviews")

# Database connection
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="smartphone_reviews"
    )

# 1. Get all brands
@app.get("/brands")
def get_brands() -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM brands")
    results = cursor.fetchall()
    conn.close()
    return results

# 2. Get phones by brand
@app.get("/phones")
def get_phones(brand_id: int) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM phones WHERE brand_id = %s", (brand_id,))
    results = cursor.fetchall()
    conn.close()
    return results

# 3. Get reviews by phone
@app.get("/reviews")
def get_reviews(phone_id: int) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM reviews WHERE phone_id = %s", (phone_id,))
    results = cursor.fetchall()
    conn.close()
    return results

# 4. Get sentiment summary by phone
@app.get("/sentiments")
def get_sentiments(phone_id: int) -> Dict:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT sentiment_label, COUNT(*) as count
        FROM sentiments
        INNER JOIN reviews ON sentiments.review_id = reviews.review_id
        WHERE reviews.phone_id = %s
        GROUP BY sentiment_label
    """, (phone_id,))
    results = cursor.fetchall()
    conn.close()
    return {row["sentiment_label"]: row["count"] for row in results}

# 5. Get topics by phone
@app.get("/topics")
def get_topics(phone_id: int) -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM topics WHERE phone_id = %s", (phone_id,))
    results = cursor.fetchall()
    conn.close()
    return results
