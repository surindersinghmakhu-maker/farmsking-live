import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from gtts import gTTS
from moviepy import VideoFileClip, AudioFileClip

VIDEOS_DIR = os.path.abspath(os.path.dirname(__file__))
P1_PATH = os.path.join(VIDEOS_DIR, "talk_pose1.png")
P2_PATH = os.path.join(VIDEOS_DIR, "talk_pose2.png")
P3_PATH = os.path.join(VIDEOS_DIR, "talk_pose3.png")

HI_AUDIO = os.path.join(VIDEOS_DIR, "cinematic_hi_speech.mp3")
PB_AUDIO = os.path.join(VIDEOS_DIR, "cinematic_pb_speech.mp3")

FINAL_HI_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Cinematic_Talking_Woman_HI.mp4")
FINAL_PB_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Cinematic_Talking_Woman_PB.mp4")

TEMP_HI_VID = os.path.join(VIDEOS_DIR, "temp_cinematic_hi.mp4")
TEMP_PB_VID = os.path.join(VIDEOS_DIR, "temp_cinematic_pb.mp4")

# Load and prepare images
WIDTH, HEIGHT = 720, 1280
FPS = 30

def preprocess_image(img_path):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    aspect_target = WIDTH / HEIGHT
    aspect_orig = w / h
    if aspect_orig > aspect_target:
        new_h = HEIGHT
        new_w = int(HEIGHT * aspect_orig)
    else:
        new_w = WIDTH
        new_h = int(WIDTH / aspect_orig)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - WIDTH) // 2
    top = (new_h - HEIGHT) // 2
    return img_resized.crop((left, top, left + WIDTH, top + HEIGHT))

img_p1 = preprocess_image(P1_PATH)
img_p2 = preprocess_image(P2_PATH)
img_p3 = preprocess_image(P3_PATH)

# Synthesize Speech
print("1. Synthesizing Cinematic Speech Audio (Hindi & Punjabi)...")
hi_speech_text = "नमस्ते किसान भाइयों! मैं प्रीति, FarmsKing की ब्रांड एंबेसडर। आज मैं आपको बताने आई हूँ कि कैसे आप FarmsKing ऐप से अपने खेत का मुनाफा 2 गुना बढ़ा सकते हैं! 100% सही मंडी भाव, सैटेलाइट क्रॉप स्कैन और 0% नकली दवा की पक्की गारंटी के साथ। अभी विजिट करें www.farmsking.in और बनिए अपने खेत के असली राजा!"
gTTS(text=hi_speech_text, lang='hi').save(HI_AUDIO)

pb_speech_text = "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ ਪ੍ਰੀਤੀ, FarmsKing ਦੀ ਬ੍ਰਾਂਡ ਅੰਬੈਸਡਰ। ਅੱਜ ਮੈਂ ਤੁਹਾਨੂੰ ਦੱਸਣ ਆਈ ਹਾਂ ਕਿ ਕਿਵੇਂ ਤੁਸੀਂ FarmsKing ਐਪ ਨਾਲ ਆਪਣੇ ਖੇਤ ਦਾ ਮੁਨਾਫ਼ਾ 2 ਗੁਣਾ ਵਧਾ ਸਕਦੇ ਹੋ! 100% ਸਹੀ ਮੰਡੀ ਭਾਅ, ਸੈਟੇਲਾਈਟ ਫ਼ਸਲ ਸਕੈਨ ਅਤੇ 0% ਨਕਲੀ ਦਵਾਈ ਦੀ ਪੱਕੀ ਗਰੰਟੀ ਨਾਲ। ਹੁਣੇ ਵਿਜ਼ਿਟ ਕਰੋ www.farmsking.in ਅਤੇ ਬਣੋ ਆਪਣੇ ਖੇਤ ਦੇ ਅਸਲੀ ਰਾਜਾ!"
gTTS(text=pb_speech_text, lang='pa').save(PB_AUDIO)

