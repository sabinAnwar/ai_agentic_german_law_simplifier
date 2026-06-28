# -*- coding: utf-8 -*-
"""
LexiSimplify Simplification Engine
===================================
A standalone python module demonstrating how a B1 plain-language
rewrite can be prompted and post-processed using Python legal libraries.
"""

import os
import sys

def rewrite_to_plain_language(text: str, level: str = "B1") -> str:
    """
    Simulates rewriting original German text to clear plain language.
    Live system uses Gemini 3.5 Flash inside `/server.ts`.
    """
    print(f"[Simplifier] Rewriting German text to level: {level}")
    
    # Simple dictionary replacement rules for demonstration
    replacements = {
        "Nettokaltmiete": "Kaltmiete (Miete ohne Heiz- und Nebenkosten)",
        "Zustimmungserklärung": "schriftliche Ja-Antwort",
        "Kappungsgrenze": "gesetzliche Höchstgrenze für Mieterhöhungen",
        "ortsübliche Vergleichsmiete": "durchschnittliche Miete in Ihrer Gegend"
    }
    
    rewritten = text
    for jargon, simple in replacements.items():
        rewritten = rewritten.replace(jargon, f"**{simple}**")
        
    return rewritten

if __name__ == "__main__":
    sample = "Die Nettokaltmiete soll erhöht werden. Bitte senden Sie die Zustimmungserklärung zurück."
    result = rewrite_to_plain_language(sample, "B1")
    print(f"Original: {sample}")
    print(f"Simplified: {result}")
