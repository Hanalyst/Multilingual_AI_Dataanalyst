from groq import Groq
import os
import pandas as pd

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# All 14 supported languages
LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "pt": "Portuguese",
    "zh": "Chinese",
    "ar": "Arabic",
}


def generate_insight_with_ai(
    question: str,
    sql: str,
    df: pd.DataFrame,
    language: str = "en",
) -> str:
    if df.empty:
        return "No data found for your query."

    lang_name = LANGUAGE_NAMES.get(language, "English")

    try:
        cols = list(df.columns)
        rows = len(df)

        # Build a compact data preview (max 10 rows)
        preview_lines = []
        for row in df.head(10).to_dict(orient="records"):
            parts = []
            for k, v in row.items():
                parts.append(f"{k}={round(v, 3) if isinstance(v, float) else v}")
            preview_lines.append("  " + ", ".join(parts))
        preview_text = "\n".join(preview_lines)

        # Build numeric stats
        stats_lines = []
        for col in cols:
            try:
                if pd.api.types.is_numeric_dtype(df[col]):
                    stats_lines.append(
                        f"{col}: min={round(df[col].min(), 2)}, "
                        f"max={round(df[col].max(), 2)}, "
                        f"sum={round(df[col].sum(), 2)}, "
                        f"avg={round(df[col].mean(), 2)}"
                    )
            except Exception:
                pass
        stats_text = "\n".join(stats_lines)

        # Detect top/bottom performers if we have 2 columns
        performance_text = ""
        if len(cols) == 2:
            try:
                label_col, value_col = cols[0], cols[1]
                if pd.api.types.is_numeric_dtype(df[value_col]):
                    sorted_df = df.sort_values(value_col, ascending=False)
                    top = sorted_df.iloc[0]
                    bottom = sorted_df.iloc[-1]
                    total = df[value_col].sum()
                    top_pct = round(float(top[value_col]) / total * 100, 1) if total else 0
                    performance_text = (
                        f"\nTop performer: {top[label_col]} = {round(float(top[value_col]), 2)} ({top_pct}% of total)"
                        f"\nLowest: {bottom[label_col]} = {round(float(bottom[value_col]), 2)}"
                    )
            except Exception:
                pass

        prompt = (
            f"User asked: {question}\n\n"
            f"SQL:\n{sql}\n\n"
            f"Result ({rows} rows):\n{preview_text}\n"
            f"Stats:\n{stats_text}"
            f"{performance_text}\n\n"
            f"Write a clear business insight in 3-4 sentences in {lang_name}.\n"
            "Structure your response as:\n"
            "1. Key finding (most important number/trend)\n"
            "2. Notable pattern or comparison\n"
            "3. Actionable recommendation\n"
            "Be specific with numbers. Avoid vague statements."
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior business data analyst. "
                        "Provide clear, specific, actionable insights backed by the data. "
                        f"Always respond in {lang_name} language only. "
                        "Do not repeat the question. Do not use bullet points — write in flowing prose."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=250,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Insight error: {e}")
        return _build_fallback_insight(df)


def _build_fallback_insight(df: pd.DataFrame) -> str:
    """Rule-based fallback when the LLM call fails."""
    if df.empty:
        return "No data found."

    cols = list(df.columns)
    rows = len(df)

    if len(cols) == 2:
        try:
            label_col, value_col = cols[0], cols[1]
            if pd.api.types.is_numeric_dtype(df[value_col]):
                sorted_df = df.sort_values(value_col, ascending=False)
                top = sorted_df.iloc[0]
                total = round(float(df[value_col].sum()), 2)
                top_val = round(float(top[value_col]), 2)
                pct = round(top_val / total * 100, 1) if total else 0
                avg = round(float(df[value_col].mean()), 2)
                return (
                    f"'{top[label_col]}' leads with {top_val:,} ({pct}% of total {total:,}). "
                    f"Average across {rows} groups is {avg:,}."
                )
        except Exception:
            pass

    return f"Query returned {rows} rows across {len(cols)} columns."