from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Callable


@dataclass
class ProviderCatalog:
    provider: str
    models: list[str]
    error: str | None = None


def _read_error_payload(err: urllib.error.HTTPError) -> str:
    try:
        payload = err.read().decode("utf-8", errors="replace").strip()
    except Exception:
        return ""
    return payload


def _get_json(url: str, headers: dict[str, str] | None = None, timeout: int = 30) -> dict:
    req = urllib.request.Request(url, method="GET", headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"HTTP {err.code} {err.reason}"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(str(err.reason)) from err


def _list_openai_compatible() -> list[str]:
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    headers: dict[str, str] = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = _get_json(f"{base_url}/models", headers=headers)
    data = payload.get("data") or []
    models: list[str] = []
    for item in data:
        model_id = (item or {}).get("id")
        if isinstance(model_id, str) and model_id:
            models.append(model_id)
    return models


def _list_anthropic() -> list[str]:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing ANTHROPIC_API_KEY")
    base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/")
    api_version = os.getenv("ANTHROPIC_VERSION", "2023-06-01").strip()
    headers = {
        "x-api-key": api_key,
        "anthropic-version": api_version,
    }

    models: list[str] = []
    after_id: str | None = None
    while True:
        qs = "limit=1000"
        if after_id:
            qs = f"{qs}&after_id={urllib.parse.quote(after_id, safe='')}"
        payload = _get_json(f"{base_url}/v1/models?{qs}", headers=headers)
        data = payload.get("data") or []
        for item in data:
            model_id = (item or {}).get("id")
            if isinstance(model_id, str) and model_id:
                models.append(model_id)
        if not payload.get("has_more"):
            break
        last_id = payload.get("last_id")
        if not isinstance(last_id, str) or not last_id:
            break
        after_id = last_id
    return models


def _list_google() -> list[str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY")
    base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com").rstrip("/")

    models: list[str] = []
    page_token: str | None = None
    while True:
        params = {"pageSize": "1000", "key": api_key}
        if page_token:
            params["pageToken"] = page_token
        qs = urllib.parse.urlencode(params)
        payload = _get_json(f"{base_url}/v1beta/models?{qs}")
        data = payload.get("models") or []
        for item in data:
            name = (item or {}).get("name")
            if not isinstance(name, str) or not name:
                continue
            if name.startswith("models/"):
                models.append(name.split("/", 1)[1])
            else:
                models.append(name)
        next_token = payload.get("nextPageToken")
        if not isinstance(next_token, str) or not next_token:
            break
        page_token = next_token
    return models


def _list_ollama() -> list[str]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    payload = _get_json(f"{base_url}/api/tags")
    data = payload.get("models") or []
    models: list[str] = []
    for item in data:
        model_id = (item or {}).get("name") or (item or {}).get("model")
        if isinstance(model_id, str) and model_id:
            models.append(model_id)
    return models


def _list_azure_openai() -> list[str]:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip().rstrip("/")
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21").strip()
    if not endpoint:
        raise ValueError("Missing AZURE_OPENAI_ENDPOINT")
    if not api_key:
        raise ValueError("Missing AZURE_OPENAI_API_KEY")
    headers = {"api-key": api_key}
    payload = _get_json(f"{endpoint}/openai/models?api-version={urllib.parse.quote(api_version, safe='')}", headers=headers)
    data = payload.get("data") or []
    models: list[str] = []
    for item in data:
        model_id = (item or {}).get("id")
        if isinstance(model_id, str) and model_id:
            models.append(model_id)
    return models


def _list_bedrock() -> list[str]:
    try:
        import boto3  # type: ignore
    except ImportError as err:
        raise RuntimeError("boto3 is required (pip install boto3)") from err

    region = (
        os.getenv("BEDROCK_AWS_REGION", "").strip()
        or os.getenv("AWS_REGION", "").strip()
        or os.getenv("AWS_DEFAULT_REGION", "").strip()
    )
    client_kwargs: dict[str, str] = {}
    if region:
        client_kwargs["region_name"] = region
    client = boto3.client("bedrock", **client_kwargs)
    payload = client.list_foundation_models()
    data = payload.get("modelSummaries") or []
    models: list[str] = []
    for item in data:
        model_id = (item or {}).get("modelId")
        if isinstance(model_id, str) and model_id:
            models.append(model_id)
    return models


_PROVIDERS: dict[str, Callable[[], list[str]]] = {
    "openai-compatible": _list_openai_compatible,
    "anthropic": _list_anthropic,
    "google": _list_google,
    "ollama": _list_ollama,
    "azure-openai": _list_azure_openai,
    "bedrock": _list_bedrock,
}


def discover_models(providers: list[str] | None = None) -> list[ProviderCatalog]:
    requested = providers or list(_PROVIDERS.keys())
    catalogs: list[ProviderCatalog] = []
    for provider in requested:
        fn = _PROVIDERS.get(provider)
        if fn is None:
            catalogs.append(ProviderCatalog(provider=provider, models=[], error="Unsupported provider"))
            continue
        try:
            model_ids = sorted(set(fn()))
            catalogs.append(ProviderCatalog(provider=provider, models=model_ids, error=None))
        except Exception as err:
            catalogs.append(ProviderCatalog(provider=provider, models=[], error=str(err)))
    return catalogs

