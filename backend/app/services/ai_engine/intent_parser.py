import re

AGGREGATION_KEYWORDS = {
    "sum": ["total", "sum", "overall"],
    "avg": ["average", "mean", "avg"],
    "count": ["count", "number of", "how many"],
    "max": ["maximum", "max", "highest", "most", "top"],
    "min": ["minimum", "min", "lowest", "least"]
}

TREND_KEYWORDS = ["trend", "over time", "growth", "monthly", "daily", "yearly", "by month", "by year", "by date"]
COMPARE_KEYWORDS = ["compare", "versus", "vs", "difference between", "which is higher", "which is better"]
TOP_N_PATTERN = re.compile(r"top\s+(\d+)")
FILTER_PATTERN = re.compile(r"(?:for|where|in|from)\s+([a-zA-Z][a-zA-Z\s]*?)(?:\s*$|\s+(?:by|in|from|where|last|this))")

SKIP_METRIC_COLS = ["id", "order_id", "product_id", "user_id", "customer_id", "index"]
NUMERIC_HINTS = ["sales", "revenue", "profit", "amount", "quantity", "qty", "price", "cost", "income", "total", "units"]
TEXT_HINTS = ["category", "region", "type", "name", "product", "city", "country", "status", "segment", "channel"]
DATE_HINTS = ["date", "time", "month", "year", "day", "created", "updated", "order_date", "timestamp"]

TIME_MAP = {
    "last_month": ["last month", "previous month"],
    "last_3_months": ["last 3 months", "past 3 months"],
    "last_6_months": ["last 6 months", "past 6 months"],
    "last_year": ["last year", "previous year"],
    "this_year": ["this year", "current year"]
}


def parse_intent(query: str, columns: list = None, column_types: dict = None, previous_intent: dict = None) -> dict:
    q = query.lower().strip()

    intent = {
        "metric": None,
        "aggregation": "sum",
        "group_by": None,
        "trend": False,
        "time_filter": None,
        "filter_column": None,
        "filter_value": None,
        "date_grouping": None,
        "top_n": None,
        "compare": False,
        "query_type": "aggregation"
    }

    col_lower_map = {}
    numeric_cols = []
    text_cols = []
    date_cols = []

    if columns:
        col_lower_map = {c.lower(): c for c in columns}

        for col in columns:
            cl = col.lower()
            dtype = column_types.get(col, "") if column_types else ""

            if any(skip in cl for skip in SKIP_METRIC_COLS):
                continue

            if any(h in cl for h in DATE_HINTS):
                date_cols.append(cl)
            elif "int" in dtype or "float" in dtype or any(h in cl for h in NUMERIC_HINTS):
                numeric_cols.append(cl)
            elif "object" in dtype or any(h in cl for h in TEXT_HINTS):
                text_cols.append(cl)

    if any(kw in q for kw in TREND_KEYWORDS):
        intent["trend"] = True
        intent["query_type"] = "trend"
        if date_cols:
            intent["group_by"] = date_cols[0]
        intent["date_grouping"] = "month"
        if "by year" in q or "yearly" in q:
            intent["date_grouping"] = "year"
        elif "by day" in q or "daily" in q:
            intent["date_grouping"] = "day"

    if any(kw in q for kw in COMPARE_KEYWORDS):
        intent["compare"] = True
        intent["query_type"] = "compare"

    top_match = TOP_N_PATTERN.search(q)
    if top_match:
        intent["top_n"] = int(top_match.group(1))
        intent["query_type"] = "top_n"

    for agg, keywords in AGGREGATION_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            intent["aggregation"] = agg
            break

    words = q.replace(",", "").split()
    for word in words:
        if word in numeric_cols:
            intent["metric"] = word
            break

    if not intent["metric"]:
        for nc in numeric_cols:
            if nc in q:
                intent["metric"] = nc
                break

    if not intent["metric"] and numeric_cols:
        intent["metric"] = numeric_cols[0]

    if not intent["trend"]:
        for word in words:
            if word in text_cols:
                intent["group_by"] = word
                break

        if not intent["group_by"] and "by" in words:
            idx = words.index("by")
            if idx + 1 < len(words):
                nw = words[idx + 1]
                if nw in col_lower_map:
                    intent["group_by"] = nw

        if not intent["group_by"] and text_cols:
            intent["group_by"] = text_cols[0]

    for key, phrases in TIME_MAP.items():
        if any(p in q for p in phrases):
            intent["time_filter"] = key
            break

    filter_match = FILTER_PATTERN.search(q)
    if filter_match:
        val = filter_match.group(1).strip()
        time_words = ["last", "this", "past", "previous", "month", "year", "week"]
        if not any(tw in val.split() for tw in time_words) and len(val) > 2:
            intent["filter_value"] = val
            if text_cols:
                intent["filter_column"] = text_cols[0]

    if previous_intent:
        for key in ["metric", "group_by", "filter_column", "filter_value"]:
            if intent[key] is None:
                intent[key] = previous_intent.get(key)

    return intent
