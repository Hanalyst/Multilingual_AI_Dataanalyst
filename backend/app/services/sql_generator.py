def generate_sql(intent: dict, table_name: str, columns: list) -> str:
    metric = intent.get("metric")
    aggregation = intent.get("aggregation", "sum")
    group_by = intent.get("group_by")
    time_filter = intent.get("time_filter")
    filter_value = intent.get("filter_value")
    filter_column = intent.get("filter_column")
    top_n = intent.get("top_n")
    trend = intent.get("trend")
    date_grouping = intent.get("date_grouping", "month")

    col_lower = {c.lower(): c for c in columns}
    metric_col = col_lower.get(metric) if metric else None
    group_col = col_lower.get(group_by) if group_by else None

    t = '"' + table_name + '"'

    # -- SELECT clause ---------------------------------------------------------
    if trend and group_col:
        # Date grouping
        if date_grouping == "month":
            date_expr = "strftime('%Y-%m', " + '"' + group_col + '"' + ")"
            label = "month"
        elif date_grouping == "year":
            date_expr = "strftime('%Y', " + '"' + group_col + '"' + ")"
            label = "year"
        else:
            date_expr = '"' + group_col + '"'
            label = "date"

        if metric_col:
            agg_expr = build_agg(aggregation, metric_col)
            select_clause = "SELECT " + date_expr + " AS " + label + ", " + agg_expr
            group_clause = "GROUP BY " + date_expr
            order_clause = "ORDER BY " + label + " ASC"
        else:
            select_clause = "SELECT *"
            group_clause = ""
            order_clause = ""

    elif metric_col and group_col:
        agg_expr = build_agg(aggregation, metric_col)
        select_clause = "SELECT " + '"' + group_col + '"' + ", " + agg_expr
        group_clause = "GROUP BY " + '"' + group_col + '"'
        order_clause = "ORDER BY " + get_alias(aggregation, metric) + " DESC"

    elif metric_col:
        agg_expr = build_agg(aggregation, metric_col)
        select_clause = "SELECT " + agg_expr
        group_clause = ""
        order_clause = ""

    else:
        select_clause = "SELECT *"
        group_clause = ""
        order_clause = ""

    # -- WHERE clause ----------------------------------------------------------
    where_clauses = []

    if time_filter:
        date_col = next((col_lower[c] for c in col_lower if "date" in c or "time" in c), None)
        if date_col:
            date_filters = {
                "last_month": '"' + date_col + '"' + " >= date('now', '-1 month')",
                "last_3_months": '"' + date_col + '"' + " >= date('now', '-3 months')",
                "last_6_months": '"' + date_col + '"' + " >= date('now', '-6 months')",
                "last_year": '"' + date_col + '"' + " >= date('now', '-1 year')",
                "this_year": "strftime('%Y', " + '"' + date_col + '"' + ") = strftime('%Y', 'now')"
            }
            if time_filter in date_filters:
                where_clauses.append(date_filters[time_filter])

    if filter_value and filter_column:
        fc = col_lower.get(filter_column, filter_column)
        where_clauses.append("LOWER(" + '"' + fc + '"' + ") = '" + filter_value.lower().strip() + "'")

    where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # -- LIMIT for top N -------------------------------------------------------
    limit_clause = "LIMIT " + str(top_n) if top_n else ""

    # -- Assemble --------------------------------------------------------------
    parts = [select_clause, "FROM " + t]
    if where_clause:
        parts.append(where_clause)
    if group_clause:
        parts.append(group_clause)
    if order_clause:
        parts.append(order_clause)
    if limit_clause:
        parts.append(limit_clause)

    return "\n".join(parts)


def build_agg(aggregation: str, metric_col: str) -> str:
    alias = get_alias(aggregation, metric_col)
    agg_map = {
        "sum": "SUM",
        "avg": "AVG",
        "count": "COUNT",
        "max": "MAX",
        "min": "MIN"
    }
    fn = agg_map.get(aggregation, "SUM")
    return fn + '("' + metric_col + '") AS ' + alias


def get_alias(aggregation: str, metric: str) -> str:
    return aggregation + "_" + (metric or "value")