def render_cinematic_video(temp_path, audio_duration, text_script, lang="HI"):
    total_frames = int(FPS * audio_duration) + 15
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_path, fourcc, FPS, (WIDTH, HEIGHT))

    # Divide frames among 3 cinematic poses
    f_p1 = int(total_frames * 0.35)
    f_p2 = int(total_frames * 0.70)

    for frame_idx in range(total_frames):
        # Determine current camera pose cut
        if frame_idx < f_p1:
            active_img = img_p1
            local_f = frame_idx
            max_local = f_p1
            shot_label = "🎬 CAMERA SHOT 1: TALKING GESTURE"
        elif frame_idx < f_p2:
            active_img = img_p2
            local_f = frame_idx - f_p1
            max_local = f_p2 - f_p1
            shot_label = "🎬 CAMERA SHOT 2: SMARTPHONE DEMO"
        else:
            active_img = img_p3
            local_f = frame_idx - f_p2
            max_local = total_frames - f_p2
            shot_label = "🎬 CAMERA SHOT 3: CONFIDENT MOTIVATION"

        # Smooth Ken Burns Parallax Zoom
        zoom = 1.0 + (local_f / max(1, max_local)) * 0.04
        zw = int(WIDTH / zoom)
        zh = int(HEIGHT / zoom)
        
        # Crop zoom center
        z_left = (WIDTH - zw) // 2
        z_top = (HEIGHT - zh) // 2
        frame_zoom = active_img.crop((z_left, z_top, z_left + zw, z_top + zh)).resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        canvas = frame_zoom.copy()
        draw = ImageDraw.Draw(canvas)

        # 1. TOP HEADER BANNER (PROMINENT www.farmsking.in)
        draw.rectangle([0, 0, WIDTH, 130], fill=(15, 23, 42))
        draw.rectangle([0, 0, WIDTH, 12], fill=(245, 158, 11))
        
        # Progress Bar
        prog_w = int((frame_idx + 1) / total_frames * WIDTH)
        draw.rectangle([0, 120, prog_w, 130], fill=(16, 185, 129))

        # Main URL Badge
        draw.rectangle([40, 25, WIDTH - 40, 100], fill=(5, 150, 105), outline=(245, 158, 11), width=3)
        draw.text((100, 45), "🌐 www.farmsking.in", fill=(255, 255, 255))
        draw.text((WIDTH - 210, 52), "OFFICIAL WEBSITE", fill=(253, 224, 71))

        # 2. BRAND AMBASSADOR & CAMERA SHOT BADGES
        draw.rectangle([30, 145, 430, 195], fill=(15, 23, 42), outline=(16, 185, 129), width=2)
        draw.text((45, 160), "👑 MODEL PREETI | FARMSKING", fill=(245, 158, 11))

        draw.rectangle([WIDTH - 280, 145, WIDTH - 30, 215], fill=(30, 41, 59))
        draw.text((WIDTH - 265, 157), shot_label[:23], fill=(52, 211, 153))
        draw.text((WIDTH - 265, 185), "🎥 CINEMATIC 4K REEL", fill=(253, 224, 71))

        # 3. SPEECH SUBTITLES & AUDIO WAVE SPECTRUM
        wave_y = 900
        draw.rectangle([30, wave_y, WIDTH - 30, 1160], fill=(15, 23, 42), outline=(148, 163, 184), width=3)
        
        draw.text((50, wave_y + 15), f"🗣️ CINEMATIC TALKING SPEECH ({lang}):", fill=(56, 189, 248))

        # Animated talking mouth speech waves
        for b in range(18):
            h_bar = int(8 + 22 * np.abs(np.sin(frame_idx * 0.35 + b * 0.45)))
            x_bar = 440 + b * 11
            draw.line([(x_bar, wave_y + 35), (x_bar, wave_y + 35 - h_bar)], fill=(16, 185, 129), width=4)

        # Subtitle word wrapping
        words = text_script.split(" ")
        line1, line2, line3 = "", "", ""
        for w in words:
            if len(line1 + " " + w) <= 32:
                line1 += " " + w
            elif len(line2 + " " + w) <= 32:
                line2 += " " + w
            else:
                line3 += " " + w

        draw.text((50, wave_y + 55), line1.strip(), fill=(255, 255, 255))
        draw.text((50, wave_y + 90), line2.strip(), fill=(255, 255, 255))
        draw.text((50, wave_y + 125), line3.strip(), fill=(253, 224, 71))

        # 4. BOTTOM CTA BANNER
        draw.rectangle([0, 1180, WIDTH, 1280], fill=(16, 185, 129))
        draw.text((50, 1205), "👉 VISIT WWW.FARMSKING.IN & DOWNLOAD APP NOW", fill=(255, 255, 255))

        frame_bgr = cv2.cvtColor(np.array(canvas), cv2.COLOR_RGB2BGR)
        out.write(frame_bgr)

    out.release()

def combine_audio(temp_v, audio_p, final_p):
    v_clip = VideoFileClip(temp_v)
    a_clip = AudioFileClip(audio_p)
    f_clip = v_clip.with_audio(a_clip)
    f_clip.write_videofile(final_p, codec="libx264", audio_codec="aac")
    v_clip.close()
    a_clip.close()
    if os.path.exists(temp_v):
        os.remove(temp_v)

def main():
    # 1. Hindi Cinematic
    hi_aud = AudioFileClip(HI_AUDIO)
    hi_dur = hi_aud.duration
    hi_aud.close()
    print(f"2. Building Hindi Cinematic Talking Video (Duration: {hi_dur:.1f}s)...")
    render_cinematic_video(TEMP_HI_VID, hi_dur, hi_speech_text, lang="HI")
    combine_audio(TEMP_HI_VID, HI_AUDIO, FINAL_HI_MP4)

    # 2. Punjabi Cinematic
    pb_aud = AudioFileClip(PB_AUDIO)
    pb_dur = pb_aud.duration
    pb_aud.close()
    print(f"3. Building Punjabi Cinematic Talking Video (Duration: {pb_dur:.1f}s)...")
    render_cinematic_video(TEMP_PB_VID, pb_dur, pb_speech_text, lang="PB")
    combine_audio(TEMP_PB_VID, PB_AUDIO, FINAL_PB_MP4)

    print("\n[SUCCESS]: PROPER CINEMATIC TALKING WOMAN MP4 VIDEOS GENERATED CLEANLY!")

if __name__ == "__main__":
    main()
