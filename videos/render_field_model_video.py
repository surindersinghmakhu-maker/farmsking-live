import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

VIDEOS_DIR = r"d:\FarmsKing\videos"
IMG_PATH = os.path.join(VIDEOS_DIR, "farmsking_model_field_promo.png")
OUT_HI_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Model_Hindi_Motivator.mp4")
OUT_PB_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Model_Punjabi_Motivator.mp4")

# Load base model photo
base_img = Image.open(IMG_PATH).convert("RGB")

WIDTH, HEIGHT = 720, 1280
FPS = 30
DURATION_SEC = 10  # 10 seconds reel (300 frames, < 3 min)
TOTAL_FRAMES = FPS * DURATION_SEC

# Resize base image to fit reel height with crop
w_orig, h_orig = base_img.size
aspect_target = WIDTH / HEIGHT
aspect_orig = w_orig / h_orig

if aspect_orig > aspect_target:
    new_h = HEIGHT
    new_w = int(HEIGHT * aspect_orig)
else:
    new_w = WIDTH
    new_h = int(WIDTH / aspect_orig)

base_img_resized = base_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Hindi Subtitles Timed Sequence
HINDI_SPEECH = [
    (0, 50, "नमस्ते किसान भाइयों! मैं प्रीति, FarmsKing से।"),
    (50, 100, "अब समय आ गया है अपनी खेती को 100% स्मार्ट बनाने का!"),
    (100, 160, "FarmsKing देता है लाइव मंडी भाव, सैटेलाइट क्रॉप स्कैन,"),
    (160, 220, "और 0% नकली दवा की 100% असली पक्की गारंटी!"),
    (220, 270, "आज ही विजिट करें: www.farmsking.in"),
    (270, 300, "जय जवान, जय किसान! बनिए अपने खेत के राजा! 👑"),
]

PUNJABI_SPEECH = [
    (0, 50, "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ ਪ੍ਰੀਤੀ, FarmsKing ਤੋਂ।"),
    (50, 100, "ਹੁਣ ਸਮਾਂ ਆ ਗਿਆ ਹੈ ਆਪਣੀ ਖੇਤੀ ਨੂੰ 100% ਸਮਾਰਟ ਬਣਾਉਣ ਦਾ!"),
    (100, 160, "FarmsKing ਦਿੰਦਾ ਹੈ ਲਾਈਵ ਮੰਡੀ ਭਾਅ, ਸੈਟੇਲਾਈਟ ਫ਼ਸਲ ਸਕੈਨ,"),
    (160, 220, "ਅਤੇ 0% ਨਕਲੀ ਦਵਾਈ ਦੀ 100% ਅਸਲੀ ਪੱਕੀ ਗਰੰਟੀ!"),
    (220, 270, "ਅੱਜ ਹੀ ਵਿਜ਼ਿਟ ਕਰੋ: www.farmsking.in"),
    (270, 300, "ਜੈ ਜਵਾਨ, ਜੈ ਕਿਸਾਨ! ਬਣੋ ਆਪਣੇ ਖੇਤ ਦੇ ਰਾਜਾ! 👑"),
]

