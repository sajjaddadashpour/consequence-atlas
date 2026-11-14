"""Gate-assigned seeds: agents cannot choose them."""
from __future__ import annotations

import hashlib


def gate_seed(lock_hash: str, arm: str, size: int, i: int) -> int:
    """seed = first 4 bytes (big-endian uint32) of sha256(lock.hash|arm|size|i).

    The proposal said 8 bytes; the Starter RNG (mulberry32) takes a 32-bit seed and
    JSON numbers lose precision above 2^53, so v0 uses 4 bytes.
    """
    h = hashlib.sha256(f"{lock_hash}|{arm}|{size}|{i}".encode()).digest()
    return int.from_bytes(h[:4], "big")


def gate_seeds(lock_hash: str, arm: str, size: int, n: int) -> list[int]:
    return [gate_seed(lock_hash, arm, size, i) for i in range(n)]
