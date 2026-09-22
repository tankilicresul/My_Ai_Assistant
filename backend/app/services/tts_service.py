import os
import uuid
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

class TTSService:
    """
    Studio-grade Neural Voice & ElevenLabs Text-to-Speech Engine.
    Supports Microsoft Neural Studio Voices (Edge-TTS) and ElevenLabs Multilingual v2.
    """

    ELEVENLABS_VOICE_MAP = {
        "Ece": "21m00Tcm4TlvDq8ikWAM",      # Rachel / Multilingual
        "Kaan": "pNInz6obpgDQGcFmaJgB",     # Adam / Multilingual
        "female": "21m00Tcm4TlvDq8ikWAM",
        "male": "pNInz6obpgDQGcFmaJgB"
    }

    EDGE_VOICE_MAP = {
        "Ece": "tr-TR-EmelNeural",          # Ece - Crystal Clear Turkish Neural Female
        "Kaan": "tr-TR-AhmetNeural",        # Kaan - Studio Broadcaster Turkish Neural Male
        "female_turkish": "tr-TR-EmelNeural",
        "male_turkish": "tr-TR-AhmetNeural",
        "female_english": "en-US-JennyNeural",
        "male_english": "en-US-GuyNeural"
    }

    def __init__(self):
        self.output_dir = os.path.join(settings.MEDIA_STORAGE_DIR, "podcasts")
        os.makedirs(self.output_dir, exist_ok=True)

    async def _synthesize_elevenlabs(self, text: str, voice_name: str) -> Optional[bytes]:
        """
        Synthesize text using ElevenLabs Multilingual v2 API if key is present.
        """
        api_key = settings.ELEVENLABS_API_KEY
        if not api_key:
            return None

        voice_id = self.ELEVENLABS_VOICE_MAP.get(voice_name, "21m00Tcm4TlvDq8ikWAM")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.35,
                "use_speaker_boost": True
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return res.content
                else:
                    print(f"[TTSService] ElevenLabs API error: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[TTSService] ElevenLabs exception: {e}")

        return None

    async def _synthesize_edge_neural(self, text: str, voice_name: str, speed: float = 1.0) -> bytes:
        """
        Synthesize text using Microsoft Edge Neural TTS (EmelNeural & AhmetNeural).
        High studio fidelity, zero cost, and natural Turkish intonation.
        """
        import edge_tts

        voice_id = self.EDGE_VOICE_MAP.get(voice_name, "tr-TR-EmelNeural")
        
        # Calculate rate modifier e.g. +0%, +10%, -5%
        rate_str = "+0%"
        if speed > 1.0:
            rate_str = f"+{int((speed - 1.0) * 100)}%"
        elif speed < 1.0:
            rate_str = f"-{int((1.0 - speed) * 100)}%"

        communicator = edge_tts.Communicate(text=text, voice=voice_id, rate=rate_str)
        audio_chunks = []
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        return b"".join(audio_chunks)

    async def synthesize_text(self, text: str, voice_name: str = "Ece", speed: float = 1.0) -> Dict[str, Any]:
        """
        Synthesizes text into high-fidelity MP3 and saves it to media storage.
        """
        clean_text = text.strip()
        if not clean_text:
            return {"audio_url": "", "engine": "none", "bytes_length": 0}

        audio_bytes = None
        engine_used = "Microsoft Neural Studio HD"

        # 1. Try ElevenLabs if configured
        if settings.ELEVENLABS_API_KEY:
            audio_bytes = await self._synthesize_elevenlabs(clean_text, voice_name)
            if audio_bytes:
                engine_used = "ElevenLabs Multilingual v2"

        # 2. Fallback to Edge Neural Studio
        if not audio_bytes:
            try:
                audio_bytes = await self._synthesize_edge_neural(clean_text, voice_name, speed=speed)
                engine_used = "Microsoft Neural Studio HD"
            except Exception as e:
                print(f"[TTSService] Edge TTS error: {e}")
                return {"audio_url": "", "engine": "failed", "error": str(e)}

        # Save MP3 file
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "wb") as f:
            f.write(audio_bytes)

        return {
            "audio_url": f"/static/media/podcasts/{filename}",
            "filename": filename,
            "engine": engine_used,
            "bytes_length": len(audio_bytes)
        }

    async def synthesize_podcast_dialogue(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesizes audio for all dialogue segments concurrently and creates a single merged podcast MP3.
        """
        if not segments:
            return {"segments": [], "full_audio_url": None, "engine": "none"}

        async def process_segment(seg: Dict[str, Any]):
            speaker = seg.get("speaker", "Ece")
            text = seg.get("text", "")
            synth_res = await self.synthesize_text(text=text, voice_name=speaker)
            seg["audio_url"] = synth_res.get("audio_url", "")
            seg["engine"] = synth_res.get("engine", "")
            return synth_res.get("filename")

        # Run synthesis concurrently
        tasks = [process_segment(seg) for seg in segments]
        filenames = await asyncio.gather(*tasks)

        # Merge segments into one full master MP3 file
        master_bytes = bytearray()
        for fname in filenames:
            if fname:
                seg_path = os.path.join(self.output_dir, fname)
                if os.path.exists(seg_path):
                    with open(seg_path, "rb") as sf:
                        master_bytes.extend(sf.read())

        full_audio_url = None
        if master_bytes:
            master_filename = f"podcast_full_{uuid.uuid4().hex}.mp3"
            master_filepath = os.path.join(self.output_dir, master_filename)
            with open(master_filepath, "wb") as mf:
                mf.write(master_bytes)
            full_audio_url = f"/static/media/podcasts/{master_filename}"

        engine_title = "ElevenLabs Multilingual v2" if settings.ELEVENLABS_API_KEY else "Microsoft Neural Studio HD"

        return {
            "segments": segments,
            "full_audio_url": full_audio_url,
            "engine": engine_title
        }

tts_service = TTSService()
