# app/services/ai_engine/context_resolver.py

from .intent_shape import get_intent_shape


def resolve_context(current_intent: dict, last_intent: dict | None):
    """
    Decide whether to reuse previous context,
    override it, or ask clarification
    """

    if not last_intent:
        return "override_context"

    current_shape = get_intent_shape(current_intent)
    last_shape = get_intent_shape(last_intent)

    # Explicit override cases
    if current_intent.get("group_by"):
        return "override_context"

    if current_intent.get("trend") or current_intent.get("time_filter"):
        return "override_context"

    # Ambiguous follow-up
    # Example:
    # show sales by category
    # what about profit
    if last_shape == "grouped_metric" and current_shape == "single_metric":
        return "reuse_context"

    # Safe reuse
    if current_shape == "single_metric" and last_intent.get("group_by"):
        return "reuse_context"

    return "override_context"


def resolve_follow_up(current_intent, last_intent):
    """
    Merge missing intent fields from previous conversation turn
    """

    if not last_intent:
        return current_intent

    # carry forward missing context
    if not current_intent.get("group_by"):
        current_intent["group_by"] = last_intent.get("group_by")

    if not current_intent.get("time_filter"):
        current_intent["time_filter"] = last_intent.get("time_filter")

    if not current_intent.get("filter_value"):
        current_intent["filter_value"] = last_intent.get("filter_value")

    return current_intent