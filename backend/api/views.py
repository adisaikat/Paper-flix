import json
import math
import sqlite3
import uuid

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pathlib import Path

from .apps import paper_cache

home_dir = Path.home()
DB_PATH = home_dir / "Paper-flix" / "db" / "papers.db"


# --- MATH HELPERS ---
def cosine_similarity(vec_a, vec_b):
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a)
    norm_b = sum(b * b for b in vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0
    return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b))


def get_top_n(target_vector, exclude_ids, n=10):
    scores = []
    for p in paper_cache:
        if p["id"] in exclude_ids:
            continue
        sim = cosine_similarity(target_vector, p["vector"])
        scores.append({"paper": p, "score": sim})

    # Sort by highest score
    scores.sort(key=lambda x: x["score"], reverse=True)

    # Return top N (strip out the vector to save bandwidth)
    results = []
    for i in range(min(n, len(scores))):
        paper_copy = scores[i]["paper"].copy()
        del paper_copy["vector"]
        results.append(paper_copy)
    return results


# --- VIEWS (ENDPOINTS) ---


@csrf_exempt
def register_user(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        user_id = str(uuid.uuid4())

        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "INSERT INTO users (id, username) VALUES (?, ?)", (user_id, username)
        )
        conn.commit()
        conn.close()

        return JsonResponse({"id": user_id, "username": username})


def get_users(request):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username FROM users")
    users = [{"id": row[0], "username": row[1]} for row in cursor.fetchall()]
    conn.close()
    return JsonResponse(users, safe=False)


@csrf_exempt
def user_history(request, user_id):
    conn = sqlite3.connect(DB_PATH)
    if request.method == "GET":
        cursor = conn.cursor()
        cursor.execute(
            "SELECT paper_id FROM user_history WHERE user_id = ?", (user_id,)
        )
        history_ids = [row[0] for row in cursor.fetchall()]

        history = []
        for p in paper_cache:
            if p["id"] in history_ids:
                p_copy = p.copy()
                del p_copy["vector"]
                history.append(p_copy)

        conn.close()
        return JsonResponse(history, safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)
        paper_id = data.get("paper_id")
        conn.execute(
            "INSERT OR IGNORE INTO user_history (user_id, paper_id) VALUES (?, ?)",
            (user_id, paper_id),
        )
        conn.commit()
        conn.close()
        return JsonResponse({"status": "success"})


@csrf_exempt
def reset_users(request):
    if request.method == "DELETE":
        conn = sqlite3.connect(DB_PATH)
        conn.execute("DELETE FROM user_history")
        conn.execute("DELETE FROM users")
        conn.commit()
        conn.close()
        return JsonResponse({"status": "reset"})


def get_onboarding(request):
    limit = min(12, len(paper_cache))
    results = []
    for i in range(limit):
        p_copy = paper_cache[i].copy()
        del p_copy["vector"]
        results.append(p_copy)
    return JsonResponse(results, safe=False)


@csrf_exempt
def recommend_profile(request):
    if request.method == "POST":
        data = json.loads(request.body)
        history_ids = data.get("history", [])

        if not history_ids:
            return JsonResponse([], safe=False)

        # Calculate mean user vector
        user_vector = [0.0] * 384
        valid_papers = 0

        for p_id in history_ids:
            for p in paper_cache:
                if p["id"] == p_id:
                    for i in range(len(p["vector"])):
                        user_vector[i] += p["vector"][i]
                    valid_papers += 1
                    break

        if valid_papers == 0:
            return JsonResponse({"error": "No valid papers found"}, status=404)

        user_vector = [val / valid_papers for val in user_vector]
        recommendations = get_top_n(user_vector, set(history_ids), 10)

        return JsonResponse(recommendations, safe=False)


def recommend_paper(request, paper_id):
    target_vector = None
    for p in paper_cache:
        if p["id"] == paper_id:
            target_vector = p["vector"]
            break

    if not target_vector:
        return JsonResponse({"error": "Paper not found"}, status=404)

    recommendations = get_top_n(target_vector, {paper_id}, 5)
    return JsonResponse(recommendations, safe=False)
