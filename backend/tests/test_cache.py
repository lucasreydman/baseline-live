"""Tests for the TTL cache."""

import time
import pytest
from app.services.cache import TTLCache


def test_set_and_get():
    cache = TTLCache()
    cache.set("key1", {"foo": "bar"}, ttl=60)
    assert cache.get("key1") == {"foo": "bar"}


def test_miss_returns_none():
    cache = TTLCache()
    assert cache.get("nonexistent") is None


def test_expiry():
    cache = TTLCache()
    # Use negative TTL so the entry is already past expiry when set
    cache.set("key2", "value", ttl=-1)
    assert cache.get("key2") is None


def test_overwrite():
    cache = TTLCache()
    cache.set("k", 1, ttl=60)
    cache.set("k", 2, ttl=60)
    assert cache.get("k") == 2


def test_delete():
    cache = TTLCache()
    cache.set("k", "v", ttl=60)
    cache.delete("k")
    assert cache.get("k") is None


def test_clear():
    cache = TTLCache()
    cache.set("a", 1, ttl=60)
    cache.set("b", 2, ttl=60)
    cache.clear()
    assert cache.size() == 0


def test_size():
    cache = TTLCache()
    assert cache.size() == 0
    cache.set("x", 1, ttl=60)
    cache.set("y", 2, ttl=60)
    assert cache.size() == 2
