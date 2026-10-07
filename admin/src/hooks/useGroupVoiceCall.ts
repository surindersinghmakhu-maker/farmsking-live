import { useEffect, useState, useCallback, useRef } from 'react';
import * as api from '../api/voice-call.api';
import { getVoiceCallSocket } from '../lib/socket';

export function useGroupVoiceCall() {
  const [activeCall, setActiveCall] = useState<api.GroupVoiceCallResponse['call'] | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);

  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const remoteAudioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Start Call Timer
  useEffect(() => {
    if (activeCall) {
      const startTime = new Date(activeCall.startedAt).getTime();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed > 0 ? elapsed : 0);
      }, 1000);
    } else {
      setDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  // Poll for active call automatically
  useEffect(() => {
    let isMounted = true;
    const fetchCall = () => {
      api.getActiveCall().then((res) => {
        if (isMounted && res) {
          setActiveCall(res);
        }
      }).catch(() => {});
    };
    fetchCall();
    const timer = setInterval(fetchCall, 8000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const audioContextRef = useRef<any>(null);

  // Mobile Audio Unlocker for iOS Safari & Android Chrome
  const unlockMobileAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn('Mobile Audio Context unlock error:', e);
    }
  }, []);

  // Initialize Remote Audio Player Element for Web & Mobile Web
  const playRemoteAudioStream = useCallback((stream: MediaStream, senderId: string) => {
    if (typeof document === 'undefined') return;
    try {
      unlockMobileAudio();
      let audioEl = remoteAudioElementsRef.current[senderId];
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.setAttribute('autoplay', 'true');
        audioEl.autoplay = true;
        audioEl.id = `remote-audio-${senderId}`;
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);
        remoteAudioElementsRef.current[senderId] = audioEl;
      }
      audioEl.srcObject = stream;
      audioEl.volume = isSpeakerOn ? 1.0 : 0.0;
      audioEl.muted = false;

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Mobile Autoplay retry:', err);
          const retryPlay = () => {
            audioEl.play().catch(() => {});
            document.removeEventListener('touchstart', retryPlay);
            document.removeEventListener('click', retryPlay);
          };
          document.addEventListener('touchstart', retryPlay, { once: true });
          document.addEventListener('click', retryPlay, { once: true });
        });
      }
    } catch (err) {
      console.warn('Could not attach remote audio stream:', err);
    }
  }, [isSpeakerOn, unlockMobileAudio]);

  // Create WebRTC Peer Connection for a user
  const createPeerConnection = useCallback((targetUserId: string, socket: any) => {
    if (peerConnectionsRef.current[targetUserId]) {
      return peerConnectionsRef.current[targetUserId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall?.id) {
        socket.emit('webrtc_signal', {
          callId: activeCall.id,
          targetUserId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        playRemoteAudioStream(event.streams[0], targetUserId);
      }
    };

    peerConnectionsRef.current[targetUserId] = pc;
    return pc;
  }, [activeCall?.id, playRemoteAudioStream]);

  // Connect WebSockets and WebRTC Signal Handling
  useEffect(() => {
    let voiceSocket: any = null;

    getVoiceCallSocket().then((socket) => {
      voiceSocket = socket;

      if (activeCall?.id) {
        socket.emit('join_call_room', { callId: activeCall.id });
      }

      socket.on('user_joined_call', async ({ userId }: { userId: string }) => {
        api.getActiveCall().then((res) => {
          if (res) setActiveCall(res);
        });

        // Initiate WebRTC offer to newly joined participant
        if (userId && activeCall?.id && localStreamRef.current) {
          try {
            const pc = createPeerConnection(userId, socket);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_signal', {
              callId: activeCall.id,
              targetUserId: userId,
              signal: { type: 'offer', sdp: offer },
            });
          } catch (err) {
            console.warn('WebRTC offer create error:', err);
          }
        }
      });

      socket.on('user_left_call', ({ userId }: { userId: string }) => {
        api.getActiveCall().then((res) => {
          if (res) setActiveCall(res);
        });
        if (peerConnectionsRef.current[userId]) {
          peerConnectionsRef.current[userId].close();
          delete peerConnectionsRef.current[userId];
        }
        if (remoteAudioElementsRef.current[userId]) {
          remoteAudioElementsRef.current[userId].remove();
          delete remoteAudioElementsRef.current[userId];
        }
      });

      socket.on('hand_raised', ({ userId }: { userId: string }) => {
        setActiveCall((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.userId === userId ? { ...p, isHandRaised: true } : p,
            ),
          };
        });
      });

      socket.on('mic_granted', ({ userId }: { userId: string }) => {
        setActiveCall((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.userId === userId
                ? { ...p, role: 'SPEAKER', isMuted: false, isHandRaised: false }
                : p,
            ),
          };
        });
      });

      socket.on('mute_changed', ({ userId, isMuted }: { userId: string; isMuted: boolean }) => {
        setActiveCall((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.userId === userId ? { ...p, isMuted } : p,
            ),
          };
        });
      });

      // Handle WebRTC Signaling (Offers, Answers, ICE Candidates)
      socket.on('webrtc_signal', async ({ senderId, signal }: { senderId: string; signal: any }) => {
        if (!senderId || !signal) return;
        try {
          const pc = createPeerConnection(senderId, socket);
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc_signal', {
              callId: activeCall?.id,
              targetUserId: senderId,
              signal: { type: 'answer', sdp: answer },
            });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else if (signal.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (err) {
          console.warn('WebRTC signal process error:', err);
        }
      });

      // WebSocket Audio Chunk Player (Fallback with mobile unlock)
      socket.on('remote_audio_chunk', ({ chunk }: { senderId: string; chunk: string }) => {
        if (typeof window !== 'undefined' && chunk) {
          try {
            unlockMobileAudio();
            const audio = new Audio(chunk);
            audio.setAttribute('playsinline', 'true');
            audio.setAttribute('webkit-playsinline', 'true');
            audio.volume = isSpeakerOn ? 1.0 : 0.0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } catch {}
        }
      });

      socket.on('call_ended', () => {
        setActiveCall(null);
      });
    });

    return () => {
      if (voiceSocket && activeCall?.id) {
        voiceSocket.emit('leave_call_room', { callId: activeCall.id });
        voiceSocket.off('user_joined_call');
        voiceSocket.off('user_left_call');
        voiceSocket.off('hand_raised');
        voiceSocket.off('mic_granted');
        voiceSocket.off('mute_changed');
        voiceSocket.off('webrtc_signal');
        voiceSocket.off('remote_audio_chunk');
        voiceSocket.off('call_ended');
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      Object.values(remoteAudioElementsRef.current).forEach((el) => el.remove());
      remoteAudioElementsRef.current = {};
    };
  }, [activeCall?.id, createPeerConnection, unlockMobileAudio]);

  // Handle Speaker Toggle (Volume Mute/Unmute)
  useEffect(() => {
    unlockMobileAudio();
    Object.values(remoteAudioElementsRef.current).forEach((audioEl) => {
      if (audioEl) audioEl.volume = isSpeakerOn ? 1.0 : 0.0;
    });
  }, [isSpeakerOn, unlockMobileAudio]);

  const [micVolume, setMicVolume] = useState<number>(0);
  const [isSelfLoopback, setIsSelfLoopback] = useState<boolean>(false);
  const analyserRef = useRef<any>(null);
  const animFrameIdRef = useRef<any>(null);
  const loopbackAudioRef = useRef<any>(null);

  const toggleSelfLoopback = useCallback(() => {
    setIsSelfLoopback((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isSelfLoopback && localStreamRef.current) {
      if (!loopbackAudioRef.current) {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        document.body.appendChild(audio);
        loopbackAudioRef.current = audio;
      }
      loopbackAudioRef.current.srcObject = localStreamRef.current;
      loopbackAudioRef.current.volume = 1.0;
      loopbackAudioRef.current.play().catch(() => {});
    } else {
      if (loopbackAudioRef.current) {
        loopbackAudioRef.current.pause();
        loopbackAudioRef.current.srcObject = null;
      }
    }
  }, [isSelfLoopback]);

  // Live Microphone Capture & Stream when Unmuted
  useEffect(() => {
    if (!activeCall || isMuted) {
      setMicVolume(0);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
        localStreamRef.current = null;
      }
      return;
    }

    // Capture Local Microphone Audio Stream
    if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
      unlockMobileAudio();
      navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
        .then(async (stream) => {
          localStreamRef.current = stream;
          const socket = await getVoiceCallSocket();

          // Real-time Mic Volume Level Analyser
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const volumePercentage = Math.min(100, Math.round((average / 128) * 100));
                setMicVolume(volumePercentage);
                animFrameIdRef.current = requestAnimationFrame(updateVolume);
              };
              updateVolume();
            }
          } catch (volErr) {
            console.warn('Mic volume meter error:', volErr);
          }

          // Add audio track to existing WebRTC peer connections
          Object.values(peerConnectionsRef.current).forEach((pc) => {
            stream.getAudioTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });
          });

          // Backup Recorder Stream for Mobile Audio Chunks
          try {
            let mimeType = 'audio/webm;codecs=opus';
            if (typeof MediaRecorder !== 'undefined') {
              if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
              } else if (MediaRecorder.isTypeSupported('audio/aac')) {
                mimeType = 'audio/aac';
              } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
              } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
              } else {
                mimeType = '';
              }
            }

            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event: any) => {
              if (event.data && event.data.size > 0) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64Chunk = reader.result as string;
                  if (base64Chunk && activeCall?.id) {
                    socket.emit('voice_audio_chunk', {
                      callId: activeCall.id,
                      chunk: base64Chunk,
                    });
                  }
                };
                reader.readAsDataURL(event.data);
              }
            };

            mediaRecorder.start(500); // 500ms audio chunks
          } catch (recErr) {
            console.warn('MediaRecorder backup init warning:', recErr);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission or capture error:', err);
          setErrorMsg('Microphone permission required for voice call. Please allow mic access in your browser settings.');
        });
    }

    return () => {
      setMicVolume(0);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeCall?.id, isMuted, unlockMobileAudio]);


  const startCall = useCallback(async (title: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    unlockMobileAudio();
    try {
      const res = await api.startGroupCall(title);
      setActiveCall(res.call);
      setIsMuted(false); // Host starts unmuted
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not start group call';
      setErrorMsg(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [unlockMobileAudio]);

  const joinCall = useCallback(async (callId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    unlockMobileAudio();
    try {
      const res = await api.joinGroupCall(callId);
      setActiveCall(res.call);
      setIsMuted(true); // Listeners join muted by default
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not join call';
      setErrorMsg(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [unlockMobileAudio]);


  const endCall = useCallback(async () => {
    if (!activeCall) return;
    setIsLoading(true);
    try {
      await api.endGroupCall(activeCall.id);
      const socket = await getVoiceCallSocket();
      socket.emit('leave_call_room', { callId: activeCall.id });
    } catch (err: any) {
      console.warn('endCall error:', err);
    } finally {
      setActiveCall(null);
      setIsLoading(false);
    }
  }, [activeCall]);

  const toggleMute = useCallback(async () => {
    if (!activeCall) return;
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    const socket = await getVoiceCallSocket();
    socket.emit('toggle_mute', { callId: activeCall.id, isMuted: newMuteState });
  }, [activeCall, isMuted]);

  const raiseHand = useCallback(async () => {
    if (!activeCall) return;
    setIsHandRaised(true);
    const socket = await getVoiceCallSocket();
    socket.emit('raise_hand', { callId: activeCall.id });
  }, [activeCall]);

  const grantMic = useCallback(async (targetUserId: string) => {
    if (!activeCall) return;
    const socket = await getVoiceCallSocket();
    socket.emit('grant_mic', { callId: activeCall.id, targetUserId });
  }, [activeCall]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  return {
    activeCall,
    isMuted,
    isHandRaised,
    isSpeakerOn,
    duration,
    isLoading,
    errorMsg,
    micVolume,
    isSelfLoopback,
    toggleSelfLoopback,
    startCall,
    joinCall,
    endCall,
    toggleMute,
    raiseHand,
    grantMic,
    toggleSpeaker,
  };
}

