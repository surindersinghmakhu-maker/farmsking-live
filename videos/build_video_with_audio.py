import os
import cv2
import numpy as np
from PIL import Image, ImageDraw
from gtts import gTTS
from moviepy import VideoFileClip, AudioFileClip

VIDEOS_DIR = os.path.abspath(os.path.dirname(__file__))
IMG_PATH = os.path.join(VIDEOS_DIR, "farmsking_model_field_promo.png")

# Audio Paths
HI_AUDIO_PATH = os.path.join(VIDEOS_DIR, "hindi_speech.mp3")
PB_AUDIO_PATH = os.path.join(VIDEOS_DIR, "punjabi_speech.mp3")

# Final Output Video Paths WITH AUDIO
FINAL_HI_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Model_Hindi_With_Audio.mp4")
FINAL_PB_MP4 = os.path.join(VIDEOS_DIR, "FarmsKing_Model_Punjabi_With_Audio.mp4")

# Temp Mute Video Paths
TEMP_HI_VIDEO = os.path.join(VIDEOS_DIR, "temp_hi_mute.mp4")
TEMP_PB_VIDEO = os.path.join(VIDEOS_DIR, "temp_pb_mute.mp4")

# Generate Speech Audio Files
print("1. Synthesizing High Quality AI Voiceover Audio (Hindi & Punjabi)...")

hi_text = "नमस्ते किसान भाइयों! मैं प्रीति, FarmsKing से। अब समय आ गया है अपनी खेती को स्मार्ट और मुनाफेदार बनाने का। FarmsKing ऐप पर आपको मिलता है 100% सही लाइव मंडी भाव, सैटेलाइट से खेत की सेहत स्कैन, और 0% नकली दवा की 100% पक्की गारंटी! आज ही विजिट करें www.farmsking.in और बनिए अपने खेत के राजा!"
gTTS(text=hi_text, lang='hi').save(HI_AUDIO_PATH)

pb_text = "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ ਪ੍ਰੀਤੀ, FarmsKing ਤੋਂ। ਹੁਣ ਸਮਾਂ ਆ ਗਿਆ ਹੈ ਆਪਣੀ ਖੇਤੀ ਨੂੰ ਸਮਾਰਟ ਅਤੇ ਮੁਨਾਫ਼ੇਦਾਰ ਬਣਾਉਣ ਦਾ। FarmsKing ਐਪ ਤੇ ਤੁਹਾਨੂੰ ਮਿਲਦਾ ਹੈ 100% ਸਹੀ ਲਾਈਵ ਮੰਡੀ ਭਾਅ, ਸੈਟੇਲਾਈਟ ਫ਼ਸਲ ਸਕੈਨ, ਅਤੇ 0% ਨਕਲੀ ਦਵਾਈ ਦੀ ਗਰੰਟੀ! ਅੱਜ ਹੀ ਵਿਜ਼ਿਟ ਕਰੋ www.farmsking.in ਅਤੇ ਬਣੋ ਆਪਣੇ ਖੇਤ ਦੇ ਰਾਜਾ!"
gTTS(text=pb_text, lang='pa').save(PB_AUDIO_PATH)

base_img = Image.open(IMG_PATH).convert("RGB")
WIDTH, HEIGHT = 720, 1280
FPS = 30

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

