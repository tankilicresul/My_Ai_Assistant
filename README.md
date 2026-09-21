# 🚀 NexusAI — Enterprise AI Super-Platform

**NexusAI**, modern yapay zeka ekosisteminin en güçlü yeteneklerini (**ChatGPT + Claude Code + Gemini Deep Research + Higgsfield Media Studio + Qdrant Vektör Hafızası + Dosya Analiz Motoru + Agent Marketplace + Admin Observability**) tek bir çatı altında toplayan, üretime hazır, kurumsal düzeyde birleşik bir SaaS platformudur.

---

## 🏗️ 1. Sistem Mimarisi & Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)**, React 18, TypeScript, TailwindCSS, Monaco Editor, Lucide | Cyberpunk/Modern SaaS Dark Mode, responsive, anlık SSE akışlı sohbet ve web terminali. |
| **Backend API** | **FastAPI (Python 3.11/3.13)**, Uvicorn, Pydantic v2, SQLAlchemy (Async), aiohttp | Yüksek performanslı asenkron mikroservis mimarisi ve WebSocket ağ geçidi. |
| **İlişkisel Veritabanı** | **PostgreSQL 16** (SQLite Fallback destekli) | Kullanıcılar, konuşmalar, çalışma alanları, medya meta verileri ve denetim logları. |
| **Önbellek & Mesajlaşma**| **Redis 7** | Pub/Sub, oturum önbelleği, SSE mesaj kuyruğu ve Celery görev aracısı. |
| **Vektör Veritabanı** | **Qdrant Vector DB 1.8** | Kullanıcı bazlı uzun vadeli hafıza, profil eşleştirme ve doküman RAG parçacıkları. |
| **AI Gateway** | **LiteLLM Unified Router** | GPT-4o, Claude 3.7, Gemini 2.0 Flash, DeepSeek R1, Qwen 2.5, Llama 3.3 entegrasyonu. |
| **Arka Plan İşçileri** | **Celery + Redis Worker** | Ağır derin araştırma, video işleme ve doküman indeksleme görevleri. |
| **Konteyner & Dağıtım** | **Docker, Docker Compose, Kubernetes** | StatefulSets, HPA destekli Deployment'lar, ConfigMap/Secrets ve NGINX Ingress. |

---

## 🌟 2. Platform Modülleri & Yetenekleri

### 💬 1. ChatGPT Modülü (`/chat`)
- **Çoklu Model Desteği:** OpenAI GPT-4o / GPT-4o Mini, Anthropic Claude 3.7 Sonnet / 3.5 Haiku, Google Gemini 2.0 Flash / 1.5 Pro, DeepSeek R1 / V3, Qwen 2.5 Coder, Meta Llama 3.3.
- **Canlı Akış (SSE Streaming):** Kelime kelime gerçek zamanlı yanıt oluşturma.
- **Vektörel Hafıza Enjeksiyonu:** Kullanıcının geçmiş tercihleri ve profili otomatik olarak sistem bağlamına eklenir.
- **Markdown & Kod Blokları:** Sözdizimi vurgulama, kopyalama ve biçimlendirme.
- **Sesli Etkileşim:** Sesli komut girişi ve sesli okuma desteği.

### 💻 2. Claude Code Stüdyosu (`/code`)
- **Gelişmiş Dosya Gezgini:** Çalışma alanı dizin yapısı, dosya okuma, anlık kaydetme.
- **Monaco Kod Editörü:** Çok dilli sözdizimi, otomatik tamamlama ve formatlama.
- **Web Terminali & Sandbox:** Güvenli alt işlem yürütme, shell ve python betikleri çalıştırma.
- **Git Entegrasyonu:** `status`, `diff`, `commit`, `log` ve `branch` operasyonları.
- **Claude AI Asistanı:** Hata ayıklama (debug), otomatik birim test üretimi ve refactoring.

### 🎨 3. Medya Stüdyosu (`/studio`) — Higgsfield Stili
- **Görsel Üretim Modelleri:** Flux.1 Pro, Flux.1 Dev, Flux.1 Schnell, Stable Diffusion XL 1.0.
- **Video Üretim Modelleri:** Wan 2.1 (1080p Cinematic), CogVideoX 5B, Kling 1.5 Pro Motion, Google Veo 2.
- **Özellikler:** Prompt geliştirme (Auto-Enhance), negatif prompt, en/boy oranı seçimi (1:1, 16:9, 9:16, 4:3), süre ayarı, geçmiş galerisi ve doğrudan indirme.

