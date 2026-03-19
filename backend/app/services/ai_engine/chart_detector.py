import pandas as pd


def detect_chart_type(intent: dict, result_df: pd.DataFrame) -> str:
    """
    Detect the most appropriate chart type based on intent and result shape.

    Returns one of: "bar", "line", "area", "pie", "donut", "scatter", "number", "table"
    """
    if result_df is None or result_df.empty:
        return "table"

    rows = len(result_df)
    cols = list(result_df.columns)
    num_cols = len(cols)

    group_by = intent.get("group_by")
    trend = intent.get("trend")
    aggregation = intent.get("aggregation", "")
    question = intent.get("original_question", "").lower()

    # ── Single value result ─────────────────────────────────────────────────
    if rows == 1 and num_cols == 1:
        return "number"

    # ── Time-series / trend ─────────────────────────────────────────────────
    if trend:
        # Multiple metrics over time → area; single metric → line
        numeric_cols = [c for c in cols[1:] if pd.api.types.is_numeric_dtype(result_df[c])]
        if len(numeric_cols) > 1:
            return "area"
        return "line"

    # Detect time columns by name even if intent didn't flag trend
    time_keywords = ["date", "month", "year", "week", "quarter", "day", "time", "period"]
    first_col_lower = cols[0].lower() if cols else ""
    if any(kw in first_col_lower for kw in time_keywords):
        return "line"

    # ── Categorical grouped data ────────────────────────────────────────────
    if group_by or (rows > 1 and num_cols >= 2):
        numeric_cols = [c for c in cols[1:] if pd.api.types.is_numeric_dtype(result_df[c])]

        if not numeric_cols:
            return "table"

        # Few categories + share/proportion questions → pie or donut
        pie_keywords = ["share", "proportion", "percentage", "distribution", "breakdown", "composition", "portion"]
        if rows <= 6 and any(kw in question for kw in pie_keywords):
            return "donut" if rows >= 4 else "pie"

        # Few categories (≤5) + single metric → pie
        if rows <= 5 and len(numeric_cols) == 1:
            return "pie"

        # Many categories or multiple metrics → bar
        return "bar"

    # ── Two numeric columns → scatter ───────────────────────────────────────
    numeric_count = sum(
        1 for c in cols if pd.api.types.is_numeric_dtype(result_df[c])
    )
    if numeric_count == 2 and num_cols == 2:
        return "scatter"

    # ── Default ─────────────────────────────────────────────────────────────
    if rows <= 12:
        return "bar"

    return "table"