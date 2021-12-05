import React from "react";
import Image from "next/image";
import LinkBox from "@/components/atomic/LinkBox/LinkBox";

const ProjectCard: React.FC<{
  src: string;
  href?: string;
  title: string;
  subtitle: string;
  ratio?: number;
}> = (props) => {
  const { src, href = src, title, subtitle, ratio = 1, ...rest } = props;

  return (
    <LinkBox href={href} className="p-1 rounded-lg hover:ring-2" {...rest}>
      <div className="p-2 card-input image-wrapper">
        <div className="h-40 overflow-hidden rounded-md md:h-full">
          <Image
            src={src}
            width={90 * ratio}
            height={160 * ratio}
            alt={title}
            className="object-cover rounded-md"
          />
        </div>
      </div>
      <div className="mx-auto text-sm w-min">
        <p className="font-semibold text-caption-color">{title}</p>
        <p className="opacity-80">{subtitle}</p>
      </div>
    </LinkBox>
  );
};

const Projects: React.FC<{}> = (props) => {
  const { ...rest } = props;

  return (
    <div className="w-full py-12 text-center">
      <h2 className="text-3xl font-semibold text-caption-color">Projects</h2>
      <div className="flex flex-wrap items-start justify-center gap-3 my-8">
        <ProjectCard
          src="/assets/intergallery.jpg"
          href="https://github.com/BerkeKaragoz/Intergallery-Server"
          title="Intergallery"
          subtitle="A Media Platform (WiP)"
        />
        <ProjectCard
          src="/assets/locale_verifier.png"
          href="https://github.com/BerkeKaragoz/EN-TR-Locale-Verifier/blob/master/locale-verifier.c"
          title="Locale Verifier"
          subtitle="For GNU/Linux systems"
        />
        <ProjectCard
          src="/assets/lobium.jpg"
          href="https://lobium.com"
          title="Lobium"
          subtitle="Tournament Management Bundle"
          ratio={1.5}
        />
        <ProjectCard
          src="/assets/stopwatch.png"
          href="https://github.com/BerkeKaragoz/stopwatch"
          title="Stopwatch"
          subtitle="AFPS Timing Practice Tool"
        />
        <ProjectCard
          src="/assets/vr-training.jpg"
          title="VR Training"
          subtitle="A PoC app for DATAMARKET"
        />
      </div>
      <p className="opacity-80">And more...</p>
    </div>
  );
};

export default Projects;
