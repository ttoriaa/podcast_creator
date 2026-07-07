import json
import os
from typing import Any

import feedparser
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

DEFAULT_RSS_URL = os.getenv("DEFAULT_RSS_URL", "").strip()
GLM_API_KEY = os.getenv("GLM_API_KEY", "").strip()
GLM_BASE_URL = os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4").rstrip("/")
GLM_MODEL = os.getenv("GLM_MODEL", "glm-4-flash")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

app = FastAPI(title="Podcast Creator API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RssRequest(BaseModel):
    rss_url: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


class TopicRequest(BaseModel):
    rss_url: str | None = None
    limit: int = Field(default=20, ge=1, le=100)


class ScriptRequest(BaseModel):
    topic: dict[str, Any]
    style: str = "casual"


class AudioSemanticRequest(BaseModel):
    rss_url: str | None = None
    limit: int = Field(default=10, ge=1, le=50)


def resolve_rss_url(incoming: str | None) -> str:
    url = (incoming or "").strip() or DEFAULT_RSS_URL
    if not url:
        raise HTTPException(status_code=400, detail="Missing rss_url and DEFAULT_RSS_URL is not set")
    return url


def parse_episodes(rss_url: str, limit: int) -> list[dict[str, Any]]:
    feed = feedparser.parse(rss_url)
    if getattr(feed, "bozo", False) and not getattr(feed, "entries", None):
        raise HTTPException(status_code=400, detail=f"Failed to parse RSS: {rss_url}")

    episodes: list[dict[str, Any]] = []
    for idx, entry in enumerate(feed.entries[:limit]):
        audio_url = ""
        if entry.get("links"):
            for lk in entry.links:
                if lk.get("type", "").startswith("audio"):
                    audio_url = lk.get("href", "")
                    break
        if not audio_url and entry.get("enclosures"):
            enc = entry.enclosures[0]
            audio_url = enc.get("href", "")

        episodes.append(
            {
                "id": entry.get("id") or entry.get("guid") or f"ep-{idx+1}",
                "title": (entry.get("title") or "").strip(),
                "description": (entry.get("summary") or entry.get("description") or "").strip(),
                "audio_url": audio_url,
                "published": entry.get("published", ""),
            }
        )
    return episodes


def heuristic_topics(episodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for i, ep in enumerate(episodes[:3]):
        title = ep.get("title") or f"Episode {i+1}"
        out.append(
            {
                "id": f"topic-fallback-{i+1}",
                "title": f"从《{title}》延展的新角度",
                "summary": f"基于最近节目标题和简介，围绕《{title}》延展可继续讨论的议题。",
                "audience": "播客核心听众",
                "evidence": f"命中节目：{title}",
                "risk": "需要补充具体案例，避免泛泛而谈。",
                "scores": {"novelty": 70 + i * 3, "resonance": 82 - i * 2, "story": 78 + i},
                "tags": ["Podcast", "延展", "选题"],
                "outline": [
                    "开场：这一期为什么值得继续聊",
                    "第一段：核心观点和争议点",
                    "第二段：从听众处境切入",
                    "第三段：可执行建议",
                    "收尾：下一期预告和互动问题",
                ],
            }
        )
    return out


def glm_chat(messages: list[dict[str, str]]) -> str:
    if not GLM_API_KEY:
        raise RuntimeError("GLM_API_KEY is not set")

    url = f"{GLM_BASE_URL}/chat/completions"
    payload = {
        "model": GLM_MODEL,
        "temperature": 0.7,
        "messages": messages,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {GLM_API_KEY}", "Content-Type": "application/json"}

    with httpx.Client(timeout=40.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    return data["choices"][0]["message"]["content"]


def extract_json_object(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        return {}
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return {}
    return {}


def fallback_audio_semantic(episode: dict[str, Any]) -> dict[str, Any]:
    title = episode.get("title") or "未命名节目"
    description = (episode.get("description") or "")[:200]
    return {
        "summary": f"占位摘要：节目《{title}》可围绕核心观点与听众痛点做延展。",
        "transcript_status": "pending_transcription",
        "transcript_preview": f"转写占位：{description}",
        "keywords": ["播客", "选题", "复盘"],
        "suggested_angles": [
            "补充一个反直觉案例",
            "增加听众可执行清单",
            "强化结尾互动问题",
        ],
        "source": "fallback",
    }


def glm_audio_semantic(episode: dict[str, Any]) -> dict[str, Any]:
    prompt = (
        "你是播客语义分析助手。根据标题与简介输出 JSON 对象，字段包括:"
        "summary, transcript_preview, keywords(数组), suggested_angles(数组)。"
        "不要输出 markdown。"
    )
    messages = [
        {"role": "system", "content": "You are a podcast semantic analyzer."},
        {
            "role": "user",
            "content": json.dumps(
                {
                    "title": episode.get("title", ""),
                    "description": (episode.get("description", "") or "")[:1200],
                    "audio_url": episode.get("audio_url", ""),
                },
                ensure_ascii=False,
            )
            + "\n"
            + prompt,
        },
    ]

    content = glm_chat(messages)
    parsed = extract_json_object(content)
    if not parsed:
        raise RuntimeError("Invalid GLM semantic response")

    semantic = {
        "summary": (parsed.get("summary") or "").strip(),
        "transcript_status": "pending_transcription",
        "transcript_preview": (parsed.get("transcript_preview") or "").strip(),
        "keywords": parsed.get("keywords") if isinstance(parsed.get("keywords"), list) else [],
        "suggested_angles": parsed.get("suggested_angles") if isinstance(parsed.get("suggested_angles"), list) else [],
        "source": "glm",
    }
    if not semantic["summary"]:
        semantic["summary"] = fallback_audio_semantic(episode)["summary"]
    if not semantic["transcript_preview"]:
        semantic["transcript_preview"] = fallback_audio_semantic(episode)["transcript_preview"]
    return semantic


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "glm_enabled": bool(GLM_API_KEY),
        "default_rss_url_set": bool(DEFAULT_RSS_URL),
        "model": GLM_MODEL,
    }


@app.post("/api/rss/sync")
def rss_sync(req: RssRequest) -> dict[str, Any]:
    rss_url = resolve_rss_url(req.rss_url)
    episodes = parse_episodes(rss_url, req.limit)
    return {"rss_url": rss_url, "count": len(episodes), "episodes": episodes}


@app.post("/api/topics/generate")
def topics_generate(req: TopicRequest) -> dict[str, Any]:
    rss_url = resolve_rss_url(req.rss_url)
    episodes = parse_episodes(rss_url, req.limit)

    # Fallback first; upgrade with GLM when API key is available and response is valid.
    topics = heuristic_topics(episodes)
    source = "fallback"

    if GLM_API_KEY and episodes:
        sample = [
            {
                "title": ep.get("title", ""),
                "description": (ep.get("description", "") or "")[:420],
            }
            for ep in episodes[:8]
        ]
        prompt = (
            "你是播客选题编辑。基于节目标题与简介，输出 3 个选题候选。"
            "必须返回 JSON 对象，字段是 topics，topics 为数组。"
            "每个 topic 包含: id,title,summary,audience,evidence,risk,scores,tags,outline。"
            "scores 是对象 novelty/resonance/story 的 0-100 数字。"
            "outline 是长度 5 的字符串数组。"
        )
        messages = [
            {"role": "system", "content": "You are a podcast topic planner."},
            {"role": "user", "content": f"episodes={json.dumps(sample, ensure_ascii=False)}\n{prompt}"},
        ]
        try:
            content = glm_chat(messages)
            parsed = json.loads(content)
            candidate = parsed.get("topics", [])
            if isinstance(candidate, list) and candidate:
                topics = candidate[:3]
                source = "glm"
        except Exception:
            source = "fallback"

    return {
        "rss_url": rss_url,
        "episode_count": len(episodes),
        "source": source,
        "topics": topics,
        "episodes": episodes[:10],
    }


@app.post("/api/scripts/generate")
def scripts_generate(req: ScriptRequest) -> dict[str, Any]:
    topic = req.topic or {}
    title = (topic.get("title") or "未命名选题").strip()
    outline = topic.get("outline") or []
    if not isinstance(outline, list):
        outline = []

    style = req.style or "casual"
    fallback_draft = [
        f"# {title}",
        "",
        "## 提纲",
        *[f"- {item}" for item in outline[:8]],
        "",
        "## 开场正文",
        "",
        "## 第一段正文",
        "",
        "## 第二段正文",
        "",
        "## 收尾正文",
    ]
    source = "fallback"
    draft = "\n".join(fallback_draft)

    if GLM_API_KEY:
        prompt = (
            "你是播客逐字稿写作助手。请根据选题和提纲生成一版口语化逐字稿。"
            "输出 markdown，包含：开场正文、第一段正文、第二段正文、收尾正文。"
            f"写作风格={style}。"
        )
        messages = [
            {"role": "system", "content": "You are a Chinese podcast script writer."},
            {
                "role": "user",
                "content": json.dumps({"title": title, "outline": outline, "style": style}, ensure_ascii=False)
                + "\n"
                + prompt,
            },
        ]
        try:
            draft = glm_chat(messages)
            source = "glm"
        except Exception:
            source = "fallback"

    return {"source": source, "title": title, "style": style, "draft": draft}


@app.post("/api/audio/semantic")
def audio_semantic(req: AudioSemanticRequest) -> dict[str, Any]:
    rss_url = resolve_rss_url(req.rss_url)
    episodes = parse_episodes(rss_url, req.limit)

    analyzed_items: list[dict[str, Any]] = []
    for ep in episodes:
        audio_url = (ep.get("audio_url") or "").strip()
        if not audio_url:
            continue

        semantic = fallback_audio_semantic(ep)
        if GLM_API_KEY:
            try:
                semantic = glm_audio_semantic(ep)
            except Exception:
                semantic = fallback_audio_semantic(ep)

        analyzed_items.append(
            {
                "episode_id": ep.get("id", ""),
                "title": ep.get("title", ""),
                "audio_url": audio_url,
                "published": ep.get("published", ""),
                "semantic": semantic,
            }
        )

    return {
        "rss_url": rss_url,
        "count": len(analyzed_items),
        "items": analyzed_items,
        "note": "Audio URLs are pulled from RSS. Transcript is currently a placeholder preview pending ASR integration.",
    }
