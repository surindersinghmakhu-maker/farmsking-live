import os
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

VIDEOS_DIR = os.path.abspath(os.path.dirname(__file__))
PB_DIR = os.path.join(VIDEOS_DIR, "punjabi")
HI_DIR = os.path.join(VIDEOS_DIR, "hindi")

os.makedirs(PB_DIR, exist_ok=True)
os.makedirs(HI_DIR, exist_ok=True)

# Load JSON Data
json_path = os.path.join(VIDEOS_DIR, "FarmsKing_100_Feature_Promo_Automation.json")
with open(json_path, "r", encoding="utf-8") as f:
    promo_data = json.load(f)

# Dimensions for Vertical Reel (9:16)
WIDTH, HEIGHT = 720, 1280
FPS = 30
NUM_FRAMES = 120  # 4 seconds per clip (< 3 minutes)

def get_character_badge(char_name):
    if "Girl" in char_name:
        return "👩‍💼 MODEL GIRL", (236, 72, 153)
    elif "Guy" in char_name:
        return "👨‍💼 MODEL GUY", (59, 130, 246)
    elif "Woman" in char_name:
        return "👩‍🌾 FARMER WOMAN", (16, 185, 129)
    elif "Man" in char_name:
        return "👨‍🌾 FARMER MAN", (245, 158, 11)
    elif "Trainer" in char_name:
        return "🎓 TECH TRAINER", (139, 92, 246)
    elif "Advisor" in char_name:
        return "🔬 CROP ADVISOR", (14, 165, 233)
    elif "Seller" in char_name:
        return "🏪 STORE SELLER", (234, 179, 8)
    else:
        return "⭐ FARMSKING PROMO", (16, 185, 129)

def create_frame(item, lang="PB", frame_idx=0):
    # Base Image canvas
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)

    # 1. Animated Background Gradient
    pulse = int(20 * np.sin(frame_idx * 0.1))
    r1, g1, b1 = 5, 120 + pulse, 85
    r2, g2, b2 = 10, 40, 60
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(r1 * (1 - ratio) + r2 * ratio)
        g = int(g1 * (1 - ratio) + g2 * ratio)
        b = int(b1 * (1 - ratio) + b2 * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # 2. Header Bar
    draw.rectangle([0, 0, WIDTH, 110], fill=(15, 23, 42))
    # Top progress bar
    progress_w = int((frame_idx + 1) / NUM_FRAMES * WIDTH)
    draw.rectangle([0, 0, progress_w, 8], fill=(245, 158, 11))

    # Top Header Text
    draw.text((30, 35), "👑 FARMSKING OFFICIAL REEL", fill=(255, 255, 255))
    draw.text((WIDTH - 220, 35), f"CLIP #{item['id']:03d} | <3 MIN", fill=(16, 185, 129))

    # 3. Character Badge Card
    char_label, char_color = get_character_badge(item["character"])
    draw.rectangle([40, 140, WIDTH - 40, 220], fill=char_color)
    draw.text((60, 165), f"SPEAKER: {char_label}", fill=(255, 255, 255))

    # 4. Main Banner
    draw.rectangle([40, 250, WIDTH - 40, 420], fill=(30, 41, 59), outline=(245, 158, 11), width=3)
    draw.text((60, 275), "🚜 FARMSKING PLATFORM FEATURE", fill=(245, 158, 11))
    
    # Extract feature title snippet from prompt
    prompt_str = item.get("prompt", "")
    feature_title = prompt_str.replace("Cinematic 4k prompt: ", "")
    draw.text((60, 320), feature_title[:42], fill=(255, 255, 255))
    if len(feature_title) > 42:
        draw.text((60, 360), feature_title[42:84], fill=(203, 213, 225))

    # 5. Central Phone / Graphics Card
    draw.rectangle([100, 450, WIDTH - 100, 900], fill=(15, 23, 42), outline=(16, 185, 129), width=4)
    # Animated inner pulse
    inner_pulse = int(15 * np.sin(frame_idx * 0.15))
    draw.rectangle([120, 470, WIDTH - 120, 880], fill=(2, 44, 34))
    
    draw.text((150, 520), "📱 FARMSKING LIVE APP DEMO", fill=(52, 211, 153))
    draw.text((150, 580), f"LANG: {lang} | 100% VERIFIED", fill=(255, 255, 255))
    draw.text((150, 640), "✨ Live Mandi Rates | 0% Fake Drugs", fill=(253, 224, 71))
    draw.text((150, 700), "🌱 Crop Doctor & Satellite Scan", fill=(253, 224, 71))
    draw.text((150, 760), "🧾 GST Invoices & Cashfree Split", fill=(253, 224, 71))
    draw.text((150, 820), "⚡ High-Speed Marketplace", fill=(255, 255, 255))

    # 6. Voiceover / Script Subtitle Box
    vo_text = item["voiceoverPB"] if lang == "PB" else item["voiceoverHI"]
    draw.rectangle([40, 930, WIDTH - 40, 1120], fill=(15, 23, 42), outline=(148, 163, 184), width=2)
    draw.text((60, 950), f"🎙️ VOICEOVER SCRIPT ({lang}):", fill=(56, 189, 248))
    
    # Simple line wrapping
    words = vo_text.split(" ")
    line1, line2, line3 = "", "", ""
    for w in words:
        if len(line1 + " " + w) <= 38:
            line1 += " " + w
        elif len(line2 + " " + w) <= 38:
            line2 += " " + w
        else:
            line3 += " " + w
            
    draw.text((60, 990), line1.strip(), fill=(255, 255, 255))
    draw.text((60, 1030), line2.strip(), fill=(255, 255, 255))
    draw.text((60, 1070), line3.strip(), fill=(255, 255, 255))

    # 7. Bottom CTA Button
    draw.rectangle([40, 1150, WIDTH - 40, 1240], fill=(16, 185, 129))
    draw.text((120, 1180), "📥 DOWNLOAD FARMSKING APP TODAY", fill=(255, 255, 255))

    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def render_videos():
    print(f"Starting rendering of 100 Punjabi & 100 Hindi MP4 Videos in {VIDEOS_DIR}...")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')

    total_items = len(promo_data)
    for idx, item in enumerate(promo_data):
        item_id = item["id"]
        
        # 1. Punjabi MP4
        pb_filename = f"FarmsKing_PB_Video_{item_id:03d}.mp4"
        pb_path = os.path.join(PB_DIR, pb_filename)
        out_pb = cv2.VideoWriter(pb_path, fourcc, FPS, (WIDTH, HEIGHT))
        for f in range(NUM_FRAMES):
            frame = create_frame(item, lang="PB", frame_idx=f)
            out_pb.write(frame)
        out_pb.release()

        # 2. Hindi MP4
        hi_filename = f"FarmsKing_HI_Video_{item_id:03d}.mp4"
        hi_path = os.path.join(HI_DIR, hi_filename)
        out_hi = cv2.VideoWriter(hi_path, fourcc, FPS, (WIDTH, HEIGHT))
        for f in range(NUM_FRAMES):
            frame = create_frame(item, lang="HI", frame_idx=f)
            out_hi.write(frame)
        out_hi.release()

        if (idx + 1) % 10 == 0 or idx == total_items - 1:
            print(f"Rendered {idx + 1}/{total_items} Video Pairs (PB & HI)...")

    print("\n[SUCCESS]: All 100 Punjabi & 100 Hindi MP4 videos generated cleanly!")

if __name__ == "__main__":
    render_videos()
