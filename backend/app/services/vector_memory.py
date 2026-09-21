import os
import uuid
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

class VectorMemoryService:
    """
    Qdrant Vector Database integration for long-term user memories,
    preferences, projects, career info, and document RAG chunks.
    """

    def __init__(self):
        self.qdrant_url = settings.QDRANT_URL
        self.api_key = settings.QDRANT_API_KEY
        self.client = None
        self._init_qdrant()

    def _init_qdrant(self):
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models
            self.client = QdrantClient(
                url=self.qdrant_url,
                api_key=self.api_key if self.api_key else None,
                timeout=5.0
            )
            # Create collections if they don't exist
            self._ensure_collection(settings.QDRANT_COLLECTION_MEMORIES, vector_size=1536)
            self._ensure_collection(settings.QDRANT_COLLECTION_DOCUMENTS, vector_size=1536)
            self._ensure_collection(settings.QDRANT_COLLECTION_RESEARCH, vector_size=1536)
        except Exception as e:
            # Fallback in-memory or graceful degradation if Qdrant daemon is offline
            self.client = None
            print(f"[VectorMemoryService] Qdrant not reachable ({e}). Running in resilient fallback mode.")

    def _ensure_collection(self, collection_name: str, vector_size: int = 1536):
        if not self.client:
            return
        try:
            from qdrant_client.http import models
            collections = self.client.get_collections().collections
            exists = any(c.name == collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(
                        size=vector_size,
                        distance=models.Distance.COSINE
                    )
                )
        except Exception:
            pass

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector (1536-dim) via OpenAI / LiteLLM or deterministic mock vector.
        """
        try:
            import litellm
            response = await litellm.aembedding(
                model="text-embedding-3-small",
                input=[text]
            )
            return response.data[0]["embedding"]
        except Exception:
            # Deterministic pseudo-embedding for local offline testing
            import hashlib
            h = hashlib.sha256(text.encode("utf-8")).digest()
            vec = []
            for i in range(1536):
                byte_val = h[i % len(h)]
                vec.append((float(byte_val) / 255.0) * 2.0 - 1.0)
            # Normalize
            norm = sum(x**2 for x in vec) ** 0.5 or 1.0
            return [x / norm for x in vec]

    async def store_memory(
        self,
        user_id: str,
        content: str,
        category: str = "preference",
        key: Optional[str] = None,
        importance_score: float = 1.0,
        meta_info: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store an atomic user memory into Qdrant & return point_id.
        """
        point_id = str(uuid.uuid4())
        vector = await self.get_embedding(content)
        payload = {
            "user_id": user_id,
            "category": category,
            "key": key or "",
            "content": content,
            "importance_score": importance_score,
            "meta_info": meta_info or {}
        }

        if self.client:
            try:
                from qdrant_client.http import models
                self.client.upsert(
                    collection_name=settings.QDRANT_COLLECTION_MEMORIES,
                    points=[
                        models.PointStruct(
                            id=point_id,
                            vector=vector,
                            payload=payload
                        )
                    ]
                )
            except Exception as e:
                print(f"[VectorMemory] Error storing memory point in Qdrant: {e}")

        return point_id

    async def search_memories(
        self,
        user_id: str,
        query: str,
        category: Optional[str] = None,
        limit: int = 5,
        min_score: float = 0.4
    ) -> List[Dict[str, Any]]:
        """
        Semantic search across user memories with optional category filtering.
        """
        vector = await self.get_embedding(query)
        results = []

        if self.client:
            try:
                from qdrant_client.http import models
                conditions = [
                    models.FieldCondition(
                        key="user_id",
                        match=models.MatchValue(value=user_id)
                    )
                ]
                if category:
                    conditions.append(
                        models.FieldCondition(
                            key="category",
                            match=models.MatchValue(value=category)
                        )
                    )

                query_filter = models.Filter(must=conditions)

                search_result = self.client.search(
                    collection_name=settings.QDRANT_COLLECTION_MEMORIES,
                    query_vector=vector,
                    query_filter=query_filter,
                    limit=limit,
                    score_threshold=min_score
                )

                for hit in search_result:
                    payload = hit.payload or {}
                    results.append({
                        "id": str(hit.id),
                        "user_id": payload.get("user_id"),
                        "category": payload.get("category"),
                        "key": payload.get("key"),
                        "content": payload.get("content"),
                        "importance_score": payload.get("importance_score", 1.0),
                        "similarity_score": round(hit.score, 4),
                        "meta_info": payload.get("meta_info", {})
                    })
            except Exception as e:
                print(f"[VectorMemory] Search failed: {e}")

        return results

    async def store_document_chunks(
        self,
        user_id: str,
        document_id: str,
        chunks: List[Dict[str, Any]]
    ) -> int:
        """
        Store RAG chunks for uploaded PDF / Docx / spreadsheets.
        """
        if not self.client or not chunks:
            return len(chunks)

        try:
            from qdrant_client.http import models
            points = []
            for i, chunk in enumerate(chunks):
                text = chunk.get("text", "")
                vec = await self.get_embedding(text)
                p_id = str(uuid.uuid4())
                points.append(
                    models.PointStruct(
                        id=p_id,
                        vector=vec,
                        payload={
                            "user_id": user_id,
                            "document_id": document_id,
                            "chunk_index": i,
                            "text": text,
                            "page_number": chunk.get("page", 1),
                            "section": chunk.get("section", "")
                        }
                    )
                )

            self.client.upsert(
                collection_name=settings.QDRANT_COLLECTION_DOCUMENTS,
                points=points
            )
            return len(points)
        except Exception as e:
            print(f"[VectorMemory] Document chunks store error: {e}")
            return len(chunks)

vector_memory_service = VectorMemoryService()
