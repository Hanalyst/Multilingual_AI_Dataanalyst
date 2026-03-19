from groq import Groq
import os
import pandas as pd

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "fr": "French",
    "de": "German",
    "es": "Spanish",
    "pt": "Portuguese",
    "zh": "Chinese",
    "zh-cn": "Chinese",
    "zh-tw": "Chinese",
    "ar": "Arabic",
    "ja": "Japanese",
}

def generate_insight_with_ai(question, sql, df, language="en"):
    if df.empty:
        return "No data found for your query."

    lang_name = LANGUAGE_NAMES.get(language, "English")

    try:
        cols = list(df.columns)
        rows = len(df)

        preview_text = ""
        for row in df.head(10).to_dict(orient="records"):
            parts = [f"{k}={round(v,3) if isinstance(v,float) else v}" for k,v in row.items()]
            preview_text += "  " + ", ".join(parts) + "\n"

        stats_text = ""
        for col in cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                stats_text += (
                    f"{col}: min={round(df[col].min(),2)}, max={round(df[col].max(),2)}, "
                    f"sum={round(df[col].sum(),2)}, avg={round(df[col].mean(),2)}\n"
                )

        performance_text = ""
        if len(cols) == 2 and pd.api.types.is_numeric_dtype(df[cols[1]]):
            sorted_df = df.sort_values(cols[1], ascending=False)
            top = sorted_df.iloc[0]
            bottom = sorted_df.iloc[-1]
            total = df[cols[1]].sum()
            pct = round(float(top[cols[1]]) / total * 100, 1) if total else 0
            performance_text = (
                f"\nTop: {top[cols[0]]} = {round(float(top[cols[1]]),2)} ({pct}% of total)"
                f"\nLowest: {bottom[cols[0]]} = {round(float(bottom[cols[1]]),2)}"
            )

        prompt = (
            f"User asked: {question}\n\nSQL:\n{sql}\n\n"
            f"Result ({rows} rows):\n{preview_text}\nStats:\n{stats_text}{performance_text}\n\n"
            f"Write a 3-4 sentence business insight in {lang_name}.\n"
            "Cover: 1) Key finding with numbers  2) Notable pattern  3) Recommendation\n"
            "Write in flowing prose, no bullet points."
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are a senior business analyst. You MUST respond ONLY in {lang_name} language. Do not use any other language."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Insight error: {e}")
        return _fallback_insight(df)

def _fallback_insight(df):
    if df.empty:
        return "No data found."
    cols = list(df.columns)
    rows = len(df)
    if len(cols) == 2 and pd.api.types.is_numeric_dtype(df[cols[1]]):
        top = df.sort_values(cols[1], ascending=False).iloc[0]
        total = round(float(df[cols[1]].sum()), 2)
        pct = round(float(top[cols[1]]) / total * 100, 1) if total else 0
        return f"{top[cols[0]]} leads with {round(float(top[cols[1]]),2):,} ({pct}% of {total:,}). {rows} groups total."
    return f"{rows} rows, {len(cols)} columns."
