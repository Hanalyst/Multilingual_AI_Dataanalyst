from langdetect import detect
from deep_translator import GoogleTranslator

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
    "zh-cn": "Chinese",
    "zh-tw": "Chinese",
    "ar": "Arabic",
    "ja": "Japanese",
}

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return lang
    except Exception:
        return "en"

def translate_to_english(text: str):
    lang = detect_language(text)

    if lang == "en":
        return text, "en"

    try:
        translated = GoogleTranslator(source=lang, target="en").translate(text)
        return translated, lang
    except Exception as e:
        print(f"Translation error ({lang}): {e}")
        try:
            translated = GoogleTranslator(source="auto", target="en").translate(text)
            return translated, lang
        except Exception as e2:
            print(f"Auto translation also failed: {e2}")
            return text, lang

def translate_from_english(text: str, target_lang: str) -> str:
    if not target_lang or target_lang == "en":
        return text

    lang = target_lang.split("-")[0]

    try:
        translated = GoogleTranslator(source="en", target=lang).translate(text)
        return translated
    except Exception as e:
        print(f"Reverse translation error ({lang}): {e}")
        return text

def get_language_name(lang_code: str) -> str:
    return LANGUAGE_NAMES.get(lang_code, "English")
