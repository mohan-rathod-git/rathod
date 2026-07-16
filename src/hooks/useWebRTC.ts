import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// STUN + free TURN servers for reliable connectivity behind NATs
const servers: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    // Free TURN servers from metered.ca (reliable, global)
    { urls: "turn:a.relay.metered.ca:80", username: "e8dd65b92f6dce43fdbdf796", credential: "hXiIJCp/u+z5rMgh" },
    { urls: "turn:a.relay.metered.ca:80?transport=tcp", username: "e8dd65b92f6dce43fdbdf796", credential: "hXiIJCp/u+z5rMgh" },
    { urls: "turn:a.relay.metered.ca:443", username: "e8dd65b92f6dce43fdbdf796", credential: "hXiIJCp/u+z5rMgh" },
    { urls: "turns:a.relay.metered.ca:443?transport=tcp", username: "e8dd65b92f6dce43fdbdf796", credential: "hXiIJCp/u+z5rMgh" },
  ],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 4, // Pre-allocate candidates for faster connection
};

export const useWebRTC = (userId: string | undefined, partnerId: string | undefined) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [isCallReady, setIsCallReady] = useState(false);

  const pc = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<any>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const ringingTimeout = useRef<NodeJS.Timeout | null>(null);
  const callStatusRef = useRef(callStatus);

  // Keep ref synced for use in timeouts
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => track.stop());
  };

  const endCall = useCallback((broadcast = true) => {
    if (ringingTimeout.current) {
      clearTimeout(ringingTimeout.current);
      ringingTimeout.current = null;
    }

    if (broadcast && channel.current) {
      channel.current.send({
        type: "broadcast",
        event: "webrtc-end",
        payload: { sender: userId }
      }).catch(() => {});
    }

    // Stop all tracks
    if (pc.current) {
      pc.current.getSenders().forEach(sender => {
        if (sender.track) sender.track.stop();
      });
      pc.current.close();
      pc.current = null;
    }

    setLocalStream(prev => { stopTracks(prev); return null; });
    setRemoteStream(prev => { stopTracks(prev); return null; });
    setCallStatus('idle');
    setCallType(null);
    pendingCandidates.current = [];
  }, [userId]);

  const initPC = useCallback(() => {
    if (pc.current && pc.current.connectionState !== "closed") return pc.current;

    const peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && channel.current) {
        channel.current.send({
          type: "broadcast",
          event: "webrtc-candidate",
          payload: { candidate: event.candidate.toJSON(), sender: userId }
        }).catch(() => {});
      }
    };

    peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (state === 'connected') {
        setCallStatus('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        toast.error("Call disconnected");
        endCall(false);
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  }, [userId, endCall]);

  // Setup Supabase Realtime Channel for signaling
  useEffect(() => {
    if (!userId || !partnerId) return;

    const room = `webrtc-${[userId, partnerId].sort().join('-')}`;

    const chan = supabase.channel(room, {
      config: { broadcast: { self: false } }
    })
      .on("broadcast", { event: "webrtc-offer" }, async ({ payload }) => {
        if (payload.sender === userId) return;
        setCallType(payload.callType);
        setCallStatus('incoming');

        const peerConnection = initPC();
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));

          // Drain pending candidates
          while (pendingCandidates.current.length > 0) {
            const c = pendingCandidates.current.shift();
            if (c) await peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
        } catch (e) {
          console.error("Error handling offer:", e);
        }
      })
      .on("broadcast", { event: "webrtc-answer" }, async ({ payload }) => {
        if (payload.sender === userId) return;
        if (pc.current && pc.current.signalingState !== "stable") {
          try {
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setCallStatus('connected');
          } catch (e) {
            console.error("Error handling answer:", e);
          }
        }
      })
      .on("broadcast", { event: "webrtc-candidate" }, async ({ payload }) => {
        if (payload.sender === userId) return;
        if (pc.current && pc.current.remoteDescription) {
          try {
            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            // Candidate errors are usually non-critical
          }
        } else {
          pendingCandidates.current.push(payload.candidate);
        }
      })
      .on("broadcast", { event: "webrtc-end" }, ({ payload }) => {
        if (payload.sender === userId) return;
        endCall(false);
        toast("The call has ended.");
      })
      .subscribe((status) => {
        setIsCallReady(status === "SUBSCRIBED");
      });

    channel.current = chan;

    return () => {
      setIsCallReady(false);
      chan.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, partnerId, initPC, endCall]);

  const startCall = async (type: 'audio' | 'video') => {
    if (!channel.current || !isCallReady) {
      toast.error("Call service is connecting. Please try again.");
      return;
    }

    try {
      setCallType(type);
      setCallStatus('calling');

      if (ringingTimeout.current) clearTimeout(ringingTimeout.current);
      ringingTimeout.current = setTimeout(() => {
        if (callStatusRef.current === 'calling') {
          toast("No answer.");
          endCall();
        }
      }, 30000);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setLocalStream(stream);

      const peerConnection = initPC();
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await peerConnection.setLocalDescription(offer);

      channel.current?.send({
        type: "broadcast",
        event: "webrtc-offer",
        payload: { offer, sender: userId, callType: type }
      });

    } catch (err) {
      console.error("Error accessing media devices.", err);
      toast.error("Could not access camera/microphone.");
      endCall(false);
    }
  };

  const acceptCall = async () => {
    try {
      if (ringingTimeout.current) {
        clearTimeout(ringingTimeout.current);
        ringingTimeout.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setLocalStream(stream);
      setCallStatus('connected');

      const peerConnection = pc.current;
      if (!peerConnection) return;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      channel.current?.send({
        type: "broadcast",
        event: "webrtc-answer",
        payload: { answer, sender: userId }
      });

    } catch (err) {
      console.error("Error accepting call", err);
      toast.error("Failed to answer call.");
      endCall();
    }
  };

  const rejectCall = () => {
    endCall();
  };

  return {
    localStream,
    remoteStream,
    callStatus,
    callType,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    isCallReady,
  };
};
