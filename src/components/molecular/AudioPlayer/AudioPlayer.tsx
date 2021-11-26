import IconButton from "@/components/atomic/IconButton/IconButton";
import Slider from "@/components/atomic/Slider/Slider";
import { COMMON_TNS } from "@/lib/i18n/consts";
import {
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from "@heroicons/react/solid";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";

const volumeMin = 0;
const volumeMax = 1;

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
  src?: React.MediaHTMLAttributes<HTMLAudioElement>["src"];
  audioProps?: Omit<
    React.DetailedHTMLProps<
      React.AudioHTMLAttributes<HTMLAudioElement>,
      HTMLAudioElement
    >,
    "loop" | "muted" | "src"
  >;
  defaultLoop?: boolean;
  defaultMuted?: boolean;
  defaultVolume?: number;
};

//TODO loading
export const AudioPlayer: React.FC<AudioPlayerProps> = (props) => {
  const {
    src,
    defaultLoop = false,
    defaultMuted = false,
    defaultVolume = 0.25,
    audioProps = {
      preload: "metadata",
    },
    ...rest
  } = props;

  const { t: ct } = useTranslation([COMMON_TNS]);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [isLooping, setIsLooping] = React.useState(defaultLoop);
  const [isMuted, setIsMuted] = React.useState(defaultMuted);
  const [bufferedVolume, setBufferedVolume] = React.useState(defaultVolume);
  const [duration, setDuration] = React.useState(0);
  const [rangeTime, setRangeTime] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const volumeRef = React.useRef<HTMLInputElement>(null);
  const volumeSliderRef = React.useRef<HTMLDivElement>(null);
  const progressRef = React.useRef<HTMLInputElement>(null);

  const play = () => {
    //state update is on subscribers
    if (audioRef.current) {
      if (audioRef.current.currentTime >= duration) {
        seek(audioRef, 0);
      }
      return audioRef.current?.play();
    }
  };

  const pause = () => {
    //state update is on subscribers
    audioRef.current?.pause();
  };

  const playHandler = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const rangeChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeVal = e.target.valueAsNumber;
    setRangeTime(rangeVal);
  };

  const volumeChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const vol = e.target.valueAsNumber;
      if (isMuted) {
        setIsMuted(false);
      } else if (vol === 0) {
        setIsMuted(true);
        audioRef.current.volume = bufferedVolume;
      } else {
        audioRef.current.volume = vol;
      }
    }
  };

  const muteHandler = () => {
    setIsMuted((state) => {
      if (volumeRef.current) {
        if (state) {
          if (audioRef.current)
            volumeRef.current.valueAsNumber = audioRef.current.volume;
        } else {
          volumeRef.current.valueAsNumber = 0;
        }
      }
      return !state;
    });
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

  const onTimeUpdateSubscriber = (
    e: React.SyntheticEvent<HTMLAudioElement>,
  ) => {
    if (!isMouseDown) {
      if (progressRef.current) {
        const audioTime = e.currentTarget.currentTime;
        progressRef.current.valueAsNumber = audioTime;
        setRangeTime(audioTime);
      }
    }
  };

  const updateDuration = () => {
    if (audioRef && audioRef.current) {
      if (audioRef.current.readyState > 0) {
        const dur = Math.ceil(audioRef.current.duration);

        setDuration(dur);
      } else {
        setDuration(0);
      }
    }
  };

  React.useEffect(updateDuration, [audioRef?.current?.readyState]);

  React.useEffect(() => {
    if (audioRef.current && volumeRef.current) {
      audioRef.current.volume = volumeRef.current.valueAsNumber;
    }
  }, [audioRef, volumeRef]);

  return (
    <div {...rest}>
      <audio
        {...audioProps} //TODO combine passed funcs
        src={src}
        loop={isLooping}
        muted={isMuted}
        onEnded={onEndedSubscriber}
        onPlay={onPlaySubscriber}
        onPause={onPauseSubscriber}
        onTimeUpdate={onTimeUpdateSubscriber}
        onDurationChange={updateDuration}
        ref={audioRef}
      />
      <IconButton
        onClick={playHandler}
        //disabled={!src}
        disabled
        aria-label={isPlaying ? ct("pause") : ct("play")}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <IconButton
        onClick={() => setIsLooping((s) => !s)}
        aria-label={isLooping ? ct("no repeat") : ct("repeat")}
      >
        <RefreshIcon
          className={clsx([
            { "text-background-400 dark:text-background-500": !isLooping },
            { "text-primary-500 dark:text-primary-400": isLooping },
          ])}
        />
      </IconButton>
      <span>{renderSeconds(rangeTime)}</span>
      <div>
        <Slider
          onChange={rangeChangeHandler}
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUpCapture={() => setIsMouseDown(false)}
          onMouseUp={() => {
            seek(audioRef, progressRef.current?.valueAsNumber);
          }}
          min={0}
          max={duration}
          disabled={!src}
          ref={progressRef}
        />
      </div>
      {false && <span>{renderSeconds(duration)}</span>}
      <span>{`-${renderSeconds(duration - rangeTime)}`}</span>
      <div>
        <IconButton onClick={muteHandler}>
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <div>
          <Slider
            min={volumeMin}
            max={volumeMax}
            step={0.01}
            defaultValue={defaultVolume}
            onChange={volumeChangeHandler}
            onMouseDown={() => {
              if (audioRef.current) setBufferedVolume(audioRef.current.volume);
            }}
            ref={volumeRef}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