### 🧭 4. Gemini Deep Research (`/research`)
- **Otonom Araştırma Motoru:** Arama sorgusunu alt sorulara ayırma ve çok adımlı web taraması.
- **Kaynak Güvenilirlik Skoru:** Taranan sitelerin güvenilirlik analizi ve atıf (citation) kartları.
- **Kapsamlı Raporlama:** Yönetici özeti, mimari analiz, pazar trendleri ve kaynakça içeren akademik düzeyde Markdown & PDF raporları.

### 🧠 5. Kişisel Vektör Hafıza Motoru (`/memory`)
- **Qdrant Entegrasyonu:** 1536 boyutlu semantik embedding vektörleri.
- **Kategoriler:** Kullanıcı Tercihleri, Aktif Projeler, İş Deneyimi, Eğitim/Kurslar, Kişisel Notlar.
- **Semantik Arama:** Doğal dilde arama sorguları ile en alakalı hafıza kayıtlarını getirme.

### 📊 6. Dosya & Veri Analiz Motoru (`/files`)
- **Desteklenen Formatlar:** PDF, Word (`.docx`), Excel (`.xlsx`), CSV, JSON.
- **Otomatik Yapı Çıkarımı:** Tablo satır/sütun istatistikleri, örnek veriler.
- **Yapay Zeka ile Belge Sorgulama:** Yüklenen belgeler üzerinde anlık analitik soru-cevap.

### 🤖 7. Agent Marketplace (`/marketplace`)
- **Hazır Kurumsal Agentlar:**
  1. *Satın Alma ve Tedarik Uzmanı (Procurement Agent)*
  2. *Mali Müşavir ve Muhasebe Analisti*
  3. *Veri Analitiği ve BI Danışmanı*
  4. *Full Stack Yazılım Mimarı*
  5. *Akademik Araştırma Asistanı*
- **Özel Agent Stüdyosu:** Kendi sistem prompt'u, modeli ve araçları (Web Search, Python REPL, Math) olan yeni agentlar tanımlama ve çalıştırma.

### 🛡️ 8. Yönetim & Observability Paneli (`/admin`)
- **Gerçek Zamanlı KPI:** Toplam Kullanıcı, Aktif Oturum, Harcanan Token, Tahmini Maliyet (USD), Otonom Görev Sayısı.
- **Model Bazında Tüketim:** GPT-4o, Claude 3.7, Gemini vb. için prompt/completion token ve dolar bazlı maliyet kırılımı.
- **Kullanıcı Kotaları:** Token kotaları ve rol tabanlı yetki yönetimi (RBAC).
- **Sistem Audit Logları:** API çağrıları, durum kodları ve gecikme takibi.

---

## 🚀 3. Kurulum ve Çalıştırma

### Yöntem A: Yerel Geliştirme (Local Development)

#### 1. Backend'i Başlatma:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend'i Başlatma:
```bash
cd frontend
npm install
npm run dev
```
Uygulamayı tarayıcınızda açın: **`http://localhost:3000`**  
Backend Swagger API Dokümantasyonu: **`http://localhost:8000/docs`**

---

### Yöntem B: Docker Compose ile Tek Komutta Çalıştırma

Tüm mikroservisleri (Postgres, Redis, Qdrant, Backend, Celery Worker, Frontend) ayağa kaldırmak için:

```bash
cd deploy
docker compose up --build -d
```

---

### Yöntem C: Kubernetes (Production Cluster) Dağıtımı

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl apply -f deploy/k8s/01-configmap-secrets.yaml
kubectl apply -f deploy/k8s/02-postgres.yaml
kubectl apply -f deploy/k8s/03-redis.yaml
kubectl apply -f deploy/k8s/04-qdrant.yaml
kubectl apply -f deploy/k8s/05-backend.yaml
kubectl apply -f deploy/k8s/06-worker.yaml
kubectl apply -f deploy/k8s/07-frontend.yaml
kubectl apply -f deploy/k8s/08-ingress.yaml
```

---

## 📋 4. TODO & Gelecek Üretim Yol Haritası (Roadmap)

- [ ] **Stripe / LemonSqueezy Abonelik Entegrasyonu:** SaaS paketleri (Free, Pro, Enterprise) ve otomatik faturalandırma.
- [ ] **Gerçek PTY / Docker Sandbox:** Claude Code için arka planda bağımsız `gVisor` veya `Firecracker microVM` izolasyonu.
- [ ] **Local ComfyUI / Ollama Entegrasyonu:** Tamamen offline/on-premise çalışan GPU cluster desteği.
- [ ] **Canlı Ses Streaming (WebRTC):** OpenAI Realtime API ve Gemini Live Audio ile gecikmesiz sesli diyalog.
- [ ] **Gelişmiş RBAC & Organizasyon / Takım Desteği:** Kurumsal şirketler için çoklu kullanıcı ve çalışma alanı paylaşımı.
