"use client";

import { useState, useRef } from "react";
import { Mic, Upload, Play, Pause, FileAudio, Sparkles, Check, RefreshCw } from "lucide-react";

interface AudioUploadWidgetProps {
  onTranscriptGenerated: (transcriptText: string) => void;
}

const SAMPLE_TRANSCRIPTS = [
  `Manager: Hi Alex, thanks for hopping on today's 1:1. How are you feeling about the Q3 launch timelines?
Alex: Overall good, but we have a small blocker on the database migration step. We might need an extra engineer for two days.
Manager: Got it. I can pull in Jordan from team B to help. What about the frontend polishing?
Alex: Frontend is 90% done. I'll finish the responsive testing by Thursday afternoon.
Manager: Perfect. Let's make sure we review the staging deployment on Friday morning.`,
  `Manager: Hey Sam, let me know how the client onboarding workflow is shaping up.
Sam: We completed the OAuth integration yesterday. Next is setting up automated email alerts.
Manager: That's great progress! Did you run into any security compliance questions?
Sam: Just one regarding token encryption. I'll write up a short decision doc by tomorrow.
Manager: Awesome, tag me in the PR once it's ready.`,
];

export default function AudioUploadWidget({ onTranscriptGenerated }: AudioUploadWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionDone, setTranscriptionDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      simulateTranscription(file.name);
    }
  };

  const simulateTranscription = (name: string) => {
    setIsTranscribing(true);
    setTranscriptionDone(false);

    setTimeout(() => {
      setIsTranscribing(false);
      setTranscriptionDone(true);
      const chosenSample = SAMPLE_TRANSCRIPTS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTS.length)];
      onTranscriptGenerated(chosenSample);
    }, 1800);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setFileName("Live_Voice_Recording.wav");
      simulateTranscription("Live_Voice_Recording.wav");
    } else {
      setIsRecording(true);
      setFileName(null);
      setTranscriptionDone(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl border border-[#F5BEC6] bg-[#FFF4F6] space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
            <FileAudio className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#241830]">Voice &amp; Audio Transcript Processor</p>
            <p className="text-[10px] text-[#665578] font-semibold">Upload an audio recording or capture live speech</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6]">
          AI Whisper Speech-to-Text
        </span>
      </div>

      {/* Waveform Visualizer & Action Dropzone */}
      <div className="p-6 rounded-2xl bg-white border border-[#F5BEC6] flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
        {/* Animated Waveform Lines */}
        <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs my-1">
          {[40, 70, 25, 90, 50, 80, 30, 95, 60, 45, 85, 35, 75, 50, 90, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                isRecording
                  ? "bg-[#E06D83] animate-pulse"
                  : isTranscribing
                  ? "bg-[#8B6FBD] animate-bounce"
                  : fileName
                  ? "bg-[#8B6FBD]"
                  : "bg-[#F5BEC6]"
              }`}
              style={{ height: isRecording ? `${Math.random() * 40 + 10}px` : `${h}%` }}
            />
          ))}
        </div>

        {/* Status text */}
        {isRecording ? (
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#E06D83]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06D83] animate-ping" />
            <span>Recording live audio... Click Stop when finished</span>
          </div>
        ) : isTranscribing ? (
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#8B6FBD]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Transcribing audio into formatted 1:1 conversation...</span>
          </div>
        ) : transcriptionDone ? (
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600">
            <Check className="w-4 h-4" />
            <span>Transcription complete! Text loaded into editor below.</span>
          </div>
        ) : (
          <p className="text-xs text-[#665578] font-semibold max-w-sm">
            Drag &amp; drop an audio file (.mp3, .wav, .m4a) or use live microphone recording
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isTranscribing}
            className="px-4 py-2 text-xs font-extrabold text-[#241830] bg-[#FFF4F6] border border-[#F5BEC6] rounded-xl hover:bg-[#FCE4E8] transition-all flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-[#8B6FBD]" />
            Upload File
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`px-4 py-2 text-xs font-extrabold text-white rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 shadow-md ${
              isRecording ? "bg-[#E06D83] shadow-[#E06D83]/30" : "bg-[#8B6FBD] shadow-[#8B6FBD]/30"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            {isRecording ? "Stop Recording" : "Record Voice"}
          </button>
        </div>
      </div>
    </div>
  );
}
