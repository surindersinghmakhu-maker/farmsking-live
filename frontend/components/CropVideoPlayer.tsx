import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import {
  drawWatermarkOnCanvas,
  formatMediaTimestamp,
  loadFaviconForCanvas,
  resolveCropMediaDisplayUri,
  stampWatermarkOnImage,
} from '@/src/utils/crop-media';

interface CropVideoPlayerProps {
  videoUri: string;
  cropName?: string;
  fieldName?: string;
  farmerName?: string;
  recordedAt?: Date | string | null;
  height?: number;
  onRemove?: () => void;
  compact?: boolean;
}

/**
 * Playable Crop Field Video card with clean FarmsKing watermark:
 * - Top-Left: LIVE badge
 * - Top-Right: Eye/Play preview button + FarmsKing Favicon
 * - Center/Inline: Interactive Play & Check button + HTML5 `<video controls>`
 * - Bottom: Date, Time, Farmer Name, Plot Name
 */
export const CropVideoPlayer: React.FC<CropVideoPlayerProps> = ({
  videoUri,
  cropName = 'Field Crop',
  fieldName = 'Plot #1',
  farmerName = 'Registered Farmer',
  recordedAt,
  height = 220,
  onRemove,
  compact = false,
}) => {
  const resolvedUrl = resolveCropMediaDisplayUri(videoUri) || videoUri;
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(Platform.OS === 'web');

  const timestamp = formatMediaTimestamp(recordedAt);

  useEffect(() => {
    setLoadError(false);
    setIsPlayingInline(false);
    setIsLoadingMeta(Platform.OS === 'web');
  }, [resolvedUrl]);

  const handlePlayInline = () => {
    if (Platform.OS === 'web' && videoElRef.current) {
      videoElRef.current.play().catch(() => {
        setFullscreenOpen(true);
      });
      return;
    }
    setFullscreenOpen(true);
  };

  const escapedUrlForHtml = resolvedUrl.replace(/"/g, '&quot;');
  const mobileVideoHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #020617; display: flex; align-items: center; justify-content: center; }
      video { width: 100%; height: 100%; object-fit: contain; background: #020617; }
    </style>
  </head>
  <body>
    <video controls autoplay playsinline preload="metadata" src="${escapedUrlForHtml}"></video>
  </body>
</html>`;

  return (
    <>
      <View style={styles.playerCard}>
        {/* TOP WATERMARK BAR: LIVE LEFT, EYE/ACTION + FAVICON RIGHT */}
        <View style={styles.topWatermarkRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setFullscreenOpen(true)}
              accessibilityLabel="Inspect video player"
            >
              <Ionicons name="eye" size={14} color="#e2e8f0" />
              {!compact && <Text style={styles.iconActionText}>Watch</Text>}
            </TouchableOpacity>

            {onRemove && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={onRemove}
                accessibilityLabel="Remove attached video"
              >
                <Ionicons name="trash-outline" size={13} color="#fecaca" />
              </TouchableOpacity>
            )}

            <View style={styles.faviconPill}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: compact ? 22 : 26, height: compact ? 22 : 26, borderRadius: 6 }}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* VIDEO VIEWPORT */}
        <View style={[styles.viewport, { height }]}>
          {Platform.OS === 'web' ? (
            loadError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={28} color="#f59e0b" />
                <Text style={styles.errorTitle}>Unable to play this video inside browser</Text>
                <Text style={styles.errorSub} numberOfLines={2}>
                  Format may need external player or video could not load.
                </Text>
                <TouchableOpacity
                  style={styles.externalOpenBtn}
                  onPress={() => {
                    if (typeof window !== 'undefined') window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <Ionicons name="open-outline" size={14} color="#ffffff" />
                  <Text style={styles.externalOpenText}>Open Video Directly</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {isLoadingMeta && (
                  <View style={styles.loaderOverlay} pointerEvents="none">
                    <ActivityIndicator size="small" color="#22c55e" />
                    <Text style={styles.loaderText}>Loading video stream...</Text>
                  </View>
                )}

                {React.createElement('video', {
                  key: resolvedUrl,
                  ref: (el: any) => {
                    videoElRef.current = el;
                  },
                  src: resolvedUrl,
                  controls: true,
                  playsInline: true,
                  preload: 'metadata',
                  onLoadedMetadata: () => setIsLoadingMeta(false),
                  onCanPlay: () => setIsLoadingMeta(false),
                  onPlay: () => setIsPlayingInline(true),
                  onPause: () => setIsPlayingInline(false),
                  onEnded: () => setIsPlayingInline(false),
                  onError: () => {
                    setIsLoadingMeta(false);
                    setLoadError(true);
                  },
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#020617',
                    display: 'block',
                  },
                })}

                {!isPlayingInline && !isLoadingMeta && (
                  <View style={styles.playOverlayCenter} pointerEvents="box-none">
                    <TouchableOpacity
                      style={styles.playOverlayBtn}
                      activeOpacity={0.85}
                      onPress={handlePlayInline}
                    >
                      <View style={styles.playCircleSmall}>
                        <Ionicons name="play" size={20} color="#ffffff" style={{ marginLeft: 2 }} />
                      </View>
                      <Text style={styles.playOverlayText}>Play Video</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )
          ) : (
            <TouchableOpacity
              style={styles.nativePlayPrompt}
              activeOpacity={0.85}
              onPress={() => setFullscreenOpen(true)}
            >
              <View style={styles.playCircle}>
                <Ionicons name="play" size={26} color="#ffffff" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.nativePlayLabel}>Tap Play / Eye to Watch Field Video</Text>
              <Text style={styles.nativePlaySub}>Live Captured Field Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BOTTOM WATERMARK: DATE, TIME, FARMER NAME, PLOT NAME */}
        <View style={styles.bottomWatermarkRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.watermarkDateTime} numberOfLines={1}>
              Date: {timestamp.dateStr}  ·  Time: {timestamp.timeStr}
            </Text>
            <Text style={styles.watermarkMeta} numberOfLines={1}>
              Farmer: {farmerName}  |  Plot: {fieldName} ({cropName})
            </Text>
          </View>

          <TouchableOpacity style={styles.playPillBtn} onPress={() => setFullscreenOpen(true)}>
            <Ionicons name="eye" size={14} color="#4ade80" />
            <Text style={styles.playPillText}>Play</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FULLSCREEN VIDEO PLAYER MODAL */}
      {fullscreenOpen && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setFullscreenOpen(false)}>
          <View style={styles.fsOverlay}>
            <View style={styles.fsCard}>
              <View style={styles.fsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  <View>
                    <Text style={styles.fsTitle}>Crop Field Video</Text>
                    <Text style={styles.fsSub}>
                      Farmer: {farmerName} · Plot: {fieldName} ({cropName})
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image
                    source={require('@/assets/images/favicon.png')}
                    style={{ width: 28, height: 28, borderRadius: 6 }}
                    resizeMode="contain"
                  />
                  <TouchableOpacity onPress={() => setFullscreenOpen(false)}>
                    <Ionicons name="close-circle" size={28} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fsViewport}>
                {Platform.OS === 'web' ? (
                  React.createElement('video', {
                    key: `fs_${resolvedUrl}`,
                    src: resolvedUrl,
                    controls: true,
                    autoPlay: true,
                    playsInline: true,
                    preload: 'auto',
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#020617',
                    },
                  })
                ) : (
                  <WebView
                    source={{ html: mobileVideoHtml }}
                    style={{ flex: 1, backgroundColor: '#020617' }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    allowsFullscreenVideo
                  />
                )}
              </View>

              <View style={styles.fsFooter}>
                <Text style={styles.fsMetaStamp}>
                  Date: {timestamp.dateStr} · Time: {timestamp.timeStr}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.fsExternalBtn}
                    onPress={() => {
                      if (Platform.OS === 'web' && typeof window !== 'undefined') {
                        window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        Linking.openURL(resolvedUrl).catch(() => {});
                      }
                    }}
                  >
                    <Ionicons name="open-outline" size={15} color="#93c5fd" />
                    <Text style={styles.fsExternalText}>Open Tab</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.fsDoneBtn} onPress={() => setFullscreenOpen(false)}>
                    <Text style={styles.fsDoneText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

interface WebCameraPhotoModalProps {
  visible: boolean;
  farmerName?: string;
  plotName?: string;
  cropName?: string;
  onClose: () => void;
  onCaptured: (watermarkedDataUrl: string) => void;
}

/**
 * Live Webcam Photo Capture Modal for Web/PC with FarmsKing live HUD and watermark stamping.
 * Live photos only — does NOT silently open gallery.
 */
export const WebCameraPhotoModal: React.FC<WebCameraPhotoModalProps> = ({
  visible,
  farmerName = 'Registered Farmer',
  plotName = 'Field Plot',
  cropName = 'Field Crop',
  onClose,
  onCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const nowStamp = formatMediaTimestamp(new Date());

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  };

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      stopCamera();
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setIsReady(false);

    (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera capture is not supported in this browser. Use "From Gallery" for saved photos.');
        return;
      }
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setIsReady(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 60);
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotFoundError'
              ? 'No camera found on this device. Connect a webcam for live photos, or use "From Gallery" for gallery images.'
              : 'Camera permission is required to take live crop photos.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [visible]);

  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const videoEl = videoRef.current;
      const w = videoEl.videoWidth || 1280;
      const h = videoEl.videoHeight || 720;
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = w;
      rawCanvas.height = h;
      const ctx = rawCanvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, w, h);
      const rawDataUrl = rawCanvas.toDataURL('image/jpeg', 0.92);

      const stamped = await stampWatermarkOnImage(rawDataUrl, {
        sourceType: 'LIVE',
        farmerName,
        plotName,
        cropName,
        capturedAt: new Date(),
      });
      onCaptured(stamped);
      onClose();
    } finally {
      setIsCapturing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fsOverlay}>
        <View style={[styles.fsCard, { maxWidth: 600 }]}>
          <View style={styles.fsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <View>
                <Text style={styles.fsTitle}>Capture Live Crop Photo</Text>
                <Text style={styles.fsSub}>
                  Farmer: {farmerName} · Plot: {plotName}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: 28, height: 28, borderRadius: 6 }}
                resizeMode="contain"
              />
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.fsViewport, { height: 340 }]}>
            {cameraError ? (
              <View style={styles.errorBox}>
                <Ionicons name="camera-outline" size={34} color="#f59e0b" />
                <Text style={styles.errorTitle}>{cameraError}</Text>
              </View>
            ) : !isReady ? (
              <View style={styles.errorBox}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loaderText}>Opening live camera...</Text>
              </View>
            ) : (
              React.createElement('video', {
                ref: (el: any) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch(() => {});
                  }
                },
                autoPlay: true,
                muted: true,
                playsInline: true,
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#020617',
                },
              })
            )}
          </View>

          <View style={styles.fsFooter}>
            <Text style={styles.fsMetaStamp}>
              Date: {nowStamp.dateStr} · Time: {nowStamp.timeStr}
            </Text>

            {isReady && !cameraError ? (
              <TouchableOpacity
                style={styles.recBtn}
                disabled={isCapturing}
                onPress={handleCapture}
              >
                <Ionicons name="camera" size={18} color="#ffffff" />
                <Text style={styles.recBtnText}>{isCapturing ? 'Saving Photo...' : 'Capture Live Photo'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.fsDoneBtn} onPress={onClose}>
                <Text style={styles.fsDoneText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface WebCameraVideoRecorderModalProps {
  visible: boolean;
  farmerName?: string;
  plotName?: string;
  cropName?: string;
  onClose: () => void;
  onRecorded: (blobUrl: string) => void;
}

/**
 * Live-only HTML5 MediaRecorder webcam recorder for Desktop/Laptop Web (up to 60 seconds).
 * Composites FarmsKing watermark directly into the recorded video frames (`LIVE` top-left, Favicon top-right,
 * Date, Time, Farmer Name, Plot Name at bottom). Gallery video uploads are strictly disabled.
 */
export const WebCameraVideoRecorderModal: React.FC<WebCameraVideoRecorderModalProps> = ({
  visible,
  farmerName = 'Registered Farmer',
  plotName = 'Field Plot',
  cropName = 'Field Crop',
  onClose,
  onRecorded,
}) => {
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<any>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const frameIntervalRef = useRef<any>(null);
  const faviconRef = useRef<HTMLImageElement | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const nowStamp = formatMediaTimestamp(new Date());

  const cleanupCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore stop failure
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsCameraReady(false);
    setSecondsElapsed(0);
  };

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') {
      cleanupCamera();
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setIsCameraReady(false);
    loadFaviconForCanvas().then((img) => {
      if (!cancelled) faviconRef.current = img;
    });

    (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera video recording is not supported in this browser.');
        return;
      }
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setIsCameraReady(true);
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.play().catch(() => {});
          }
        }, 60);
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotFoundError'
              ? 'No camera detected on this device. Crop field video can only be recorded live using a camera.'
              : 'Camera permission denied. Allow camera access to record live field video.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanupCamera();
    };
  }, [visible]);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current || typeof MediaRecorder === 'undefined') {
      setCameraError('Live video recording API is unavailable in this browser.');
      return;
    }

    chunksRef.current = [];
    let recordingStream: MediaStream = streamRef.current;

    // Composite live watermark onto canvas stream so the saved video itself has Top-Left LIVE,
    // Top-Right FarmsKing Favicon, and Bottom Date/Time/Farmer/Plot stamped on every frame!
    const videoEl = videoPreviewRef.current;
    if (videoEl && typeof document !== 'undefined') {
      const compCanvas = document.createElement('canvas');
      compCanvas.width = videoEl.videoWidth || 960;
      compCanvas.height = videoEl.videoHeight || 540;
      const ctx = compCanvas.getContext('2d');

      if (ctx && typeof (compCanvas as any).captureStream === 'function') {
        const renderFrame = () => {
          if (videoPreviewRef.current && videoPreviewRef.current.readyState >= 2) {
            ctx.drawImage(videoPreviewRef.current, 0, 0, compCanvas.width, compCanvas.height);
            drawWatermarkOnCanvas(
              ctx,
              compCanvas.width,
              compCanvas.height,
              {
                sourceType: 'LIVE',
                farmerName,
                plotName,
                cropName,
                capturedAt: new Date(),
              },
              faviconRef.current,
            );
          }
        };
        renderFrame();
        frameIntervalRef.current = setInterval(renderFrame, 33);

        const canvasStream: MediaStream = (compCanvas as any).captureStream(30);
        streamRef.current.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
        recordingStream = canvasStream;
      }
    }

    const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    const supportedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = supportedMime
      ? new MediaRecorder(recordingStream, { mimeType: supportedMime })
      : new MediaRecorder(recordingStream);

    recorder.ondataavailable = (e: any) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        onRecorded(url);
        onClose();
      }
    };

    recorderRef.current = recorder;
    recorder.start(500);
    setSecondsElapsed(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => {
        if (prev + 1 >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fsOverlay}>
        <View style={[styles.fsCard, { maxWidth: 600 }]}>
          <View style={styles.fsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <View>
                <Text style={styles.fsTitle}>Record Live Field Video</Text>
                <Text style={styles.fsSub}>
                  Farmer: {farmerName} · Plot: {plotName} (Max 60s)
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: 28, height: 28, borderRadius: 6 }}
                resizeMode="contain"
              />
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.fsViewport, { height: 340 }]}>
            {cameraError ? (
              <View style={styles.errorBox}>
                <Ionicons name="videocam-off-outline" size={34} color="#f59e0b" />
                <Text style={styles.errorTitle}>{cameraError}</Text>
              </View>
            ) : !isCameraReady ? (
              <View style={styles.errorBox}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loaderText}>Opening camera...</Text>
              </View>
            ) : (
              React.createElement('video', {
                ref: (el: any) => {
                  videoPreviewRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch(() => {});
                  }
                },
                autoPlay: true,
                muted: true,
                playsInline: true,
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#020617',
                },
              })
            )}
          </View>

          {isCameraReady && !cameraError ? (
            <View style={styles.fsFooter}>
              <View style={styles.recStatusPill}>
                <View style={[styles.liveDot, { backgroundColor: isRecording ? '#ef4444' : '#94a3b8' }]} />
                <Text style={styles.recTimerText}>
                  {String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:
                  {String(secondsElapsed % 60).padStart(2, '0')} / 01:00 · {nowStamp.dateStr}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.recBtn, isRecording && { backgroundColor: '#dc2626' }]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={isRecording ? 'stop-circle' : 'radio-button-on'} size={18} color="#ffffff" />
                <Text style={styles.recBtnText}>
                  {isRecording ? 'Stop & Preview Video' : 'Start Live Recording'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.fsFooter, { justifyContent: 'flex-end' }]}>
              <TouchableOpacity style={styles.fsDoneBtn} onPress={onClose}>
                <Text style={styles.fsDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  playerCard: {
    backgroundColor: '#090e17',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 6,
  },
  topWatermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  iconActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  removeBtn: {
    backgroundColor: 'rgba(185, 28, 28, 0.5)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  faviconPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 2,
    borderRadius: 7,
  },
  viewport: {
    width: '100%',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loaderOverlay: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  playOverlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  playOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  playCircleSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
  externalOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  externalOpenText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  nativePlayPrompt: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativePlayLabel: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  nativePlaySub: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomWatermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  watermarkDateTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fde047',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  watermarkMeta: {
    fontSize: 10.5,
    color: '#ffffff',
    fontWeight: '700',
  },
  playPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  playPillText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '800',
  },
  fsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fsCard: {
    width: '100%',
    maxWidth: 780,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  fsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  fsSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  fsViewport: {
    width: '100%',
    height: 440,
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  fsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  fsMetaStamp: {
    color: '#fde047',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fsExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  fsExternalText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  fsDoneBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  fsDoneText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  recStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recTimerText: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  recBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  recBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
