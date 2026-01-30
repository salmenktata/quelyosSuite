# -*- coding: utf-8 -*-
"""
Fonctions de matching FAQ par mots-clés.
Normalisation du texte et calcul de score de correspondance.
"""
from typing import Optional, Dict, List, Tuple

from .faq_data import FAQ_ENTRIES


def normalize_text(text: str) -> str:
    """Normalise le texte pour le matching (minuscules, accents, etc.)."""
    text = text.lower().strip()
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ô': 'o', 'ö': 'o',
        'û': 'u', 'ù': 'u', 'ü': 'u',
        'ç': 'c', 'ï': 'i', 'î': 'i'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def calculate_match_score(message: str, keywords: List[str]) -> float:
    """
    Calcule un score de matching entre le message et les mots-clés.

    Returns:
        float: Score entre 0 et 1 (1 = match parfait)
    """
    normalized_message = normalize_text(message)
    matches = 0
    total_weight = len(keywords)

    for keyword in keywords:
        normalized_keyword = normalize_text(keyword)
        # Match exact
        if normalized_keyword in normalized_message:
            matches += 1
        # Match partiel (mots séparés)
        elif all(word in normalized_message for word in normalized_keyword.split()):
            matches += 0.7

    return matches / total_weight if total_weight > 0 else 0.0


def find_faq_match(message: str, threshold: float = 0.5) -> Optional[Dict]:
    """
    Cherche une correspondance dans la FAQ.

    Args:
        message: Message de l'utilisateur
        threshold: Seuil minimum de matching (0-1)

    Returns:
        dict avec question, answer, score, is_exact ou None
    """
    best_match = None
    best_score = 0.0

    for entry in FAQ_ENTRIES:
        score = calculate_match_score(message, entry['keywords'])

        if score > best_score and score >= threshold:
            best_score = score
            best_match = {
                'question': entry['question'],
                'answer': entry['answer'],
                'score': score,
                'is_exact': score >= 0.8
            }

    return best_match


def get_faq_response(message: str) -> Tuple[Optional[str], Optional[Dict]]:
    """
    Récupère une réponse FAQ si disponible.

    Returns:
        Tuple (réponse, metadata) ou (None, None)
    """
    match = find_faq_match(message)

    if match and match['score'] >= 0.5:
        metadata = {
            'matched_question': match['question'],
            'confidence': match['score'],
            'is_exact': match['is_exact']
        }

        if match['score'] < 0.8:
            response = f"{match['answer']}\n\n💡 *Si cette réponse ne correspond pas à votre question, reformulez-la et je ferai appel à l'IA.*"
        else:
            response = match['answer']

        return response, metadata

    return None, None


def list_all_faq_questions() -> List[str]:
    """Retourne la liste de toutes les questions FAQ."""
    return [entry['question'] for entry in FAQ_ENTRIES]
