# app/services/sql_generator.py

def generate_sql(intent: dict, table_name: str, columns: list) -> str:
    """
    Generates a SQL query from parsed intent and actual CSV column names.
    
    intent = {
        "metric": "sales",
        "aggregation": "sum",
        "group_by": "category",
        "trend": False,
        "time_filter": None,
        "filter_value": None,
        "date_grouping": None
    }
    """

    metric = intent.get("metric")
    aggregation = intent.get("aggregation", "sum")
    group_by = intent.get("group_by")
    time_filter = intent.get("time_filter")
    filter_value = intent.get("filter_value")
    date_grouping = intent.get("date_grouping")

    # ── Match intent fields to actual column names ──────────────────────────
    col_lower = {c.lower(): c for c in columns}  # {"sales": "Sales", ...}

    metric_col = col_lower.get(metric) if metric else None
    group_col  = col_lower.get(group_by) if group_by else None

    # ── SELECT clause ────────────────────────────────────────────────────────
    if metric_col and group_col:
        if aggregation == "sum":
            select_clause = f'SELECT "{group_col}", SUM("{metric_col}") AS total_{metric}'
        elif aggregation == "avg":
            select_clause = f'SELECT "{group_col}", AVG("{metric_col}") AS avg_{metric}'
        elif aggregation == "count":
            select_clause = f'SELECT "{group_col}", COUNT("{metric_col}") AS count_{metric}'
        else:
            select_clause = f'SELECT "{group_col}", SUM("{metric_col}") AS total_{metric}'

    elif metric_col:
        if aggregation == "sum":
            select_clause = f'SELECT SUM("{metric_col}") AS total_{metric}'
        elif aggregation == "avg":
            select_clause = f'SELECT AVG("{metric_col}") AS avg_{metric}'
        elif aggregation == "count":
            select_clause = f'SELECT COUNT("{metric_col}") AS count_{metric}'
        else:
            select_clause = f'SELECT SUM("{metric_col}") AS total_{metric}'

    else:
        # Fallback — return all rows
        select_clause = "SELECT *"

    # ── FROM clause ──────────────────────────────────────────────────────────
    from_clause = f'FROM "{table_name}"'

    # ── WHERE clause ─────────────────────────────────────────────────────────
    where_clauses = []

    if time_filter:
        date_col = col_lower.get("date") or col_lower.get("order_date") or col_lower.get("created_at")
        if date_col:
            if time_filter == "last_month":
                where_clauses.append(
                    f'"{date_col}" >= date(\'now\', \'-1 month\')'
                )
            elif time_filter == "last_3_months":
                where_clauses.append(
                    f'"{date_col}" >= date(\'now\', \'-3 months\')'
                )
            elif time_filter == "last_6_months":
                where_clauses.append(
                    f'"{date_col}" >= date(\'now\', \'-6 months\')'
                )
            elif time_filter == "last_year":
                where_clauses.append(
                    f'"{date_col}" >= date(\'now\', \'-1 year\')'
                )
            elif time_filter == "this_year":
                where_clauses.append(
                    f'strftime(\'%Y\', "{date_col}") = strftime(\'%Y\', \'now\')'
                )

    if filter_value:
        # Try to find a string/category column to filter on
        filter_col = group_col or next(
            (col for col in columns if col.lower() not in ["id", "date"]), None
        )
        if filter_col:
            where_clauses.append(f'LOWER("{filter_col}") = \'{filter_value.lower()}\'')

    where_clause = f'WHERE {" AND ".join(where_clauses)}' if where_clauses else ""

    # ── GROUP BY clause ──────────────────────────────────────────────────────
    group_clause = f'GROUP BY "{group_col}"' if group_col else ""

    # ── ORDER BY clause ──────────────────────────────────────────────────────
    if group_col and metric_col:
        order_clause = f'ORDER BY total_{metric} DESC'
    else:
        order_clause = ""

    # ── Assemble ─────────────────────────────────────────────────────────────
    parts = [select_clause, from_clause]
    if where_clause:
        parts.append(where_clause)
    if group_clause:
        parts.append(group_clause)
    if order_clause:
        parts.append(order_clause)

    sql = "\n".join(parts)
    return sql