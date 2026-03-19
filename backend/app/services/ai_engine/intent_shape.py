# app/services/ai_engine/intent_shape.py

def get_intent_shape(intent: dict) -> str:
    """
    Classifies the user intent into logical shapes.
    This helps determine how the query should be executed
    and what type of chart/result to return.
    """

    if not intent:
        return "unknown"

    metric = intent.get("metric")
    group_by = intent.get("group_by")
    trend = intent.get("trend")

    # Trend analysis
    if metric and trend:
        return "trend_metric"

    # Grouped analysis
    if metric and group_by:
        return "grouped_metric"

    # Single metric (total sales, total profit etc)
    if metric:
        return "single_metric"

    return "unknown"