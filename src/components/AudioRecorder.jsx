import { useEffect, useRef, useState } from "react";

export default function AudioRecorder({ onSaved }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  async function startRecording() {
    try {
      setError("");
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setStatus("ready");
        onSaved?.();
      };
      recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone access is needed to record. You can enable it in your browser settings.");
      setStatus("idle");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <div className="recorder">
      <div className={`recording-indicator ${status === "recording" ? "is-live" : ""}`}>
        <span />
        {status === "recording" ? "Recording your answer…" : "Your voice stays on this device."}
      </div>
      <div className="button-row">
        {status !== "recording" ? (
          <button type="button" className="primary-button" onClick={startRecording}>
            ● Start recording
          </button>
        ) : (
          <button type="button" className="danger-button" onClick={stopRecording}>
            ■ Stop
          </button>
        )}
        {audioUrl && <audio src={audioUrl} controls />}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
