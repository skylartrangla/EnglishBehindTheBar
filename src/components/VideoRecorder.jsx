import { useEffect, useRef, useState } from "react";

export default function VideoRecorder() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const previewRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    },
    [videoUrl],
  );

  async function start() {
    try {
      setError("");
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      previewRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        previewRef.current.srcObject = null;
        stream.getTracks().forEach((track) => track.stop());
        setStatus("ready");
      };
      recorder.start();
      setStatus("recording");
    } catch {
      setError("Camera and microphone access are needed for a video rehearsal.");
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <div className="video-recorder">
      <video
        ref={previewRef}
        src={videoUrl}
        controls={Boolean(videoUrl)}
        autoPlay={status === "recording"}
        muted={status === "recording"}
        playsInline
      />
      <div className="button-row">
        {status !== "recording" ? (
          <button type="button" className="primary-button" onClick={start}>
            ● Record video answer
          </button>
        ) : (
          <button type="button" className="danger-button" onClick={stop}>
            ■ Stop recording
          </button>
        )}
        {videoUrl && (
          <a className="secondary-button" href={videoUrl} download="competition-practice.webm">
            Download recording
          </a>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
