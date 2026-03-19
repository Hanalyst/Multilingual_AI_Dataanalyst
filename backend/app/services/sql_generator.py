def generate_sql(intent: dict, table_name: str, columns: list) -> str:
    metric       = intent.get("metric")
    aggregation  = intent.get("aggregation", "sum")
    group_by     = intent.get("group_by")
    time_filter  = intent.get("time_filter")
    filter_value = intent.get("filter_value")

    col_lower  = {c.lower(): c for c in columns}
    metric_col = col_lower.get(metric) if metric else None
    group_col  = col_lower.get(group_by) if group_by else None

    # ?? Alias name (used in SELECT and ORDER BY) ??????????????????????????????
    agg_prefix_map = {"sum": "total", "avg": "avg", "count": "count", "max": "max", "min": "min"}
    prefix         = agg_prefix_map.get(aggregation, "total")
    alias          = f"{prefix}_{metric}" if metric else "value"

    # ?? SELECT ????????????????????????????????????????????????????????????????
    if metric_col and group_col:
        if aggregation == "sum":
            select_clause = f'SELECT "{group_col}", SUM("{metric_col}") AS "{alias}"'
        elif aggregation == "avg":
            select_clause = f'SELECT "{group_col}", AVG("{metric_col}") AS "{alias}"'
        elif aggregation == "count":
            select_clause = f'SELECT "{group_col}", COUNT("{metric_col}") AS "{alias}"'
        elif aggregation == "max":
            select_clause = f'SELECT "{group_col}", MAX("{metric_col}") AS "{alias}"'
        elif aggregation == "min":
            select_clause = f'SELECT "{group_col}", MIN("{metric_col}") AS "{alias}"'
        else:
            select_clause = f'SELECT "{group_col}", SUM("{metric_col}") AS "{alias}"'

    elif metric_col:
        if aggregation == "sum":
            select_clause = f'SELECT SUM("{metric_col}") AS "{alias}"'
        elif aggregation == "avg":
            select_clause = f'SELECT AVG("{metric_col}") AS "{alias}"'
        elif aggregation == "count":
            select_clause = f'SELECT COUNT("{metric_col}") AS "{alias}"'
        elif aggregation == "max":
            select_clause = f'SELECT MAX("{metric_col}") AS "{alias}"'
        elif aggregation == "min":
            select_clause = f'SELECT MIN("{metric_col}") AS "{alias}"'
        else:
            select_clause = f'SELECT SUM("{metric_col}") AS "{alias}"'

    else:
        select_clause = "SELECT *"

    # ?? FROM ??????????????????????????????????????????????????????????????????
    from_clause = f'FROM "{table_name}"'

    # ?? WHERE ?????????????????????????????????????????????????????????????????
    where_clauses = []

    if time_filter:
        date_col = (
            col_lower.get("date") or
            col_lower.get("order_date") or
            col_lower.get("created_at")
        )
        if date_col:
            if time_filter == "last_month":
                where_clauses.append(f'"{date_col}" >= date(\'now\', \'-1 month\')')
            elif time_filter == "last_3_months":
                where_clauses.append(f'"{date_col}" >= date(\'now\', \'-3 months\')')
            elif time_filter == "last_6_months":
                where_clauses.append(f'"{date_col}" >= date(\'now\', \'-6 months\')')
            elif time_filter == "last_year":
                where_clauses.append(f'"{date_col}" >= date(\'now\', \'-1 year\')')
            elif time_filter == "this_year":
                where_clauses.append(f'strftime(\'%Y\', "{date_col}") = strftime(\'%Y\', \'now\')')

    if filter_value:
        filter_col = group_col or next(
            (col for col in columns if col.lower() not in ["id", "date"]), None
        )
        if filter_col:
            where_clauses.append(f'LOWER("{filter_col}") = \'{filter_value.lower()}\'')

    where_clause = f'WHERE {" AND ".join(where_clauses)}' if where_clauses else ""

    # ?? GROUP BY ??????????????????????????????????????????????????????????????
    group_clause = f'GROUP BY "{group_col}"' if group_col else ""

    # ?? ORDER BY ??????????????????????????????????????????????????????????????
    order_clause = f'ORDER BY "{alias}" DESC' if (group_col and metric_col) else ""

    # ?? Assemble ??????????????????????????????????????????????????????????????
    parts = [select_clause, from_clause]
    if where_clause:  parts.append(where_clause)
    if group_clause:  parts.append(group_clause)
    if order_clause:  parts.append(order_clause)

    return "\n".join(parts)
