import React from "react";
import Image from "next/image";
import { HeartIcon } from "@heroicons/react/solid";

const assetNames = ["berke_1.jpg", "berke_2.jpg"];
const assetBlurs = [
  "data:image/jpeg;base64,/9j/4AAinitialOneIsNotNeededlwT//Z",
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAAgACAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EAB8QAAEDBAMBAAAAAAAAAAAAAAEAAgMEBRESBzFBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAED/8QAGREAAgMBAAAAAAAAAAAAAAAAAREAAgNR/9oADAMBAAIRAxEAPwCrqbJBS8r3S6SzSMqY9LgapoyRAG6vjOPC1uoGD97RETnUWDMpoUlwT//Z",
];

const AboutMe: React.FC<{}> = (props) => {
  const { ...rest } = props;
  const [assetIndex, setAssetIndex] = React.useState(0);

  return (
    <div className="mx-auto my-24" {...rest}>
      <h2 className="section-heading">About Me</h2>
      <div className="flex flex-col items-center lg:flex-row-reverse">
        <button
          className="flex-grow-0 flex-shrink-0 p-2 rounded-full image-wrapper card-input dark:bg-background-900"
          onClick={() => setAssetIndex((s) => (s + 1) % assetNames.length)}
        >
          <Image
            src={`/assets/${assetNames[assetIndex]}`}
            width={168}
            height={168}
            alt="E. Berke Karagöz"
            className="object-cover rounded-full"
            placeholder={assetIndex > 0 ? "blur" : "empty"}
            blurDataURL={assetBlurs[assetIndex]}
          />
        </button>
        <article className="p-4 mt-8 xs:text-justify lg:mt-0 lg:mr-8 max-w-prose card dark:bg-background-900">
          <p className="indent-xs">
            Hi, my name is Berke. I was born in Istanbul. My interest in
            computer technology has been there since I was a kid. That led me to
            discover designing opportunities. Starting from gaming forums to
            designing graphics for various reasons. I have started to learn
            about software development just before I matriculated to Bilkent
            University{" "}
            <HeartIcon className="inline-block h-5 text-red-600 align-text-top" />
            .
          </p>
          <p className="mt-2 indent-xs">
            Since then, I have been learning about multiple fields of software
            development. Focusing on front-end development abled me to utilize
            my graphic design skills with programming.
          </p>
          <p className="mt-2 indent-xs">
            As for the hobbies, competitive gaming is one of my biggest one. I
            play the chess of FPS, Quake, actively. In addition to this, I had
            been playing Counter-Strike and more others. After, I have been
            working as a tournament manager.
          </p>
        </article>
      </div>
    </div>
  );
};

export default AboutMe;