def render_mute_video(temp_path, audio_duration_sec, speech_text, lang="HI"):
    total_frames = int(FPS * audio_duration_sec) + 15 # extra padding
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_video = cv2.VideoWriter(temp_path, fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(total_frames):
        # Subtle Zoom Motion
        zoom_factor = 1.0 + (frame_idx / max(1, total_frames)) * 0.04
        
        left = (new_w - WIDTH) // 2
        top = (new_h - HEIGHT) // 2
        frame_crop = base_img_resized.crop((left, top, left + WIDTH, top + HEIGHT))
        
        canvas = frame_crop.copy()
        draw = ImageDraw.Draw(canvas)

        # 1. TOP BANNER FOR www.farmsking.in (VERY PROMINENT)
        draw.rectangle([0, 0, WIDTH, 120], fill=(15, 23, 42))
        draw.rectangle([0, 0, WIDTH, 10], fill=(245, 158, 11))
        
        progress_w = int((frame_idx + 1) / total_frames * WIDTH)
        draw.rectangle([0, 112, progress_w, 120], fill=(16, 185, 129))

        # WEBSITE URL BADGE
        draw.rectangle([50, 25, WIDTH - 50, 95], fill=(5, 150, 105), outline=(245, 158, 11), width=3)
        draw.text((110, 42), "🌐 www.farmsking.in", fill=(255, 255, 255))
        draw.text((WIDTH - 210, 50), "OFFICIAL WEBSITE", fill=(253, 224, 71))

        # 2. BRAND AMBASSADOR BADGE
        draw.rectangle([30, 140, 430, 195], fill=(15, 23, 42), outline=(16, 185, 129), width=2)
        draw.text((45, 155), "👑 MODEL PREETI | FARMSKING", fill=(245, 158, 11))

        # 3. LIVE FEATURE BADGES
        draw.rectangle([WIDTH - 270, 140, WIDTH - 30, 210], fill=(30, 41, 59))
        draw.text((WIDTH - 255, 152), "🔊 AUDIO SPEECH ON", fill=(52, 211, 153))
        draw.text((WIDTH - 255, 180), "📈 2X FARM PROFITS", fill=(253, 224, 71))

        # 4. AUDIO VOICE SPEECH WAVEFORM (DYNAMIC ANIMATED BARS)
        wave_box_y = 890
        draw.rectangle([30, wave_box_y, WIDTH - 30, 1160], fill=(15, 23, 42), outline=(148, 163, 184), width=3)
        
        draw.text((50, wave_box_y + 15), f"🎙️ LIVE AI VOICEOVER SPEECH ({lang}):", fill=(56, 189, 248))
        
        # Audio equalizer bars
        for bar in range(20):
            h_bar = int(10 + 25 * np.abs(np.sin(frame_idx * 0.4 + bar * 0.4)))
            x_bar = 420 + bar * 11
            draw.line([(x_bar, wave_box_y + 35), (x_bar, wave_box_y + 35 - h_bar)], fill=(16, 185, 129), width=4)

        # Word wrap speech subtitles
        words = speech_text.split(" ")
        line1, line2, line3 = "", "", ""
        for w in words:
            if len(line1 + " " + w) <= 32:
                line1 += " " + w
            elif len(line2 + " " + w) <= 32:
                line2 += " " + w
            else:
                line3 += " " + w

        draw.text((50, wave_box_y + 55), line1.strip(), fill=(255, 255, 255))
        draw.text((50, wave_box_y + 90), line2.strip(), fill=(255, 255, 255))
        draw.text((50, wave_box_y + 125), line3.strip(), fill=(253, 224, 71))

        # 5. BOTTOM CTA BANNER
        draw.rectangle([0, 1180, WIDTH, 1280], fill=(16, 185, 129))
        draw.text((60, 1205), "👉 VISIT WWW.FARMSKING.IN & DOWNLOAD APP TODAY", fill=(255, 255, 255))

        frame_bgr = cv2.cvtColor(np.array(canvas), cv2.COLOR_RGB2BGR)
        out_video.write(frame_bgr)

    out_video.release()

def combine_audio_video(temp_vid_path, audio_path, final_output_path):
    video_clip = VideoFileClip(temp_vid_path)
    audio_clip = AudioFileClip(audio_path)
    
    # Set audio on video
    final_clip = video_clip.with_audio(audio_clip)
    final_clip.write_videofile(final_output_path, codec="libx264", audio_codec="aac")
    
    video_clip.close()
    audio_clip.close()
    if os.path.exists(temp_vid_path):
        os.remove(temp_vid_path)

def main():
    # 1. Measure Hindi Audio Duration
    hi_audio = AudioFileClip(HI_AUDIO_PATH)
    hi_duration = hi_audio.duration
    hi_audio.close()
    
    print(f"2. Rendering Hindi Video (Audio Duration: {hi_duration:.1f}s)...")
    render_mute_video(TEMP_HI_VIDEO, hi_duration, hi_text, lang="HI")
    combine_audio_video(TEMP_HI_VIDEO, HI_AUDIO_PATH, FINAL_HI_MP4)

    # 2. Measure Punjabi Audio Duration
    pb_audio = AudioFileClip(PB_AUDIO_PATH)
    pb_duration = pb_audio.duration
    pb_audio.close()

    print(f"3. Rendering Punjabi Video (Audio Duration: {pb_duration:.1f}s)...")
    render_mute_video(TEMP_PB_VIDEO, pb_duration, pb_text, lang="PB")
    combine_audio_video(TEMP_PB_VIDEO, PB_AUDIO_PATH, FINAL_PB_MP4)

    print("\n[SUCCESS]: BOTH HINDI AND PUNJABI FULL MP4 VIDEOS WITH SYNTHESIZED AI AUDIO CREATED CLEANLY!")

if __name__ == "__main__":
    main()
