import pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta


def build_sql_string(intent, schema_map):
    metric_col = schema_map.get("metric_column")
    group_col = schema_map.get("group_by_column")
    date_col = schema_map.get("date_column")
    filter_col = schema_map.get("filter_column")

    aggregation = intent.get("aggregation")
    time_filter = intent.get("time_filter")
    filter_value = intent.get("filter_value")

    table_name = "uploaded_dataset"

    if not metric_col:
        return "-- Unable to generate SQL"

    agg_func = "SUM" if aggregation == "sum" else "AVG"

    date_grouping = schema_map.get("date_grouping")

    # ---------- SELECT ----------
    if group_col:
        if date_grouping == "month":
            select_clause = f"SELECT MONTH({group_col}) AS month, {agg_func}({metric_col}) AS total_{metric_col}"
        elif date_grouping == "year":
            select_clause = f"SELECT YEAR({group_col}) AS year, {agg_func}({metric_col}) AS total_{metric_col}"
        else:
            select_clause = f"SELECT {group_col}, {agg_func}({metric_col}) AS total_{metric_col}"
    else:
        select_clause = f"SELECT {agg_func}({metric_col}) AS total_{metric_col}"

    sql = f"{select_clause}\nFROM {table_name}"

    # ---------- WHERE ----------
    where_clauses = []

    if filter_col and filter_value:
        where_clauses.append(f"{filter_col} = '{filter_value}'")

    if time_filter and date_col:

        if time_filter == "last_month":
            interval = "1 MONTH"
        elif time_filter == "last_3_months":
            interval = "3 MONTH"
        elif time_filter == "last_6_months":
            interval = "6 MONTH"
        elif time_filter == "last_year":
            interval = "1 YEAR"
        elif time_filter == "this_year":
            interval = "1 YEAR"
        else:
            interval = None

        if interval:
            where_clauses.append(
                f"{date_col} >= DATE_SUB(CURDATE(), INTERVAL {interval})"
            )

    if where_clauses:
        sql += "\nWHERE " + " AND ".join(where_clauses)

    # ---------- GROUP BY ----------
    if group_col:
        if date_grouping == "month":
            sql += f"\nGROUP BY MONTH({group_col})"
        elif date_grouping == "year":
            sql += f"\nGROUP BY YEAR({group_col})"
        else:
            sql += f"\nGROUP BY {group_col}"

    return sql + ";"


def apply_time_filter(df, date_col, time_filter):

    if not time_filter or not date_col:
        return df

    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    today = df[date_col].max()

    if time_filter == "last_month":
        start_date = today - relativedelta(months=1)

    elif time_filter == "last_3_months":
        start_date = today - relativedelta(months=3)

    elif time_filter == "last_6_months":
        start_date = today - relativedelta(months=6)

    elif time_filter == "last_year":
        start_date = today - relativedelta(years=1)

    else:
        return df

    return df[df[date_col] >= start_date]


def run_query_plan(df, intent: dict, schema_map: dict):

    metric_col = schema_map.get("metric_column")
    group_col = schema_map.get("group_by_column")
    date_col = schema_map.get("date_column")
    filter_col = schema_map.get("filter_column")
    filter_value = intent.get("filter_value")

    date_grouping = schema_map.get("date_grouping")

    if not metric_col:
        raise ValueError("Metric column could not be resolved.")

    generated_sql = build_sql_string(intent, schema_map)

    # ---------- APPLY TIME FILTER ----------
    df_filtered = apply_time_filter(df, date_col, intent.get("time_filter"))

    # ---------- APPLY VALUE FILTER ----------
    if filter_col and filter_value:
        df_filtered = df_filtered[
            df_filtered[filter_col].astype(str).str.lower() == filter_value.lower()
        ]

    # ---------- GROUPED AGGREGATION ----------
    if group_col:

        df_group = df_filtered.copy()

        if date_grouping == "month":
            df_group[group_col] = pd.to_datetime(df_group[group_col]).dt.month
            df_group = df_group.rename(columns={group_col: "month"})
            group_col = "month"

        elif date_grouping == "year":
            df_group[group_col] = pd.to_datetime(df_group[group_col]).dt.year

        if intent.get("aggregation") == "sum":
            result = df_group.groupby(group_col, as_index=False)[metric_col].sum()

        elif intent.get("aggregation") == "avg":
            result = df_group.groupby(group_col, as_index=False)[metric_col].mean()

        else:
            raise ValueError("Unsupported aggregation")

        result = result.rename(columns={metric_col: f"total_{metric_col}"})

    # ---------- TREND ----------
    elif intent.get("trend") and date_col:

        result = (
            df_filtered
            .groupby(date_col)[metric_col]
            .sum()
            .reset_index()
            .sort_values(by=date_col)
        )

    # ---------- SINGLE METRIC ----------
    else:

        if intent.get("aggregation") == "sum":
            value = df_filtered[metric_col].sum()

        elif intent.get("aggregation") == "avg":
            value = df_filtered[metric_col].mean()

        else:
            raise ValueError("Unsupported aggregation")

        result = pd.DataFrame({metric_col: [value]})

    return result, generated_sql