import { useEffect, useRef, useCallback, useState } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Volume2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CallScreenProps {
  partnerName: string;
  partnerPhoto: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: 'idle' | 'calling' | 'incoming' | 'connected';
  callType: 'audio' | 'video' | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

const CallScreen = ({
  partnerName,
  partnerPhoto,
  localStream,
  remoteStream,
  callStatus,
  callType,
  onAccept,
  onReject,
  onEnd
}: CallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
      interval = setInterval(() => setCallTime(prev => prev + 1), 1000);
    } else {
      setCallTime(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => { track.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => { track.enabled = isCameraOff; });
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleSpeaker = () => setIsSpeaker(!isSpeaker);

  const localVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && localStream) node.srcObject = localStream;
  }, [localStream]);

  const remoteVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && remoteStream) node.srcObject = remoteStream;
  }, [remoteStream]);

  if (callStatus === 'idle') return null;

  const isVideo = callType === 'video';
  const isConnected = callStatus === 'connected';
  const isRinging = callStatus === 'calling' || callStatus === 'incoming';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden"
    >
      {/* Background */}
      {isConnected && isVideo ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{
          background: "linear-gradient(145deg, hsl(14 80% 20%) 0%, hsl(355 50% 12%) 50%, hsl(20 25% 6%) 100%)"
        }}>
          {/* Animated rings for ringing state */}
          {isRinging && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
                  initial={{ width: 120, height: 120, opacity: 0.6 }}
                  animate={{ width: 120 + i * 80, height: 120 + i * 80, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Overlay gradient for controls visibility */}
      {isConnected && isVideo && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
      )}

      {/* Local video PiP */}
      {isConnected && isVideo && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-14 right-4 h-44 w-28 overflow-hidden rounded-3xl border-2 border-white/20 bg-black shadow-2xl z-20"
        >
          <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <VideoOff className="h-5 w-5 text-white/50" />
            </div>
          )}
        </motion.div>
      )}

      {/* Caller Info */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-24">
        {(!isConnected || !isVideo) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="relative inline-block mb-5">
              <img
                src={partnerPhoto || "/placeholder.svg"}
                alt={partnerName}
                className={`h-28 w-28 rounded-full object-cover border-[3px] shadow-2xl ${
                  isRinging ? "border-white/30" : "border-primary/40"
                }`}
              />
              {isConnected && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-black" />
              )}
            </div>
            <h2 className="text-2xl font-heading font-bold text-white tracking-tight">{partnerName || "Unknown"}</h2>
            <motion.p
              className="text-white/60 mt-1.5 text-sm font-medium"
              animate={isRinging ? { opacity: [0.4, 1, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {callStatus === 'calling' && (isVideo ? "Video calling..." : "Calling...")}
              {callStatus === 'incoming' && (isVideo ? "Incoming video call" : "Incoming call")}
              {isConnected && formatTime(callTime)}
            </motion.p>
          </motion.div>
        )}

        {/* Connected + video: show timer overlay at top */}
        {isConnected && isVideo && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5"
          >
            <p className="text-white text-xs font-mono font-medium">{formatTime(callTime)}</p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 pb-12 pt-6 px-6"
      >
        {callStatus === 'incoming' ? (
          <div className="flex items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={onReject}
                whileTap={{ scale: 0.9 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg shadow-destructive/30"
              >
                <PhoneOff className="h-6 w-6" />
              </motion.button>
              <span className="text-[10px] text-white/50 font-medium">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={onAccept}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              >
                {isVideo ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </motion.button>
              <span className="text-[10px] text-white/50 font-medium">Accept</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-5">
            {isConnected && (
              <>
                <ControlBtn icon={isMuted ? MicOff : Mic} label={isMuted ? "Unmute" : "Mute"} active={isMuted} onClick={toggleMic} />
                <ControlBtn icon={Volume2} label={isSpeaker ? "Earpiece" : "Speaker"} active={isSpeaker} onClick={toggleSpeaker} />
              </>
            )}

            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={onEnd}
                whileTap={{ scale: 0.9 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg shadow-destructive/30"
              >
                <PhoneOff className="h-6 w-6" />
              </motion.button>
              <span className="text-[10px] text-white/50 font-medium">End</span>
            </div>

            {isConnected && isVideo && (
              <ControlBtn icon={isCameraOff ? VideoOff : Video} label={isCameraOff ? "Camera On" : "Camera Off"} active={isCameraOff} onClick={toggleCamera} />
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const ControlBtn = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
  <div className="flex flex-col items-center gap-2">
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
        active ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
      }`}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
    <span className="text-[10px] text-white/50 font-medium">{label}</span>
  </div>
);

export default CallScreen;
