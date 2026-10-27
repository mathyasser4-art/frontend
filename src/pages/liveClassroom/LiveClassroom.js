import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Pusher from 'pusher-js';
import {
  Mic, MicOff, Video, VideoOff, Shield, Users, MessageSquare,
  Monitor, Square, Smile, Edit3, RotateCcw, Copy, Check, Share2,
  Maximize2, Minimize2, LayoutGrid, UserCheck, Send, X, Hand,
  Eye, EyeOff, Trash2, ExternalLink, ArrowLeft
} from 'lucide-react';
import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';
import soundEffects from '../../utils/soundEffects';
import './LiveClassroom.css';

// Load PeerJS dynamically for WebRTC media streaming (zero build dependency conflict)
const loadPeerJS = () => {
  return new Promise((resolve) => {
    if (window.Peer) {
      resolve(window.Peer);
      return;
    }
    const existing = document.getElementById('herotalk-peerjs-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Peer));
      return;
    }
    const script = document.createElement('script');
    script.id = 'herotalk-peerjs-script';
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    script.async = true;
    script.onload = () => resolve(window.Peer);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
};

export default function LiveClassroom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n?.language === 'ar';

  // User identity
  const role = safeLocalStorage.getItem('auth_role') || 'Student';
  const isTeacher = role === 'Teacher' || role === 'School' || role === 'Admin';
  const userName = safeLocalStorage.getItem('pp_name') || safeLocalStorage.getItem('auth_userName') || (isTeacher ? 'Teacher' : 'Hero');
  const rawId = safeLocalStorage.getItem('pp_id') || safeLocalStorage.getItem('auth_id') || '';
  const [myClientId] = useState(() => {
    const base = rawId ? rawId.slice(-6) : Math.random().toString(36).substring(2, 8);
    return `${base}_${Math.random().toString(36).substring(2, 6)}`;
  });

  // Room slug
  const queryParams = new URLSearchParams(location.search);
  const queryRoom = queryParams.get('room');
  const cleanAscii = (userName || '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 12);
  const roomPrefix = cleanAscii || (isTeacher ? 'Teacher' : 'Hero');
  const defaultRoom = `AbacusHeroes_${roomPrefix}_${rawId ? rawId.slice(-6) : 'Live'}`;
  const roomName = (queryRoom && queryRoom.trim()) || defaultRoom;

  // Media states (Zoom defaults: camera & mic active on open)
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [roomLocked, setRoomLocked] = useState(false);

  // Zoom View & Layout states (First page opens 100% Full Screen Video Stage!)
  const [viewMode, setViewMode] = useState('speaker'); // 'speaker' | 'gallery'
  const [rightSidebar, setRightSidebar] = useState(null); // null | 'participants' | 'chat'
  const [activeStageTool, setActiveStageTool] = useState(null); // null | 'whiteboard' | 'soroban'
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [showReactionsPopover, setShowReactionsPopover] = useState(false);
  const [showEndPopover, setShowEndPopover] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Participants, Remote Streams, Chat, Reactions
  const [participants, setParticipants] = useState({});
  const [remoteCameraStreams, setRemoteCameraStreams] = useState({});
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [remoteScreenSharer, setRemoteScreenSharer] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Soroban & Flash Math State
  const [abacusRods, setAbacusRods] = useState([
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 },
    { upper: 0, lower: 0 }
  ]);
  const [mathDigits, setMathDigits] = useState(1);
  const [mathRows, setMathRows] = useState(3);
  const [currentQuestion, setCurrentQuestion] = useState({
    terms: [{ op: '+', val: 5 }, { op: '+', val: 3 }, { op: '-', val: 2 }],
    answer: 6
  });
  const [showAnswer, setShowAnswer] = useState(false);

  // Whiteboard Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0e71eb');

  // Refs for Media & Networking
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const cornerVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const remoteScreenVideoRef = useRef(null);
  const peerRef = useRef(null);
  const myPeerIdRef = useRef(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const activeCallsRef = useRef({});
  const rightSidebarRef = useRef(rightSidebar);
  rightSidebarRef.current = rightSidebar;

  // Meeting Elapsed Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rem = secs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(rem)}` : `${pad(mins)}:${pad(rem)}`;
  };

  // Attach local camera stream whenever video elements mount or change
  const syncLocalVideoElements = useCallback(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    if (cornerVideoRef.current && localStreamRef.current) {
      if (cornerVideoRef.current.srcObject !== localStreamRef.current) {
        cornerVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    if (pipVideoRef.current && localStreamRef.current) {
      if (pipVideoRef.current.srcObject !== localStreamRef.current) {
        pipVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, []);

  useEffect(() => {
    syncLocalVideoElements();
  }, [isVideoOff, isScreenSharing, activeStageTool, viewMode, syncLocalVideoElements]);

  useEffect(() => {
    if (remoteScreenVideoRef.current && remoteScreenStream) {
      remoteScreenVideoRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  // Helper to broadcast room events via Pusher + local BroadcastChannel
  const broadcastRoomEvent = useCallback(async (eventName, payload) => {
    const message = { ...payload, senderId: myClientId, timestamp: Date.now() };
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ eventName, data: message });
      } catch (e) {}
    }
    try {
      await fetch(`${API_BASE_URL}/competition/mathracer/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: `herotalk-${roomName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          eventName,
          eventData: message
        })
      });
    } catch (e) {}
  }, [myClientId, roomName]);

  // Call a remote peer with our camera (and screen if currently sharing)
  const callRemotePeer = useCallback((targetPeerId) => {
    const peer = peerRef.current;
    if (!peer || !targetPeerId || targetPeerId === myPeerIdRef.current) return;

    if (localStreamRef.current) {
      try {
        const call = peer.call(targetPeerId, localStreamRef.current, {
          metadata: { clientId: myClientId, name: userName, role: isTeacher ? 'Host' : 'Student', streamType: 'camera' }
        });
        if (call) {
          call.on('stream', (remoteStream) => {
            setRemoteCameraStreams((prev) => ({ ...prev, [targetPeerId]: remoteStream }));
          });
          activeCallsRef.current[targetPeerId] = call;
        }
      } catch (e) {}
    }

    if (screenStreamRef.current) {
      try {
        peer.call(targetPeerId, screenStreamRef.current, {
          metadata: { clientId: myClientId, name: userName, role: isTeacher ? 'Host' : 'Student', streamType: 'screen' }
        });
      } catch (e) {}
    }
  }, [myClientId, userName, isTeacher]);

  // Initialize Local Camera/Microphone + PeerJS + Pusher Room Sync
  useEffect(() => {
    let isMounted = true;

    const initMediaAndRoom = async () => {
      // 1. Get local camera & audio stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        syncLocalVideoElements();
      } catch (camErr) {
        // Fallback to audio-only if camera is busy/unavailable
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (isMounted) {
            localStreamRef.current = audioStream;
            setIsVideoOff(true);
          }
        } catch (audErr) {
          if (isMounted) {
            setIsVideoOff(true);
            setIsMuted(true);
          }
        }
      }

      // 2. Initialize PeerJS for WebRTC Video/Audio/Screen streaming
      const PeerClass = await loadPeerJS();
      const cleanPeerId = `ht_${roomName.replace(/[^a-zA-Z0-9]/g, '').slice(-12)}_${myClientId.replace(/[^a-zA-Z0-9]/g, '')}`;
      if (PeerClass && isMounted) {
        try {
          const peer = new PeerClass(cleanPeerId, {
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ]
            }
          });
          peerRef.current = peer;

          peer.on('open', (id) => {
            myPeerIdRef.current = id;
            broadcastRoomEvent('participant-announce', {
              peerId: id,
              name: userName,
              role: isTeacher ? 'Host' : 'Student',
              isMuted: false,
              isVideoOff: false,
              handRaised: false
            });
          });

          peer.on('call', (incomingCall) => {
            const meta = incomingCall.metadata || {};
            if (meta.streamType === 'screen') {
              incomingCall.answer();
              incomingCall.on('stream', (stream) => {
                setRemoteScreenStream(stream);
                setRemoteScreenSharer({ name: meta.name || 'Teacher', clientId: meta.clientId });
              });
              incomingCall.on('close', () => {
                setRemoteScreenStream(null);
                setRemoteScreenSharer(null);
              });
            } else {
              incomingCall.answer(localStreamRef.current || undefined);
              incomingCall.on('stream', (stream) => {
                setRemoteCameraStreams((prev) => ({ ...prev, [incomingCall.peer]: stream }));
              });
            }
          });
        } catch (e) {}
      }

      // 3. Setup incoming room event handler
      const handleIncomingEvent = (eventName, rawData) => {
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!data || data.senderId === myClientId) return;

        if (eventName === 'participant-announce' || eventName === 'participant-update') {
          setParticipants((prev) => ({
            ...prev,
            [data.senderId]: {
              clientId: data.senderId,
              peerId: data.peerId,
              name: data.name || 'Hero',
              role: data.role || 'Student',
              isMuted: !!data.isMuted,
              isVideoOff: !!data.isVideoOff,
              handRaised: !!data.handRaised,
              isScreenSharing: !!data.isScreenSharing
            }
          }));

          if (eventName === 'participant-announce') {
            if (data.peerId) {
              callRemotePeer(data.peerId);
            }
            broadcastRoomEvent('participant-update', {
              peerId: myPeerIdRef.current,
              name: userName,
              role: isTeacher ? 'Host' : 'Student',
              isMuted,
              isVideoOff,
              handRaised,
              isScreenSharing: !!screenStreamRef.current
            });
          }
        } else if (eventName === 'participant-left') {
          setParticipants((prev) => {
            const copy = { ...prev };
            delete copy[data.senderId];
            return copy;
          });
          if (data.peerId) {
            setRemoteCameraStreams((prev) => {
              const copy = { ...prev };
              delete copy[data.peerId];
              return copy;
            });
          }
        } else if (eventName === 'screen-share-stopped') {
          setRemoteScreenStream(null);
          setRemoteScreenSharer(null);
        } else if (eventName === 'chat-message') {
          setChatMessages((prev) => [...prev, data]);
          if (rightSidebarRef.current !== 'chat') {
            setUnreadChatCount((c) => c + 1);
          }
        } else if (eventName === 'reaction') {
          const id = `${Date.now()}_${Math.random()}`;
          setFloatingReactions((prev) => [...prev, { id, emoji: data.emoji, name: data.name }]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
          }, 3200);
        } else if (eventName === 'soroban-sync') {
          if (data.rods) setAbacusRods(data.rods);
          if (data.question) setCurrentQuestion(data.question);
          if (typeof data.showAnswer === 'boolean') setShowAnswer(data.showAnswer);
        } else if (eventName === 'mute-all' && !isTeacher) {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
          }
          setIsMuted(true);
        } else if (eventName === 'end-meeting-all') {
          navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
        }
      };

      // Local BroadcastChannel for instant multi-tab sync
      if (typeof window.BroadcastChannel !== 'undefined') {
        const bc = new window.BroadcastChannel(`herotalk_${roomName}`);
        broadcastChannelRef.current = bc;
        bc.onmessage = (ev) => {
          if (ev.data && ev.data.eventName) {
            handleIncomingEvent(ev.data.eventName, ev.data.data);
          }
        };
      }

      // Pusher Subscription for cross-device real-time sync
      try {
        const pusher = new Pusher('06df370fb33f1263ec1f', { cluster: 'eu' });
        pusherRef.current = pusher;
        const chName = `herotalk-${roomName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const channel = pusher.subscribe(chName);
        channelRef.current = channel;

        const events = [
          'participant-announce',
          'participant-update',
          'participant-left',
          'screen-share-stopped',
          'chat-message',
          'reaction',
          'soroban-sync',
          'mute-all',
          'end-meeting-all'
        ];
        events.forEach((evName) => {
          channel.bind(evName, (payload) => handleIncomingEvent(evName, payload));
        });
      } catch (e) {}

      // Announce presence
      broadcastRoomEvent('participant-announce', {
        peerId: myPeerIdRef.current,
        name: userName,
        role: isTeacher ? 'Host' : 'Student',
        isMuted: false,
        isVideoOff: false,
        handRaised: false
      });
    };

    initMediaAndRoom();

    return () => {
      isMounted = false;
      broadcastRoomEvent('participant-left', { peerId: myPeerIdRef.current });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch (e) {}
      }
      if (pusherRef.current) {
        try { pusherRef.current.disconnect(); } catch (e) {}
      }
      if (broadcastChannelRef.current) {
        try { broadcastChannelRef.current.close(); } catch (e) {}
      }
    };
  }, [roomName]);

  // Toggle Microphone Mute/Unmute
  const handleToggleMute = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    broadcastRoomEvent('participant-update', {
      peerId: myPeerIdRef.current,
      name: userName,
      role: isTeacher ? 'Host' : 'Student',
      isMuted: nextMuted,
      isVideoOff,
      handRaised,
      isScreenSharing
    });
  };

  // Toggle Camera Start/Stop Video
  const handleToggleVideo = async () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const nextVideoOff = !isVideoOff;

    if (!nextVideoOff && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = newVideoStream.getVideoTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        } else {
          localStreamRef.current = newVideoStream;
        }
        syncLocalVideoElements();
      } catch (e) {
        return;
      }
    } else if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
    }

    setIsVideoOff(nextVideoOff);
    broadcastRoomEvent('participant-update', {
      peerId: myPeerIdRef.current,
      name: userName,
      role: isTeacher ? 'Host' : 'Student',
      isMuted,
      isVideoOff: nextVideoOff,
      handRaised,
      isScreenSharing
    });
  };

  // ============================================================================
  // ZOOM GREEN "SHARE SCREEN" HANDLER — ZERO INFINITE MIRROR & DESKTOP PIP MODE
  // ============================================================================
  const handleStopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Exit Picture-in-Picture if active
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }

    // If opened as a standalone window, restore to full screen size
    if (window.opener) {
      try {
        window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        window.moveTo(0, 0);
      } catch (e) {}
    }

    broadcastRoomEvent('screen-share-stopped', { peerId: myPeerIdRef.current });
    broadcastRoomEvent('participant-update', {
      peerId: myPeerIdRef.current,
      name: userName,
      role: isTeacher ? 'Host' : 'Student',
      isMuted,
      isVideoOff,
      handRaised,
      isScreenSharing: false
    });
  }, [broadcastRoomEvent, handRaised, isMuted, isTeacher, isVideoOff, userName]);

  const handleToggleScreenShare = async () => {
    if (soundEffects?.playClick) soundEffects.playClick();

    if (isScreenSharing) {
      handleStopScreenShare();
      return;
    }

    try {
      // Configure CaptureController so the browser focuses the shared surface cleanly
      let captureController = null;
      if (typeof window.CaptureController !== 'undefined') {
        try {
          captureController = new window.CaptureController();
          captureController.setFocusBehavior('focus-captured-surface');
        } catch (e) {}
      }

      const displayOptions = {
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: 'include'
      };
      if (captureController) {
        displayOptions.controller = captureController;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Automatically stop share when user clicks the browser's native "Stop sharing" bar
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        screenVideoTrack.onended = () => {
          handleStopScreenShare();
        };
      }

      // Stream the shared screen to all connected students via WebRTC
      if (peerRef.current) {
        Object.values(participants).forEach((p) => {
          if (p.peerId && p.peerId !== myPeerIdRef.current) {
            try {
              peerRef.current.call(p.peerId, screenStream, {
                metadata: {
                  clientId: myClientId,
                  name: userName,
                  role: isTeacher ? 'Host' : 'Student',
                  streamType: 'screen'
                }
              });
            } catch (e) {}
          }
        });
      }

      // Pop out camera into native Always-On-Top Picture-in-Picture (PiP) so teacher sees floating camera on Desktop!
      const pipTarget = pipVideoRef.current || localVideoRef.current;
      if (pipTarget && document.pictureInPictureEnabled && !isVideoOff) {
        pipTarget.requestPictureInPicture().catch(() => {});
      }

      // If running as a standalone popup window, collapse to Zoom's top floating bar so teacher sees their Desktop!
      if (window.opener) {
        try {
          const barW = 620;
          const barH = 110;
          const leftPos = Math.round((window.screen.availWidth - barW) / 2);
          window.resizeTo(barW, barH);
          window.moveTo(leftPos, 0);
        } catch (e) {}
      }

      broadcastRoomEvent('participant-update', {
        peerId: myPeerIdRef.current,
        name: userName,
        role: isTeacher ? 'Host' : 'Student',
        isMuted,
        isVideoOff,
        handRaised,
        isScreenSharing: true
      });
    } catch (err) {
      // User cancelled screen picker
    }
  };

  // Trigger Picture-in-Picture floating camera manually if desired
  const handleTriggerPiP = async () => {
    const vid = pipVideoRef.current || cornerVideoRef.current || localVideoRef.current;
    if (vid && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await vid.requestPictureInPicture();
        }
      } catch (e) {}
    }
  };

  // Send Reaction or Toggle Raise Hand
  const handleSendReaction = (emoji) => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingReactions((prev) => [...prev, { id, emoji, name: userName }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3200);
    broadcastRoomEvent('reaction', { emoji, name: userName });
    setShowReactionsPopover(false);
  };

  const handleToggleHand = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const nextHand = !handRaised;
    setHandRaised(nextHand);
    broadcastRoomEvent('participant-update', {
      peerId: myPeerIdRef.current,
      name: userName,
      role: isTeacher ? 'Host' : 'Student',
      isMuted,
      isVideoOff,
      handRaised: nextHand,
      isScreenSharing
    });
    setShowReactionsPopover(false);
  };

  // Chat Submit
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msgObj = {
      senderId: myClientId,
      name: userName,
      role: isTeacher ? 'Host' : 'Student',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, msgObj]);
    broadcastRoomEvent('chat-message', msgObj);
    setChatInput('');
  };

  // Copy Invite Link & WhatsApp Invite
  const handleCopyInvite = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppInvite = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const link = `${window.location.origin}/live-classroom?room=${encodeURIComponent(roomName)}`;
    const msg = isArabic
      ? `مرحباً يا أبطال 🌟\nتبدأ الآن حصتنا المباشرة عبر HeroTalk في منصة أبطال العداد (Abacus Heroes)!\n\nاضغط على الرابط للانضمام فوراً:\n${link}`
      : `Hello Heroes! 🌟\nOur HeroTalk Live Class on Abacus Heroes is starting right now!\n\nClick the link to join instantly:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Leave / End Meeting
  const handleLeaveMeeting = (endForAll = false) => {
    if (soundEffects?.playClick) soundEffects.playClick();
    if (endForAll && isTeacher) {
      broadcastRoomEvent('end-meeting-all', {});
    }
    if (role === 'Teacher') {
      navigate('/dashboard/teacher');
    } else if (role === 'Student') {
      navigate('/dashboard/student');
    } else {
      navigate('/');
    }
  };

  // Soroban Abacus Helpers
  const calculateAbacusTotal = () => {
    let total = 0;
    const multipliers = [10000, 1000, 100, 10, 1];
    abacusRods.forEach((rod, idx) => {
      total += ((rod.upper * 5) + rod.lower) * multipliers[idx];
    });
    return total;
  };

  const toggleUpperBead = (rodIdx) => {
    if (soundEffects?.playClick) soundEffects.playClick();
    setAbacusRods((prev) => {
      const updated = [...prev];
      updated[rodIdx] = { ...updated[rodIdx], upper: updated[rodIdx].upper === 1 ? 0 : 1 };
      broadcastRoomEvent('soroban-sync', { rods: updated });
      return updated;
    });
  };

  const setLowerBeads = (rodIdx, beadIndex) => {
    if (soundEffects?.playClick) soundEffects.playClick();
    setAbacusRods((prev) => {
      const updated = [...prev];
      const currentActive = updated[rodIdx].lower;
      const newActive = currentActive === beadIndex ? beadIndex - 1 : beadIndex;
      updated[rodIdx] = { ...updated[rodIdx], lower: Math.max(0, Math.min(4, newActive)) };
      broadcastRoomEvent('soroban-sync', { rods: updated });
      return updated;
    });
  };

  const resetAbacus = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    const empty = [
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 },
      { upper: 0, lower: 0 }
    ];
    setAbacusRods(empty);
    broadcastRoomEvent('soroban-sync', { rods: empty });
  };

  const generateNewQuestion = () => {
    if (soundEffects?.playClick) soundEffects.playClick();
    setShowAnswer(false);
    const max = Math.pow(10, mathDigits) - 1;
    const min = mathDigits === 1 ? 1 : Math.pow(10, mathDigits - 1);
    const terms = [];
    let runningTotal = 0;
    for (let i = 0; i < mathRows; i++) {
      if (i === 0) {
        const val = Math.floor(Math.random() * (max - min + 1)) + min;
        terms.push({ op: '+', val });
        runningTotal += val;
      } else {
        const canSubtract = runningTotal > min;
        const isSub = canSubtract && Math.random() > 0.45;
        if (isSub) {
          const maxSub = Math.min(runningTotal, max);
          const val = Math.floor(Math.random() * (maxSub - 1)) + 1;
          terms.push({ op: '-', val });
          runningTotal -= val;
        } else {
          const val = Math.floor(Math.random() * (max - min + 1)) + min;
          terms.push({ op: '+', val });
          runningTotal += val;
        }
      }
    }
    const nextQ = { terms, answer: runningTotal };
    setCurrentQuestion(nextQ);
    broadcastRoomEvent('soroban-sync', { question: nextQ, showAnswer: false });
  };

  // Whiteboard Drawing Helpers
  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => setIsDrawing(false);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const remoteParticipantList = Object.values(participants);
  const totalParticipantCount = 1 + remoteParticipantList.length;

  return (
    <div className="zoom-classroom-root" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Persistent Video Element for Desktop Picture-in-Picture (PiP) so PiP never drops */}
      <video
        ref={pipVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', bottom: 0, right: 0 }}
      />
      {/* ====================================================================
          ZOOM FLOATING TOP BAR WHEN SHARING SCREEN (ZERO INFINITE MIRROR!)
          ==================================================================== */}
      {isScreenSharing && (
        <div className="zoom-floating-share-bar-wrapper">
          <div className="zoom-share-status-strip">
            <div className="zoom-share-green-pill">
              <Shield size={15} />
              <span>{isArabic ? 'أنت تشارك شاشتك الآن' : 'You are screen sharing'}</span>
            </div>
            <button className="zoom-share-stop-btn" onClick={handleStopScreenShare}>
              <Square size={13} fill="#ffffff" />
              <span>{isArabic ? 'إيقاف المشاركة' : 'Stop Share'}</span>
            </button>
          </div>

          <div className="zoom-share-mini-toolbar">
            <button className="zoom-share-mini-btn" onClick={handleToggleMute}>
              {isMuted ? <MicOff size={14} color="#ff5c5c" /> : <Mic size={14} color="#23d959" />}
              <span>{isMuted ? (isArabic ? 'إلغاء الكتم' : 'Unmute') : (isArabic ? 'كتم' : 'Mute')}</span>
            </button>
            <button className="zoom-share-mini-btn" onClick={handleToggleVideo}>
              {isVideoOff ? <VideoOff size={14} color="#ff5c5c" /> : <Video size={14} />}
              <span>{isVideoOff ? (isArabic ? 'تشغيل الفيديو' : 'Start Video') : (isArabic ? 'إيقاف الفيديو' : 'Stop Video')}</span>
            </button>
            <button
              className={`zoom-share-mini-btn ${activeStageTool === 'whiteboard' ? 'active' : ''}`}
              onClick={() => setActiveStageTool(activeStageTool === 'whiteboard' ? null : 'whiteboard')}
            >
              <Edit3 size={14} />
              <span>{isArabic ? 'السبورة' : 'Whiteboard'}</span>
            </button>
            <button
              className={`zoom-share-mini-btn ${activeStageTool === 'soroban' ? 'active' : ''}`}
              onClick={() => setActiveStageTool(activeStageTool === 'soroban' ? null : 'soroban')}
            >
              <span>🧮</span>
              <span>{isArabic ? 'العداد والمسائل' : 'Soroban & Math'}</span>
            </button>
            <button className="zoom-share-mini-btn" onClick={handleTriggerPiP}>
              <ExternalLink size={14} />
              <span>{isArabic ? 'كاميرا عائمة على سطح المكتب' : 'Float Camera on Desktop'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          1. ZOOM TOP HEADER BAR
          ==================================================================== */}
      <header className="zoom-top-bar">
        <div className="zoom-top-left">
          <button
            className="zoom-top-btn"
            onClick={() => handleLeaveMeeting(false)}
            title={isArabic ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          >
            <ArrowLeft size={14} style={{ transform: isArabic ? 'scaleX(-1)' : 'none' }} />
            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
          </button>

          <button
            className="zoom-shield-btn"
            onClick={() => setShowInfoPopover(!showInfoPopover)}
            title={isArabic ? 'معلومات الحصة والأمان' : 'Meeting Information & Security'}
          >
            <Shield size={15} />
          </button>

          <div className="zoom-live-pill">
            <span className="zoom-live-dot"></span>
            <span>HEROTALK</span>
          </div>

          <span className="zoom-meeting-title">
            {isArabic ? `غرفة ${userName}` : `${userName}'s Classroom`}
          </span>

          <span className="zoom-timer-badge">{formatDuration(elapsedSeconds)}</span>

          <button className="zoom-top-btn" onClick={handleCopyInvite}>
            {copied ? <Check size={13} color="#23d959" /> : <Copy size={13} />}
            <span>{copied ? (isArabic ? 'تم نسخ الرابط!' : 'Copied!') : (isArabic ? 'نسخ رابط الدعوة' : 'Copy Invite Link')}</span>
          </button>

          <button className="zoom-top-btn whatsapp-invite" onClick={handleWhatsAppInvite}>
            <Share2 size={13} />
            <span>{isArabic ? 'دعوة واتساب' : 'Invite WhatsApp'}</span>
          </button>
        </div>

        <div className="zoom-top-right">
          <button
            className="zoom-top-btn"
            onClick={() => setViewMode(viewMode === 'speaker' ? 'gallery' : 'speaker')}
          >
            <LayoutGrid size={14} />
            <span>
              {viewMode === 'speaker'
                ? (isArabic ? 'طريقة العرض: المتحدث' : 'View: Speaker')
                : (isArabic ? 'طريقة العرض: المعرض' : 'View: Gallery')}
            </span>
          </button>

          <button className="zoom-top-btn" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* Zoom Meeting Info Popover */}
        {showInfoPopover && (
          <div className="zoom-info-popover">
            <h4>{isArabic ? 'معلومات حصة HeroTalk' : 'HeroTalk Meeting Info'}</h4>
            <div className="zoom-info-row">
              <span>{isArabic ? 'المضيف:' : 'Host:'}</span>
              <strong>{userName}</strong>
            </div>
            <div className="zoom-info-row">
              <span>{isArabic ? 'رمز الغرفة:' : 'Room Code:'}</span>
              <strong>{roomName}</strong>
            </div>
            <div className="zoom-info-row">
              <span>{isArabic ? 'التشفير:' : 'Encryption:'}</span>
              <strong style={{ color: '#23d959' }}>{isArabic ? 'مفعل (WebRTC P2P)' : 'Enabled (WebRTC P2P)'}</strong>
            </div>
            <button
              className="zoom-sidebar-btn"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleCopyInvite}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? (isArabic ? 'تم النسخ!' : 'Link Copied!') : (isArabic ? 'نسخ رابط الانضمام' : 'Copy Join Link')}</span>
            </button>
          </div>
        )}
      </header>

      {/* ====================================================================
          2. MAIN ZOOM STAGE (100% FULL SCREEN FIRST PAGE!)
          ==================================================================== */}
      <div className="zoom-main-workspace">
        <div className="zoom-stage-area">
          {/* CASE A: Interactive Whiteboard or Soroban Tool Opened */}
          {activeStageTool ? (
            <div className="zoom-tool-stage-overlay">
              <div className="zoom-tool-header">
                <div className="zoom-tool-tabs">
                  <button
                    className={`zoom-tool-tab ${activeStageTool === 'whiteboard' ? 'active' : ''}`}
                    onClick={() => setActiveStageTool('whiteboard')}
                  >
                    <Edit3 size={15} />
                    <span>{isArabic ? 'السبورة البيضاء (Whiteboard)' : 'Zoom Whiteboard'}</span>
                  </button>
                  <button
                    className={`zoom-tool-tab ${activeStageTool === 'soroban' ? 'active' : ''}`}
                    onClick={() => setActiveStageTool('soroban')}
                  >
                    <span>🧮</span>
                    <span>{isArabic ? 'العداد الصيني ومولد المسائل' : 'Virtual Soroban & Flash Math'}</span>
                  </button>
                </div>

                <button
                  className="zoom-top-btn"
                  style={{ background: '#e02828', borderColor: '#e02828', color: '#fff' }}
                  onClick={() => setActiveStageTool(null)}
                >
                  <X size={14} />
                  <span>{isArabic ? 'إغلاق السبورة والعودة للفيديو' : 'Close Board'}</span>
                </button>
              </div>

              <div className="zoom-tool-body">
                {activeStageTool === 'whiteboard' ? (
                  <div className="zoom-whiteboard-container">
                    <div className="zoom-wb-toolbar">
                      <div className="zoom-wb-colors">
                        {['#0e71eb', '#111827', '#e02828', '#16a34a', '#d97706', '#9333ea'].map((c) => (
                          <div
                            key={c}
                            className={`zoom-color-dot ${penColor === c ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setPenColor(c)}
                          />
                        ))}
                      </div>
                      <button className="zoom-top-btn" onClick={handleClearCanvas}>
                        <Trash2 size={14} />
                        <span>{isArabic ? 'مسح السبورة' : 'Clear All'}</span>
                      </button>
                    </div>
                    <div className="zoom-wb-canvas-wrap">
                      <canvas
                        ref={canvasRef}
                        width={1280}
                        height={620}
                        className="zoom-wb-canvas"
                        onMouseDown={handleStartDraw}
                        onMouseMove={handleDraw}
                        onMouseUp={handleStopDraw}
                        onMouseLeave={handleStopDraw}
                        onTouchStart={handleStartDraw}
                        onTouchMove={handleDraw}
                        onTouchEnd={handleStopDraw}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="zoom-soroban-math-grid">
                    {/* Soroban Card */}
                    <div className="zoom-soroban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '16px' }}>
                          🧮 {isArabic ? 'العداد التفاعلي (السوروبان)' : 'Interactive Soroban Abacus'}
                        </strong>
                        <button className="zoom-top-btn" onClick={resetAbacus}>
                          <RotateCcw size={13} />
                          <span>{isArabic ? 'تصفير' : 'Reset'}</span>
                        </button>
                      </div>
                      <div className="soroban-counter-display">
                        {calculateAbacusTotal().toLocaleString()}
                      </div>
                      <div className="soroban-frame">
                        <div className="soroban-rods-container">
                          <div className="soroban-divider-bar"></div>
                          {abacusRods.map((rod, rIdx) => (
                            <div key={rIdx} className="soroban-rod">
                              <div className="soroban-rod-wire"></div>
                              <div className="soroban-upper-deck">
                                <div
                                  className={`soroban-bead ${rod.upper === 1 ? 'upper-active' : ''}`}
                                  onClick={() => toggleUpperBead(rIdx)}
                                ></div>
                              </div>
                              <div className="soroban-lower-deck">
                                {[1, 2, 3, 4].map((beadNum) => (
                                  <div
                                    key={beadNum}
                                    className={`soroban-bead ${rod.lower >= beadNum ? 'lower-active' : ''}`}
                                    onClick={() => setLowerBeads(rIdx, beadNum)}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mental Math Generator Card */}
                    <div className="zoom-math-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '16px' }}>
                          ⚡ {isArabic ? 'مولد المسائل السريعة' : 'Flash Mental Math'}
                        </strong>
                        <button
                          className="zoom-top-btn"
                          style={{ background: '#0e71eb', borderColor: '#0e71eb', color: '#fff' }}
                          onClick={generateNewQuestion}
                        >
                          <span>🎲 {isArabic ? 'مسألة جديدة' : 'New Question'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {[1, 2, 3].map((d) => (
                          <button
                            key={d}
                            className="zoom-top-btn"
                            style={mathDigits === d ? { background: '#0e71eb', color: '#fff' } : {}}
                            onClick={() => setMathDigits(d)}
                          >
                            {d} {isArabic ? 'خانات' : 'Digits'}
                          </button>
                        ))}
                        {[3, 4, 5].map((r) => (
                          <button
                            key={r}
                            className="zoom-top-btn"
                            style={mathRows === r ? { background: '#16a34a', color: '#fff' } : {}}
                            onClick={() => setMathRows(r)}
                          >
                            {r} {isArabic ? 'صفوف' : 'Rows'}
                          </button>
                        ))}
                      </div>

                      <div className="math-question-box">
                        <div className="math-terms-list">
                          {currentQuestion.terms.map((term, idx) => (
                            <div key={idx} className="math-term-row">
                              <span className="term-op">{idx === 0 ? '' : term.op}</span>
                              <span>{term.val}</span>
                            </div>
                          ))}
                          <div className="math-line-separator"></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
                          <button className="zoom-top-btn" onClick={() => setShowAnswer(!showAnswer)}>
                            {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{showAnswer ? (isArabic ? 'إخفاء الناتج' : 'Hide Answer') : (isArabic ? 'إظهار الناتج' : 'Show Answer')}</span>
                          </button>
                          {showAnswer && (
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#23d959', fontFamily: 'monospace' }}>
                              = {currentQuestion.answer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isScreenSharing ? (
            /* ==================================================================
               CASE B: PRESENTER IS SHARING SCREEN — ZERO RECURSIVE MIRROR!
               Just like Zoom, we NEVER render the local screen video back onto
               the presenter's screen so there is NEVER an infinite mirror!
               ================================================================== */
            <div className="zoom-desktop-share-mode">
              <div className="zoom-share-clean-card">
                <div className="zoom-share-active-icon">
                  <Monitor size={32} />
                </div>
                <h2>
                  {isArabic
                    ? '🟢 أنت تشارك شاشتك الآن بنجاح (بدون تكرار الشاشة!)'
                    : '🟢 Your Screen is Live for Students (Zero Screen Mirror!)'}
                </h2>
                <p>
                  {isArabic
                    ? 'تماماً مثل Zoom: لا يتم عرض شاشة داخل شاشة أبداً. يمكنك الآن تصغير المتصفح (—) والانتقال لسطح المكتب أو أي برنامج على جهازك للشرح بحرية، أو فتح السبورة والعداد من الأزرار التالية:'
                    : 'Just like Zoom: your screen is shared cleanly without infinite screen-in-screen mirroring. Minimize this browser window (—) to work directly on your Desktop, or launch a teaching tool below:'}
                </p>

                <div className="zoom-share-quick-actions">
                  <button className="zoom-share-action-pill" onClick={() => setActiveStageTool('whiteboard')}>
                    <Edit3 size={16} />
                    <span>{isArabic ? 'فتح السبورة البيضاء' : 'Open Whiteboard'}</span>
                  </button>
                  <button className="zoom-share-action-pill" onClick={() => setActiveStageTool('soroban')}>
                    <span>🧮</span>
                    <span>{isArabic ? 'فتح العداد والمسائل' : 'Open Soroban Abacus'}</span>
                  </button>
                  <button className="zoom-share-action-pill" onClick={handleTriggerPiP}>
                    <ExternalLink size={16} />
                    <span>{isArabic ? 'تثبيت الكاميرا فوق سطح المكتب' : 'Float Camera on Desktop (PiP)'}</span>
                  </button>
                  <button className="zoom-share-action-pill stop-red" onClick={handleStopScreenShare}>
                    <Square size={15} fill="#ffffff" />
                    <span>{isArabic ? 'إيقاف مشاركة الشاشة' : 'Stop Share'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : remoteScreenStream ? (
            /* ==================================================================
               CASE C: VIEWING REMOTE TEACHER/PARTICIPANT SHARED SCREEN
               ================================================================== */
            <div className="zoom-primary-stage-box">
              <video
                ref={remoteScreenVideoRef}
                autoPlay
                playsInline
                className="zoom-video-element screen-fit"
              />
              <div className="zoom-tile-nametag">
                <Monitor size={14} color="#23d959" />
                <span>
                  {isArabic
                    ? `مشاركة شاشة: ${remoteScreenSharer?.name || 'المعلم'}`
                    : `${remoteScreenSharer?.name || 'Teacher'}'s Screen`}
                </span>
              </div>
            </div>
          ) : viewMode === 'gallery' && totalParticipantCount > 1 ? (
            /* ==================================================================
               CASE D: ZOOM GALLERY VIEW (GRID OF PARTICIPANTS)
               ================================================================== */
            <div
              className={`zoom-gallery-grid ${
                totalParticipantCount === 1
                  ? 'count-1'
                  : totalParticipantCount === 2
                  ? 'count-2'
                  : totalParticipantCount <= 4
                  ? 'count-4'
                  : 'count-many'
              }`}
            >
              {/* Local Participant Tile */}
              <div className="zoom-gallery-tile">
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="zoom-video-element mirrored"
                  />
                ) : (
                  <div className="zoom-avatar-placeholder">
                    <div className="zoom-avatar-circle">{userName.charAt(0)}</div>
                    <span className="zoom-avatar-name">{userName}</span>
                  </div>
                )}
                {handRaised && (
                  <div className="zoom-hand-badge">
                    <span>✋</span>
                    <span>{isArabic ? 'يرفع يده' : 'Hand Raised'}</span>
                  </div>
                )}
                <div className="zoom-tile-nametag">
                  {isMuted ? <MicOff size={13} color="#ff5c5c" /> : <Mic size={13} color="#23d959" />}
                  <span>{userName} ({isArabic ? 'أنت' : 'Me'})</span>
                </div>
              </div>

              {/* Remote Participant Tiles */}
              {remoteParticipantList.map((p) => {
                const stream = p.peerId ? remoteCameraStreams[p.peerId] : null;
                return (
                  <RemoteVideoTile
                    key={p.clientId}
                    participant={p}
                    stream={stream}
                    isArabic={isArabic}
                  />
                );
              })}
            </div>
          ) : (
            /* ==================================================================
               CASE E: DEFAULT ZOOM SPEAKER STAGE (100% FULL SCREEN VIDEO!)
               ================================================================== */
            <>
              {/* Top Filmstrip when other participants are present */}
              {remoteParticipantList.length > 0 && (
                <div className="zoom-top-filmstrip">
                  {remoteParticipantList.map((p) => {
                    const stream = p.peerId ? remoteCameraStreams[p.peerId] : null;
                    return (
                      <RemoteVideoTile
                        key={p.clientId}
                        participant={p}
                        stream={stream}
                        isArabic={isArabic}
                        isFilmstrip
                      />
                    );
                  })}
                </div>
              )}

              {/* Full-Size Primary Zoom Stage */}
              <div className={`zoom-primary-stage-box ${!isMuted ? 'speaking-glow' : ''}`}>
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="zoom-video-element mirrored"
                  />
                ) : (
                  <div className="zoom-avatar-placeholder">
                    <div className="zoom-avatar-circle">{userName.charAt(0)}</div>
                    <span className="zoom-avatar-name">{userName}</span>
                  </div>
                )}

                {handRaised && (
                  <div className="zoom-hand-badge">
                    <span>✋</span>
                    <span>{isArabic ? 'يرفع يده' : 'Hand Raised'}</span>
                  </div>
                )}

                <div className="zoom-tile-nametag">
                  {isMuted ? <MicOff size={14} color="#ff5c5c" /> : <Mic size={14} color="#23d959" />}
                  <span>
                    {userName} ({isTeacher ? (isArabic ? 'المضيف، أنت' : 'Host, Me') : (isArabic ? 'أنت' : 'Me')})
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Floating Corner Camera Thumbnail when Screen Sharing or Whiteboard is open */}
          {(isScreenSharing || activeStageTool || remoteScreenStream) && (
            <div className="zoom-floating-corner-cam">
              {!isVideoOff ? (
                <video
                  ref={cornerVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="zoom-video-element mirrored"
                />
              ) : (
                <div className="zoom-avatar-circle small">{userName.charAt(0)}</div>
              )}
              <div className="zoom-tile-nametag" style={{ padding: '2px 7px', fontSize: '11px' }}>
                {isMuted ? <MicOff size={11} color="#ff5c5c" /> : <Mic size={11} color="#23d959" />}
                <span>{userName}</span>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================
            ZOOM RIGHT SIDEBAR (PARTICIPANTS OR CHAT)
            ================================================================== */}
        {rightSidebar === 'participants' && (
          <aside className="zoom-right-sidebar">
            <div className="zoom-sidebar-header">
              <h3>
                {isArabic ? `المشاركون (${totalParticipantCount})` : `Participants (${totalParticipantCount})`}
              </h3>
              <button className="zoom-sidebar-close" onClick={() => setRightSidebar(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="zoom-participants-list">
              {/* Self */}
              <div className="zoom-participant-item">
                <div className="zoom-participant-left">
                  <div className="zoom-participant-avatar">{userName.charAt(0)}</div>
                  <div>
                    <div className="zoom-participant-name">
                      {userName} ({isArabic ? 'أنت' : 'Me'})
                    </div>
                    <div className="zoom-participant-role">
                      {isTeacher ? (isArabic ? 'المضيف (Host)' : 'Host') : (isArabic ? 'طالب' : 'Participant')}
                    </div>
                  </div>
                </div>
                <div className="zoom-participant-icons">
                  {handRaised && <span>✋</span>}
                  {isMuted ? <MicOff size={15} color="#ff5c5c" /> : <Mic size={15} color="#23d959" />}
                  {isVideoOff ? <VideoOff size={15} color="#ff5c5c" /> : <Video size={15} color="#94a3b8" />}
                </div>
              </div>

              {/* Remote Participants */}
              {remoteParticipantList.map((p) => (
                <div key={p.clientId} className="zoom-participant-item">
                  <div className="zoom-participant-left">
                    <div className="zoom-participant-avatar">{(p.name || 'H').charAt(0)}</div>
                    <div>
                      <div className="zoom-participant-name">{p.name}</div>
                      <div className="zoom-participant-role">{p.role}</div>
                    </div>
                  </div>
                  <div className="zoom-participant-icons">
                    {p.handRaised && <span>✋</span>}
                    {p.isScreenSharing && <Monitor size={15} color="#23d959" />}
                    {p.isMuted ? <MicOff size={15} color="#ff5c5c" /> : <Mic size={15} color="#23d959" />}
                    {p.isVideoOff ? <VideoOff size={15} color="#ff5c5c" /> : <Video size={15} color="#94a3b8" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="zoom-sidebar-footer">
              <button className="zoom-sidebar-btn" onClick={handleCopyInvite}>
                <Copy size={13} />
                <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'دعوة' : 'Invite')}</span>
              </button>
              {isTeacher && (
                <button
                  className="zoom-sidebar-btn"
                  onClick={() => broadcastRoomEvent('mute-all', {})}
                >
                  <MicOff size={13} />
                  <span>{isArabic ? 'كتم الجميع' : 'Mute All'}</span>
                </button>
              )}
            </div>
          </aside>
        )}

        {rightSidebar === 'chat' && (
          <aside className="zoom-right-sidebar">
            <div className="zoom-sidebar-header">
              <h3>{isArabic ? 'محادثة الحصة (Meeting Chat)' : 'Meeting Chat'}</h3>
              <button className="zoom-sidebar-close" onClick={() => setRightSidebar(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="zoom-chat-messages">
              {chatMessages.length === 0 ? (
                <div className="zoom-chat-empty">
                  {isArabic
                    ? 'الرسائل المرسلة هنا تظهر لجميع المشاركين في الحصة.'
                    : 'Messages sent here are visible to everyone in the meeting.'}
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`zoom-chat-bubble ${m.senderId === myClientId ? 'mine' : ''}`}
                  >
                    <div className="zoom-chat-meta">
                      <strong>{m.senderId === myClientId ? (isArabic ? 'أنت' : 'Me') : m.name}</strong>
                      <span>{m.time}</span>
                    </div>
                    <div className="zoom-chat-text">{m.text}</div>
                  </div>
                ))
              )}
            </div>

            <form className="zoom-chat-form" onSubmit={handleSendChat}>
              <input
                type="text"
                className="zoom-chat-input"
                placeholder={isArabic ? 'اكتب رسالة للجميع...' : 'Message to everyone...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="zoom-chat-send">
                <Send size={15} />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* Floating Emoji Reactions Layer */}
      <div className="zoom-floating-reactions-layer">
        {floatingReactions.map((r) => (
          <div key={r.id} className="zoom-reaction-bubble">
            <span style={{ fontSize: '20px' }}>{r.emoji}</span>
            <span>{r.name}</span>
          </div>
        ))}
      </div>

      {/* ====================================================================
          3. ZOOM BOTTOM CONTROL BAR (WITH BRIGHT GREEN SHARE BUTTON IN CENTER!)
          ==================================================================== */}
      <footer className="zoom-bottom-toolbar">
        {/* Left: Audio & Video Controls */}
        <div className="zoom-toolbar-left">
          <button
            className={`zoom-ctrl-btn ${isMuted ? 'danger-state' : ''}`}
            onClick={handleToggleMute}
          >
            <div className="zoom-ctrl-icon-wrap">
              {isMuted ? <MicOff size={21} color="#ff5c5c" /> : <Mic size={21} />}
            </div>
            <span className="zoom-ctrl-label">
              {isMuted ? (isArabic ? 'إلغاء الكتم' : 'Unmute') : (isArabic ? 'كتم الصوت' : 'Mute')}
            </span>
          </button>

          <button
            className={`zoom-ctrl-btn ${isVideoOff ? 'danger-state' : ''}`}
            onClick={handleToggleVideo}
          >
            <div className="zoom-ctrl-icon-wrap">
              {isVideoOff ? <VideoOff size={21} color="#ff5c5c" /> : <Video size={21} />}
            </div>
            <span className="zoom-ctrl-label">
              {isVideoOff ? (isArabic ? 'تشغيل الفيديو' : 'Start Video') : (isArabic ? 'إيقاف الفيديو' : 'Stop Video')}
            </span>
          </button>
        </div>

        {/* Center: Security, Participants, Chat, BRIGHT GREEN SHARE SCREEN, Whiteboard, Soroban, Reactions */}
        <div className="zoom-toolbar-center">
          {isTeacher && (
            <button
              className={`zoom-ctrl-btn ${roomLocked ? 'active-panel' : ''}`}
              onClick={() => setRoomLocked(!roomLocked)}
            >
              <div className="zoom-ctrl-icon-wrap">
                <Shield size={20} />
              </div>
              <span className="zoom-ctrl-label">{isArabic ? 'الأمان' : 'Security'}</span>
            </button>
          )}

          <button
            className={`zoom-ctrl-btn ${rightSidebar === 'participants' ? 'active-panel' : ''}`}
            onClick={() => setRightSidebar(rightSidebar === 'participants' ? null : 'participants')}
          >
            <div className="zoom-ctrl-icon-wrap">
              <Users size={20} />
              <span className="zoom-ctrl-badge">{totalParticipantCount}</span>
            </div>
            <span className="zoom-ctrl-label">{isArabic ? 'المشاركون' : 'Participants'}</span>
          </button>

          <button
            className={`zoom-ctrl-btn ${rightSidebar === 'chat' ? 'active-panel' : ''}`}
            onClick={() => {
              setUnreadChatCount(0);
              setRightSidebar(rightSidebar === 'chat' ? null : 'chat');
            }}
          >
            <div className="zoom-ctrl-icon-wrap">
              <MessageSquare size={20} />
              {unreadChatCount > 0 && (
                <span className="zoom-ctrl-badge unread">{unreadChatCount}</span>
              )}
            </div>
            <span className="zoom-ctrl-label">{isArabic ? 'المحادثة' : 'Chat'}</span>
          </button>

          {/* ================================================================
              CENTER BRIGHT GREEN "SHARE SCREEN" BUTTON (EXACT ZOOM PLACE & COLOR)
              ================================================================ */}
          <button
            className={`zoom-ctrl-btn zoom-share-screen-btn ${isScreenSharing ? 'sharing-active' : ''}`}
            onClick={handleToggleScreenShare}
          >
            <div className="zoom-ctrl-icon-wrap">
              {isScreenSharing ? <Square size={20} fill="#ffffff" /> : <Monitor size={21} strokeWidth={2.4} />}
            </div>
            <span className="zoom-ctrl-label">
              {isScreenSharing
                ? (isArabic ? 'إيقاف المشاركة' : 'Stop Share')
                : (isArabic ? 'مشاركة الشاشة' : 'Share Screen')}
            </span>
          </button>

          <button
            className={`zoom-ctrl-btn ${activeStageTool === 'whiteboard' ? 'active-panel' : ''}`}
            onClick={() => setActiveStageTool(activeStageTool === 'whiteboard' ? null : 'whiteboard')}
          >
            <div className="zoom-ctrl-icon-wrap">
              <Edit3 size={20} />
            </div>
            <span className="zoom-ctrl-label">{isArabic ? 'السبورة' : 'Whiteboard'}</span>
          </button>

          <button
            className={`zoom-ctrl-btn ${activeStageTool === 'soroban' ? 'active-panel' : ''}`}
            onClick={() => setActiveStageTool(activeStageTool === 'soroban' ? null : 'soroban')}
          >
            <div className="zoom-ctrl-icon-wrap">
              <span style={{ fontSize: '19px' }}>🧮</span>
            </div>
            <span className="zoom-ctrl-label">{isArabic ? 'العداد' : 'Soroban'}</span>
          </button>

          <button
            className={`zoom-ctrl-btn ${showReactionsPopover ? 'active-panel' : ''}`}
            onClick={() => setShowReactionsPopover(!showReactionsPopover)}
          >
            <div className="zoom-ctrl-icon-wrap">
              <Smile size={20} />
            </div>
            <span className="zoom-ctrl-label">{isArabic ? 'تفاعلات' : 'Reactions'}</span>
          </button>
        </div>

        {/* Right: Zoom Red "End" Button */}
        <div className="zoom-toolbar-right">
          <button
            className="zoom-end-btn"
            onClick={() => setShowEndPopover(!showEndPopover)}
          >
            {isTeacher ? (isArabic ? 'إنهاء' : 'End') : (isArabic ? 'مغادرة' : 'Leave')}
          </button>
        </div>

        {/* Reactions Popover */}
        {showReactionsPopover && (
          <div className="zoom-reactions-popover">
            <div className="zoom-emoji-row">
              {['👏', '👍', '❤️', '😂', '😮', '🎉'].map((em) => (
                <button key={em} className="zoom-emoji-btn" onClick={() => handleSendReaction(em)}>
                  {em}
                </button>
              ))}
            </div>
            <button
              className={`zoom-raise-hand-btn ${handRaised ? 'active' : ''}`}
              onClick={handleToggleHand}
            >
              <span>✋</span>
              <span>
                {handRaised
                  ? (isArabic ? 'خفض اليد (Lower Hand)' : 'Lower Hand')
                  : (isArabic ? 'رفع اليد (Raise Hand)' : 'Raise Hand')}
              </span>
            </button>
          </div>
        )}

        {/* End Meeting Confirmation Popover */}
        {showEndPopover && (
          <div className="zoom-end-popover">
            {isTeacher && (
              <button className="zoom-end-option-all" onClick={() => handleLeaveMeeting(true)}>
                {isArabic ? 'إنهاء الحصة للجميع' : 'End Meeting for All'}
              </button>
            )}
            <button className="zoom-end-option-leave" onClick={() => handleLeaveMeeting(false)}>
              {isArabic ? 'مغادرة الحصة' : 'Leave Meeting'}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

// Helper Component to render Remote Participant Video Tile
function RemoteVideoTile({ participant, stream, isArabic, isFilmstrip = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={isFilmstrip ? 'zoom-filmstrip-tile' : 'zoom-gallery-tile'}>
      {stream && !participant.isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="zoom-video-element"
        />
      ) : (
        <div className="zoom-avatar-placeholder">
          <div className={`zoom-avatar-circle ${isFilmstrip ? 'small' : ''}`}>
            {(participant.name || 'H').charAt(0)}
          </div>
          {!isFilmstrip && <span className="zoom-avatar-name">{participant.name}</span>}
        </div>
      )}

      {participant.handRaised && (
        <div className="zoom-hand-badge" style={isFilmstrip ? { padding: '2px 6px', fontSize: '11px' } : {}}>
          <span>✋</span>
        </div>
      )}

      <div className="zoom-tile-nametag" style={isFilmstrip ? { padding: '2px 6px', fontSize: '11px' } : {}}>
        {participant.isMuted ? (
          <MicOff size={12} color="#ff5c5c" />
        ) : (
          <Mic size={12} color="#23d959" />
        )}
        <span>{participant.name}</span>
      </div>
    </div>
  );
}
