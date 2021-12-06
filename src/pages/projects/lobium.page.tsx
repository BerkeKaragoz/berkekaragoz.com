import Main from "@/components/atomic/Main/Main";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import { NextPage } from "next";
import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import LinkBox from "@/components/atomic/LinkBox/LinkBox";

const ImageCard: React.FC<{ src: string }> = (props) => {
  const { src } = props;

  return (
    <div>
      <Link href={src} passHref>
        <a target="_blank" className="image-wrapper card">
          <Image src={src} width="340" height="280" objectFit="contain" />
        </a>
      </Link>
    </div>
  );
};

const LobiumPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Lobium | Berke Karagöz</title>
        <meta
          name="description"
          content="Lobium provides tournaments across competitive games while improving tournament organization technologies."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Main>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
        <Section className="flex-col py-8">
          <h1 className="text-5xl font-semibold text-center text-caption-color lg:text-left">
            Lobium
          </h1>
          <hr className="mt-4 mb-8 divider" />
          <div className="flex flex-col items-center justify-around gap-8 p-2 lg:flex-row card-backdrop">
            <article className="p-3 mb-4 card max-w-prose">
              <h2 className="font-semibold text-caption-color">Description</h2>
              <p className="mt-2 indent-sm">
                Lobium (Latin for 'lobby') provides tournaments across
                competitive games while improving tournament organization
                technologies. It provides a set of tools for communication,
                tournament components generation, broadcasting, data collection,
                and aiding tools for organizers and/or users. These sets of
                tools will determine a standard for a better user experience to
                get rid of inconveniences caused by inefficient and unpleasant
                end-user technologies.
              </p>

              <p className="mt-2 indent-sm">
                Organizers are able to put the components they want to their own
                website which increases the customizability and branding value.
                The tools made for communication allow efficient and effective
                communication between the tournament organizers and competitors
                by presenting technologies that manage communication platforms
                that utilize protocols such as instant messaging and VoIP. This
                way communication is instant and the competition experience is
                enhanced. Lobium also provides a virtual remote production
                studio that will reduce the entry-level and the costs of
                broadcasting.
              </p>

              <h2 className="mt-2 font-semibold text-caption-color">
                Technology
              </h2>

              <code className="block indent-sm">
                React, Redux Toolkit, Material-UI, Reacti18next, Express.js,
                mongoDB, mongoose, Discord.js, socket.io, Electron, Mocha...
              </code>

              <p className="mt-2 text-right text-caption-color">
                <em>
                  Design documents are more than <strong>400</strong> pages!
                </em>
              </p>
            </article>
            <div className="w-full max-w-prose ">
              <iframe
                className="w-full card"
                height="480"
                src="https://www.youtube.com/embed/YqEZoW4B0Y8"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-2 mt-8 card-backdrop">
            <div className="flex gap-2">
              <ImageCard src="/assets/projects/LobiumRedactedPoster.jpg" />
              <ImageCard src="/assets/projects/Lobium-System-Award.jpg" />
              <ImageCard src="/assets/projects/Lobium-1.png" />
              <ImageCard src="/assets/projects/Lobium-2.png" />
            </div>
            <div className="flex gap-2">
              <ImageCard src="/assets/projects/Lobium-3.png" />
              <ImageCard src="/assets/projects/Lobium-4.jpg" />
              <ImageCard src="/assets/projects/Lobium-5.jpg" />
              <ImageCard src="/assets/projects/Lobium-6.jpg" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-4 mt-8 card-backdrop">
            <LinkBox href="https://alpha.lobium.com" className="p-2 card link">
              alpha.lobium.com
            </LinkBox>
            <div>
              <span className="text-subtitle-color">Non-Production:</span>
            </div>
            <LinkBox
              href="https://front.netlify.cloudflare.lobium.com/"
              className="p-2 card link"
            >
              front.netlify.cloudflare.lobium.com (Whitelisted registration)
            </LinkBox>
            <LinkBox
              href="https://lobium-organize-backend.herokuapp.com"
              className="p-2 card link"
            >
              lobium-organize-backend.herokuapp.com
            </LinkBox>
          </div>
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </div>
  );
};

export default LobiumPage;
