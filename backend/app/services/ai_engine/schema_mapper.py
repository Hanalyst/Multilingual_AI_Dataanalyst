# app/services/ai_engine/schema_mapper.py

COLUMN_SYNONYMS = {
    "sales": ["sales", "revenue", "amount", "total"],
    "profit": ["profit", "margin"],
    "date": ["date", "order_date", "sale_date", "created_date"],
    "category": ["category", "type", "product_category"],
    "region": ["region", "area", "location"]
}


def map_schema(intent: dict, df):
    columns = df.columns.str.lower().tolist()

    mapping = {
        "metric_column": None,
        "group_by_column": None,
        "date_column": None,
        "filter_column": None,
        "date_grouping": None
    }

    # -------- Metric Column Mapping --------
    metric = intent.get("metric")

    if metric:
        for synonym in COLUMN_SYNONYMS.get(metric, []):
            for col in columns:
                if synonym in col:
                    mapping["metric_column"] = col
                    break
            if mapping["metric_column"]:
                break

    # -------- Group By Column Mapping --------
    group_by = intent.get("group_by")

    if group_by:
        for synonym in COLUMN_SYNONYMS.get(group_by, []):
            for col in columns:
                if synonym in col:
                    mapping["group_by_column"] = col
                    break
            if mapping["group_by_column"]:
                break

    # -------- Date Column Mapping --------
    for synonym in COLUMN_SYNONYMS["date"]:
        for col in columns:
            if synonym in col:
                mapping["date_column"] = col
                break
        if mapping["date_column"]:
            break

    # -------- Month / Year Grouping --------
    if group_by in ["month", "year"]:
        if mapping["date_column"]:
            mapping["group_by_column"] = mapping["date_column"]
            mapping["date_grouping"] = group_by

    # -------- Filter Column Mapping --------
    filter_value = intent.get("filter_value")

    if filter_value:
        for col in df.columns:
            try:
                if df[col].astype(str).str.lower().isin([filter_value.lower()]).any():
                    mapping["filter_column"] = col.lower()
                    break
            except Exception:
                continue

    return mapping