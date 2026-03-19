from groq import Groq
import os
import re
import datetime

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

def build_schema_context(columns, column_types, sample_rows=None):
    schema_lines = []
    for col in columns:
        dtype = column_types.get(col, "unknown")
        if "int" in dtype or "float" in dtype:
            col_type = "NUMERIC"
        elif "datetime" in dtype or "date" in dtype:
            col_type = "DATE"
        else:
            col_type = "TEXT"
        schema_lines.append("  " + col + " (" + col_type + ")")
    schema = "Table: data\nColumns:\n" + "\n".join(schema_lines)
    if sample_rows and len(sample_rows) > 0:
        sample_lines = []
        for col in columns:
            dtype = column_types.get(col, "")
            if "object" in dtype:
                vals = list(set(
                    str(row[col]) for row in sample_rows
                    if row.get(col) is not None
                ))[:5]
                if vals:
                    sample_lines.append("  " + col + ": " + ", ".join(vals))
        if sample_lines:
            schema += "\n\nSample values:\n" + "\n".join(sample_lines)
    return schema

def fix_integer_division(sql):
    pattern = re.compile(
        r"((?:SUM|AVG|COUNT|MAX|MIN)\s*\([^)]+\))\s*/\s*((?:SUM|AVG|COUNT|MAX|MIN)\s*\([^)]+\))",
        re.IGNORECASE
    )
    def replace_div(m):
        return "CAST(" + m.group(1) + " AS FLOAT) / CAST(" + m.group(2) + " AS FLOAT)"
    return pattern.sub(replace_div, sql)

def generate_sql_with_ai(question, columns, column_types, sample_rows=None, dialect="sqlite", language="en"):
    schema = build_schema_context(columns, column_types, sample_rows)
    today = datetime.date.today().strftime("%Y-%m-%d")

    system_prompt = (
        "You are an expert SQL analyst. Generate SQLite SQL queries.\n\n"
        f"CURRENT DATE: {today}\n\n"
        "RULES:\n"
        "1. Only use columns from the schema\n"
        "2. Always use double quotes around column and table names\n"
        "3. Table name is always \"data\"\n"
        "4. For date grouping use strftime('%Y-%m', \"column\") for monthly\n"
        "5. Always include ORDER BY for aggregations\n"
        "6. For division always cast: CAST(SUM(\"a\") AS FLOAT) / CAST(SUM(\"b\") AS FLOAT)\n"
        "7. Return ONLY the SQL query, no explanation, no markdown, no backticks\n"
        "8. The question may be in any language - translate it to understand, then return SQL only\n"
        "9. For column aliases in SELECT, use English names only (e.g. AS total_sales, AS category)\n"
        "10. Keep all column names and aliases in English regardless of question language\n"
        "9. For 'last month' use strftime('%Y-%m', \"date_col\") = strftime('%Y-%m', date('now','-1 month'))\n"
        "10. For 'this month' use strftime('%Y-%m', \"date_col\") = strftime('%Y-%m', 'now')\n"
        "11. For 'last 3 months' use date_col >= date('now','-3 months')\n\n"
        "SCHEMA:\n" + schema
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Question: " + question + "\n\nGenerate SQL:"}
            ],
            temperature=0.1,
            max_tokens=500
        )
        sql = response.choices[0].message.content.strip()
        sql = re.sub(r"```sql", "", sql)
        sql = re.sub(r"```", "", sql)
        sql = sql.strip()
        sql = fix_integer_division(sql)
        return sql
    except Exception as e:
        print("Groq API error: " + str(e))
        return None

