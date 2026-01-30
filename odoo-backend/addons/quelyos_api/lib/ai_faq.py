# -*- coding: utf-8 -*-
"""
FAQ Prédéfinie pour le Chatbot IA.
Répond instantanément aux questions fréquentes sans appeler l'API.

Module d'orchestration - réexporte depuis faq_data et faq_matching.
"""
from .faq_data import FAQ_ENTRIES, FAQEntry
from .faq_matching import (
    normalize_text,
    calculate_match_score,
    find_faq_match,
    get_faq_response,
    list_all_faq_questions,
)

__all__ = [
    'FAQ_ENTRIES',
    'FAQEntry',
    'normalize_text',
    'calculate_match_score',
    'find_faq_match',
    'get_faq_response',
    'list_all_faq_questions',
]
