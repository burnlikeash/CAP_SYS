# ml_api.py
from fastapi import FastAPI
import mysql.connector
import pandas as pd
from transformers import pipeline
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import re
import spacy
from sklearn.feature_extraction.text import CountVectorizer


app = FastAPI(title="ML Pipeline API - Sentiment & Topics")
nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

# Database connection
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="smartphone_reviews"
    )

# Load models once
sentiment_model = pipeline(
    "sentiment-analysis",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    tokenizer="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
    truncation=True,     # 🚀 cut reviews longer than 512 tokens
    max_length=512       # 🚀 safe size for DistilBERT
)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# 1. Run Sentiment Analysis on all reviews
@app.post("/run-sentiment")
def run_sentiment():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # fetch all reviews
    cursor.execute("SELECT review_id, review_text FROM reviews")
    reviews = cursor.fetchall()

    for review in reviews:
        result = sentiment_model(review["review_text"])[0]
        label = result["label"].lower()  # "POSITIVE" → "positive"
        score = float(result["score"])

        # insert or update
        cursor.execute("""
            INSERT INTO sentiments (review_id, sentiment_label, sentiment_score)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                sentiment_label = VALUES(sentiment_label),
                sentiment_score = VALUES(sentiment_score)
        """, (review["review_id"], label, score))

    conn.commit()
    conn.close()
    return {"status": f"Sentiment analysis done for {len(reviews)} reviews"}


# 2. Run Topic Modeling on all reviews
@app.post("/run-all-topics")
def run_all_topics():
    import re
    import spacy
    from sklearn.feature_extraction.text import CountVectorizer, ENGLISH_STOP_WORDS

    # Load spaCy once (can move to top of file for efficiency)
    nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

    def clean_text(text: str) -> str:
        # lowercase
        text = text.lower()
        # remove non-alphabetic characters
        text = re.sub(r"[^a-z\s]", "", text)
        # process with spacy
        doc = nlp(text)
        tokens = [
            token.lemma_ for token in doc
            if not token.is_stop and len(token) > 2
        ]
        return " ".join(tokens)

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # get all phones
    cursor.execute("SELECT phone_id FROM phones")
    phones = cursor.fetchall()

    results = []

    for phone in phones:
        phone_id = phone["phone_id"]

        # get reviews for this phone
        cursor.execute("SELECT review_id, review_text FROM reviews WHERE phone_id = %s", (phone_id,))
        reviews = cursor.fetchall()

        if not reviews:
            continue

        # Preprocess reviews
        docs = [clean_text(r["review_text"]) for r in reviews]
        review_ids = [r["review_id"] for r in reviews]

        # ✅ Custom stopwords (english + extras)
        extra_stopwords = {"phone", "review", "smartphone"}
        all_stopwords = list(ENGLISH_STOP_WORDS.union(extra_stopwords))
        vectorizer_model = CountVectorizer(stop_words=all_stopwords)

        # train topic model with custom vectorizer
        topic_model = BERTopic(
            embedding_model=embedding_model,
            vectorizer_model=vectorizer_model
        )
        topics, probs = topic_model.fit_transform(docs)

        # insert topics + review-topic links
        for i, topic_id in enumerate(topics):
            if topic_id == -1:  # skip outliers
                continue

            terms = topic_model.get_topic(topic_id)
            if not terms:
                continue

            topic_label = terms[0][0]  # pick top word as label
            rep_terms = ", ".join([word for word, _ in terms])

            # ✅ Insert or update topic (prevent duplicates)
            cursor.execute("""
                INSERT INTO topics (phone_id, topic_label, representative_terms)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    representative_terms = VALUES(representative_terms)
            """, (phone_id, topic_label, rep_terms))

            new_topic_id = cursor.lastrowid
            if new_topic_id == 0:
                # If duplicate, fetch its topic_id
                cursor.execute(
                    "SELECT topic_id FROM topics WHERE phone_id = %s AND topic_label = %s",
                    (phone_id, topic_label)
                )
                new_topic_id = cursor.fetchone()["topic_id"]

            # ✅ Insert or update review-topic mapping
            cursor.execute("""
                INSERT INTO review_topics (review_id, topic_id, relevance_score)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    relevance_score = VALUES(relevance_score)
            """, (
                review_ids[i], new_topic_id,
                float(probs[i]) if probs is not None else 0
            ))

        results.append(f"Topics generated/updated for phone_id {phone_id}")

    conn.commit()
    conn.close()
    return {"status": results}


# 3. Run Topic Modeling on specific phone-ids (/run-topics/1)
@app.post("/run-topics/{phone_id}")
def run_topics(phone_id: int):
    import re
    import spacy
    from sklearn.feature_extraction.text import CountVectorizer

    nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

    def clean_text(text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z\s]", "", text)
        doc = nlp(text)
        tokens = [
            token.lemma_
            for token in doc
            if not token.is_stop and len(token) > 2
        ]
        return " ".join(tokens)

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # get reviews for this phone
    cursor.execute(
        "SELECT review_id, review_text FROM reviews WHERE phone_id = %s",
        (phone_id,)
    )
    reviews = cursor.fetchall()

    if not reviews:
        return {"status": f"No reviews found for phone_id {phone_id}"}

    docs = [clean_text(r["review_text"]) for r in reviews]
    review_ids = [r["review_id"] for r in reviews]

    # add extra stopwords
    extra_stopwords = ["phone", "review", "smartphone"]
    vectorizer_model = CountVectorizer(stop_words="english")
    vectorizer_model.stop_words = set(vectorizer_model.get_stop_words()).union(extra_stopwords)

    # train topic model
    topic_model = BERTopic(
        embedding_model=embedding_model,
        vectorizer_model=vectorizer_model
    )
    topics, probs = topic_model.fit_transform(docs)

    for i, topic_id in enumerate(topics):
        if topic_id == -1:
            continue

        terms = topic_model.get_topic(topic_id)
        if not terms:
            continue

        topic_label = terms[0][0]
        rep_terms = ", ".join([word for word, _ in terms])

        # ✅ insert or update topic (deduplication)
        cursor.execute("""
            INSERT INTO topics (phone_id, topic_label, representative_terms)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE representative_terms = VALUES(representative_terms)
        """, (phone_id, topic_label, rep_terms))
        new_topic_id = cursor.lastrowid or cursor.lastrowid

        # ✅ get topic_id in case it already existed
        if new_topic_id == 0:
            cursor.execute("""
                SELECT topic_id FROM topics
                WHERE phone_id = %s AND topic_label = %s
            """, (phone_id, topic_label))
            new_topic_id = cursor.fetchone()["topic_id"]

        # ✅ insert or update review-topic link
        cursor.execute("""
            INSERT INTO review_topics (review_id, topic_id, relevance_score)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score)
        """, (
            review_ids[i],
            new_topic_id,
            float(probs[i]) if probs is not None else 0
        ))

    conn.commit()
    conn.close()
    return {"status": f"Topics generated for phone_id {phone_id}"}

