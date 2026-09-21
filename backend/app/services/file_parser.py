import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd
from app.services.llm_gateway import llm_gateway

class FileParserService:
    """
    Multimodal Document & Data Analysis Service:
    - PDF extraction & summarization (pypdf)
    - Word (.docx) parsing (python-docx)
    - Excel (.xlsx) / CSV tabular data analytics (pandas, openpyxl)
    - Automatic Chart recommendations & summary generation
    """

    async def parse_and_analyze(self, file_path: str, filename: str) -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1].lower().replace(".", "")
        extracted_text = ""
        analysis_data: Dict[str, Any] = {}
        summary = ""

        try:
            if ext == "pdf":
                extracted_text, num_pages = self._parse_pdf(file_path)
                analysis_data = {"page_count": num_pages, "type": "pdf_document"}
            elif ext in ["xlsx", "xls", "csv"]:
                df_dict = self._parse_tabular(file_path, ext)
                extracted_text, analysis_data = self._summarize_dataframe(df_dict)
            elif ext in ["docx", "doc"]:
                extracted_text = self._parse_docx(file_path)
                analysis_data = {"type": "word_document"}
            elif ext == "json":
                with open(file_path, "r", encoding="utf-8") as f:
                    json_data = json.load(f)
                extracted_text = json.dumps(json_data, indent=2, ensure_ascii=False)[:10000]
                analysis_data = {"type": "json_structure", "keys": list(json_data.keys()) if isinstance(json_data, dict) else len(json_data)}
            else:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    extracted_text = f.read(10000)
                analysis_data = {"type": "plain_text"}

            # Generate AI summary and insights
            summary = await self._generate_ai_document_summary(filename, ext, extracted_text[:4000], analysis_data)
        except Exception as e:
            extracted_text = f"Dosya işleme uyarısı: {str(e)}"
            summary = f"{filename} yüklendi. Hata: {str(e)}"

        return {
            "filename": filename,
            "file_type": ext,
            "extracted_text": extracted_text[:20000],
            "analysis_results": analysis_data,
            "summary": summary
        }

    def _parse_pdf(self, file_path: str) -> tuple[str, int]:
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                pages_text.append(f"--- Sayfa {i+1} ---\n{txt}")
            return "\n\n".join(pages_text), len(reader.pages)
        except Exception:
            return "PDF içeriği okunamadı veya dosya boş.", 1

    def _parse_docx(self, file_path: str) -> str:
        try:
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except Exception:
            return "Word içeriği okunamadı.", 1

    def _parse_tabular(self, file_path: str, ext: str) -> Dict[str, pd.DataFrame]:
        if ext == "csv":
            df = pd.read_csv(file_path)
            return {"Sheet1": df}
        else:
            return pd.read_excel(file_path, sheet_name=None)

    def _summarize_dataframe(self, dfs: Dict[str, pd.DataFrame]) -> tuple[str, Dict[str, Any]]:
        extracted_chunks = []
        sheets_meta = {}

        for sheet_name, df in dfs.items():
            num_rows, num_cols = df.shape
            cols = list(df.columns)
            head_records = df.head(10).to_dict(orient="records")
            describe = df.describe(include="all").fillna("").to_dict()

            extracted_chunks.append(
                f"=== Sayfa: {sheet_name} ({num_rows} satır, {num_cols} sütun) ===\n"
                f"Sütunlar: {', '.join(map(str, cols))}\n"
                f"Örnek Veriler (İlk 10 satır):\n{df.head(10).to_string()}\n"
            )

            sheets_meta[sheet_name] = {
                "rows": num_rows,
                "columns": [str(c) for c in cols],
                "sample": head_records,
                "statistics": describe
            }

        return "\n\n".join(extracted_chunks), {"sheets": sheets_meta, "type": "tabular_dataset"}

    async def _generate_ai_document_summary(self, filename: str, ext: str, sample_text: str, meta: Dict[str, Any]) -> str:
        prompt = f"""Dosya Adı: {filename} ({ext})
İçerik Özeti / Yapı:
{sample_text[:3000]}

Yukarıdaki dokümanı analiz et:
1. Dokümanın konusu nedir?
2. Öne çıkan kritik bulgular ve veriler nelerdir?
3. (Tablo ise) Hangi grafikler (bar, line, pie) çizilmeye uygundur?

Kısa, net ve profesyonel bir özet yaz."""

        res = await llm_gateway.generate_response(
            messages=[
                {"role": "system", "content": "Sen kıdemli bir veri analisti ve doküman uzmanısın."},
                {"role": "user", "content": prompt}
            ],
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=600
        )
        return res.get("content", f"{filename} başarıyla işlendi ve indekslendi.")

file_parser_service = FileParserService()
