"""Ed25519 attestations over canonical JSON.

The key in keys/ is a LOCAL TEST KEY. Its private half is never committed. Any
signature it makes is non-authoritative and must not be written into a card's
`gate` field.
"""
from __future__ import annotations

import base64
import json
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

LOCAL_KEY_ID = "local-test-key-NOT-AUTHORITATIVE"


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")


def new_key() -> Ed25519PrivateKey:
    return Ed25519PrivateKey.generate()


def load_or_create_private(path: Path) -> Ed25519PrivateKey:
    if path.exists():
        return serialization.load_pem_private_key(path.read_bytes(), password=None)  # type: ignore[return-value]
    k = new_key()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(k.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    path.chmod(0o600)
    return k


def public_pem(k: Ed25519PrivateKey) -> bytes:
    return k.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)


def load_public(pem: bytes) -> Ed25519PublicKey:
    return serialization.load_pem_public_key(pem)  # type: ignore[return-value]


def sign(payload: dict, key: Ed25519PrivateKey, key_id: str = LOCAL_KEY_ID) -> dict:
    body = dict(payload)
    body["key_id"] = key_id
    body["authoritative"] = key_id != LOCAL_KEY_ID and not key_id.startswith("local-")
    sig = key.sign(canonical(body))
    return {"payload": body, "signature": base64.b64encode(sig).decode()}


def verify(att: dict, pub: Ed25519PublicKey) -> bool:
    try:
        pub.verify(base64.b64decode(att["signature"]), canonical(att["payload"]))
        return True
    except (InvalidSignature, KeyError, ValueError):
        return False