def render_model_video(out_path, speech_data, lang="HI"):
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_video = cv2.VideoWriter(out_path, fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(TOTAL_FRAMES):
        # Dynamic subtle zoom effect (Ken Burns effect)
        zoom_factor = 1.0 + (frame_idx / TOTAL_FRAMES) * 0.05
        zw = int(WIDTH / zoom_factor)
        zh = int(HEIGHT / zoom_factor)
        
        # Crop center from resized image
        left = (new_w - WIDTH) // 2
        top = (new_h - HEIGHT) // 2
        frame_crop = base_img_resized.crop((left, top, left + WIDTH, top + HEIGHT))
        
        # Convert to PIL for drawing text overlays
        canvas = frame_crop.copy()
        draw = ImageDraw.Draw(canvas)

        # 1. TOP BANNER FOR www.farmsking.in (PROMINENT GOLD & EMERALD)
        draw.rectangle([0, 0, WIDTH, 120], fill=(15, 23, 42))
        draw.rectangle([0, 0, WIDTH, 10], fill=(245, 158, 11)) # Top gold line
        
        # Top Progress indicator
        progress_w = int((frame_idx + 1) / TOTAL_FRAMES * WIDTH)
        draw.rectangle([0, 112, progress_w, 120], fill=(16, 185, 129))

        # WEBSITE URL PROMINENT TEXT
        draw.rectangle([60, 25, WIDTH - 60, 95], fill=(5, 150, 105), outline=(245, 158, 11), width=3)
        draw.text((120, 42), "🌐 www.farmsking.in", fill=(255, 255, 255))
        draw.text((WIDTH - 210, 50), "OFFICIAL APP", fill=(253, 224, 71))

        # 2. BRAND AMBASSADOR BADGE
        draw.rectangle([30, 140, 420, 195], fill=(15, 23, 42), outline=(16, 185, 129), width=2)
        draw.text((45, 155), "👑 MODEL PREETI | FARMSKING", fill=(245, 158, 11))

        # 3. LIVE FEATURE FLOATING BADGES
        pulse = int(10 * np.sin(frame_idx * 0.2))
        draw.rectangle([WIDTH - 280, 140, WIDTH - 30, 210], fill=(30, 41, 59))
        draw.text((WIDTH - 265, 152), "🚜 100% FARMER POWER", fill=(52, 211, 153))
        draw.text((WIDTH - 265, 180), "📈 2X FARM PROFITS", fill=(253, 224, 71))

        # 4. AUDIO / SPEECH WAVE INDICATOR (ANIMATED)
        wave_box_y = 900
        draw.rectangle([30, wave_box_y, WIDTH - 30, 1160], fill=(15, 23, 42), outline=(148, 163, 184), width=3)
        
        # Animated Voiceover Waveform
        draw.text((50, wave_box_y + 15), f"🎙️ MOTIVATIONAL SPEECH ({lang}):", fill=(56, 189, 248))
        for bar in range(16):
            h_bar = int(15 + 20 * np.abs(np.sin(frame_idx * 0.3 + bar * 0.5)))
            x_bar = 440 + bar * 12
            draw.line([(x_bar, wave_box_y + 35), (x_bar, wave_box_y + 35 - h_bar)], fill=(16, 185, 129), width=4)

        # Current Subtitle Text Line
        current_text = ""
        for start_f, end_f, txt in speech_data:
            if start_f <= frame_idx < end_f:
                current_text = txt
                break
        if not current_text and speech_data:
            current_text = speech_data[-1][2]

        draw.text((50, wave_box_y + 60), current_text, fill=(255, 255, 255))
        draw.text((50, wave_box_y + 110), "✨ 0% Fake Drugs Guarantee | Satellite Crop Health", fill=(253, 224, 71))

        # 5. BOTTOM CTA BANNER WITH WEBSITE REPEAT
        draw.rectangle([0, 1180, WIDTH, 1280], fill=(16, 185, 129))
        draw.text((70, 1205), "👉 VISIT WWW.FARMSKING.IN & DOWNLOAD APP NOW", fill=(255, 255, 255))

        # Convert back to BGR for OpenCV
        frame_bgr = cv2.cvtColor(np.array(canvas), cv2.COLOR_RGB2BGR)
        out_video.write(frame_bgr)

    out_video.release()
    print(f"[SUCCESS]: Generated Model Video -> {out_path}")

def main():
    print("Rendering Model Girl Farm Field Video Reel (Hindi & Punjabi)...")
    render_model_video(OUT_HI_MP4, HINDI_SPEECH, lang="HI")
    render_model_video(OUT_PB_MP4, PUNJABI_SPEECH, lang="PB")
    print("All Model Videos Rendered Successfully!")

if __name__ == "__main__":
    main()
