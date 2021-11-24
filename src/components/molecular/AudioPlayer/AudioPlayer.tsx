import IconButton from "@/components/atomic/IconButton/IconButton";
import {
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  VolumeUpIcon,
} from "@heroicons/react/solid";
import clsx from "clsx";
import React from "react";

const seek = (ref: React.RefObject<HTMLMediaElement>, seekTime = 0) => {
  if (ref.current)
    if (ref.current.fastSeek) {
      ref.current.fastSeek(seekTime);
    } else {
      ref.current.currentTime = seekTime;
    }
};

const renderSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

type AudioPlayerProps = {
  audioProps?: React.DetailedHTMLProps<
    React.AudioHTMLAttributes<HTMLAudioElement>,
    HTMLAudioElement
  >;
  defaultLoop?: boolean;
};

//TODO debounce, rxjs?
//TODO if needed https://github.com/facebook/react/issues/5867#issuecomment-846341156
const AudioPlayer: React.FC<AudioPlayerProps> = (props) => {
  const {
    audioProps = {
      src: "./assets/sample-music.mp3", //TODO TEMP
      preload: "metadata",
    },
    defaultLoop = false,
    ...rest
  } = props;

  const { loop: unusedLoop } = audioProps;

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [isLooping, setIsLooping] = React.useState(defaultLoop);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const progressRef = React.useRef<HTMLInputElement>(null);
  const animationRef = React.useRef<number>(0);

  const play = () => {
    //state update is on subscribers
    if (currentTime >= duration) seek(audioRef, 0);
    animationRef.current = requestAnimationFrame(updateWhilePlaying);
    return audioRef.current?.play();
  };

  const pause = () => {
    //state update is on subscribers
    audioRef.current?.pause();
    cancelAnimationFrame(animationRef.current);
  };

  const playHandler = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const onPlaySubscriber = () => {
    setIsPlaying(true);
  };

  const onPauseSubscriber = () => {
    setIsPlaying(false);
  };

  const onEndedSubscriber = () => {
    if (!isMouseDown)
      if (audioRef.current && !audioRef.current.loop) {
        seek(audioRef, 0);
      }
  };

  const updateCurrentTimeState = () => {
    if (progressRef)
      if (progressRef.current) {
        const rangeVal = parseInt(progressRef.current.value);

        progressRef.current.style.setProperty(
          "--seek-before-width",
          `${(rangeVal / duration) * 100}%`,
        );
        setCurrentTime(rangeVal);
      }
  };

  const updateWhilePlaying = () => {
    if (audioRef && progressRef)
      if (audioRef.current && progressRef.current) {
        progressRef.current.value = audioRef.current.currentTime.toString();
        updateCurrentTimeState();
        animationRef.current = requestAnimationFrame(updateWhilePlaying);
      }
  };

  const onProgressChange = () => {
    if (audioRef && progressRef)
      if (audioRef.current && progressRef.current) {
        updateCurrentTimeState();
        audioRef.current.currentTime = parseInt(progressRef.current.value);
      }
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (audioRef && audioRef.current && !isNaN(vol)) {
      audioRef.current.volume = vol;
    }
  };

  React.useEffect(() => {
    if (audioRef)
      if (audioRef.current) {
        const dur = Math.ceil(audioRef.current.duration);

        setDuration(dur);
      }
  }, [audioRef?.current?.readyState]);

  return (
    <div {...rest}>
      <audio
        {...audioProps}
        loop={isLooping}
        onEnded={onEndedSubscriber}
        onPlay={onPlaySubscriber}
        onPause={onPauseSubscriber}
        ref={audioRef}
      />
      <IconButton
        onClick={playHandler}
        aria-label={isPlaying ? "pause" : "play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <IconButton
        onClick={() => setIsLooping((s) => !s)}
        aria-label={isLooping ? "no repeat" : "repeat"}
      >
        <RefreshIcon
          className={clsx([
            { "text-primary-300 dark:text-primary-700": !isLooping },
            { "text-primary-600 dark:text-primary-400": isLooping },
          ])}
        />
      </IconButton>
      <span>{renderSeconds(currentTime)}</span>
      <div>
        <input
          type="range"
          ref={progressRef}
          onChange={onProgressChange}
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUpCapture={() => setIsMouseDown(false)}
          min={0}
          max={duration}
        />
      </div>
      {false && (
        <span>{duration && !isNaN(duration) && renderSeconds(duration)}</span>
      )}
      <span>
        {duration &&
          !isNaN(duration) &&
          `-${renderSeconds(duration - currentTime)}`}
      </span>
      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0.25}
          onChange={onVolumeChange}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
