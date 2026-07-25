import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 30;

function mediaDuration(file) {
  return new Promise((resolve, reject) => {
    const element = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = element.duration;
      URL.revokeObjectURL(url);
      if (Number.isFinite(duration)) resolve(duration);
      else reject(new Error("duration"));
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("media"));
    };
    element.src = url;
  });
}

export default function ShiftSubmission({ onReady }) {
  const [status, setStatus] = useState("idle");
  const [kind, setKind] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const mediaUrlRef = useRef("");

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearTimers() {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
  }

  function clearMedia() {
    if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    mediaUrlRef.current = "";
    setMediaUrl("");
    onReady(false);
  }

  useEffect(() => {
    return () => {
      clearTimers();
      stopTracks();
      if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    };
  }, []);

  function showMedia(url) {
    if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
    mediaUrlRef.current = url;
    setMediaUrl(url);
  }

  async function startRecording(nextKind) {
    try {
      setError("");
      clearMedia();
      const isVideo = nextKind === "video";
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      streamRef.current = stream;
      setKind(nextKind);
      if (isVideo && previewRef.current) previewRef.current.srcObject = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearTimers();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        showMedia(URL.createObjectURL(blob));
        if (previewRef.current) previewRef.current.srcObject = null;
        stopTracks();
        setStatus("ready");
        onReady(true);
      };
      recorder.start();
      setElapsed(0);
      setStatus("recording");
      intervalRef.current = window.setInterval(
        () => setElapsed((seconds) => Math.min(seconds + 1, MAX_SECONDS)),
        1000,
      );
      timeoutRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_SECONDS * 1000);
    } catch {
      setError("Please allow camera and microphone access, or upload a short file instead.");
      setStatus("idle");
      stopTracks();
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
      setError("Choose a video or audio file.");
      return;
    }

    try {
      const duration = await mediaDuration(file);
      if (duration > MAX_SECONDS + 0.25) {
        setError("This file is longer than 30 seconds. Please trim it and try again.");
        onReady(false);
        return;
      }
      clearMedia();
      setError("");
      setKind(file.type.startsWith("video/") ? "video" : "audio");
      showMedia(URL.createObjectURL(file));
      setStatus("ready");
      setElapsed(Math.ceil(duration));
      onReady(true);
    } catch {
      setError("The file duration could not be checked. Please choose another file.");
      onReady(false);
    }
  }

  return (
    <div className="shift-submission">
      <div className="submission-requirement">
        <span>REQUIRED TO FINISH</span>
        <strong>Show yourself using today’s phrase while serving at the bar.</strong>
        <p>Record or upload one video or audio clip. Maximum length: 30 seconds.</p>
      </div>

      {(kind === "video" || status === "idle") && (
        <video
          ref={previewRef}
          src={kind === "video" ? mediaUrl : ""}
          controls={kind === "video" && Boolean(mediaUrl)}
          autoPlay={status === "recording" && kind === "video"}
          muted={status === "recording"}
          playsInline
          className={kind !== "video" && status !== "recording" ? "is-placeholder" : ""}
        />
      )}
      {kind === "audio" && mediaUrl && <audio src={mediaUrl} controls />}

      {status === "recording" && (
        <div className="recording-countdown" aria-live="polite">
          <span />
          Recording {kind} · {elapsed}s / {MAX_SECONDS}s
        </div>
      )}

      <div className="submission-actions">
        {status !== "recording" ? (
          <>
            <button type="button" className="primary-button" onClick={() => startRecording("video")}>
              ● Record video
            </button>
            <button type="button" className="secondary-button" onClick={() => startRecording("audio")}>
              ● Record audio
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              ↑ Upload video or audio
            </button>
          </>
        ) : (
          <button type="button" className="danger-button" onClick={stopRecording}>
            ■ Stop recording
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*"
          onChange={chooseFile}
          hidden
          data-no-translate
        />
      </div>

      {status === "ready" && (
        <p className="submission-success">✓ Evidence ready. You can now complete the lesson.</p>
      )}
      {error && <p className="form-error">{error}</p>}
      <small>Your clip stays in this browser session and is not published.</small>
    </div>
  );
}
