# -*- coding: utf-8 -*-
"""
LexiSimplify Isolation Sandbox
==============================
Simulates an isolated execution environment to execute untrusted 
code or parsers without risking container health or leakage of variables.
"""

import os
import sys
import subprocess

def run_in_sandbox(command: list, timeout_sec: int = 15) -> str:
    """
    Run subprocesses inside an isolated execution shell.
    """
    print(f"[Sandbox] Executing command in sandbox: {command}")
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_sec
        )
        if result.returncode != 0:
            return f"Sandbox Error: {result.stderr}"
        return result.stdout
    except subprocess.TimeoutExpired:
        return "Sandbox Error: Execution timed out."

if __name__ == "__main__":
    out = run_in_sandbox(["echo", "Sandbox initialized successfully."])
    print(out)
