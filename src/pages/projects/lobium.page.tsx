import Main from "@/components/atomic/Main/Main";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import { NextPage } from "next";
import React from "react";
import Head from "next/head";

const LobiumPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Lobium | Berke Karagöz</title>
      </Head>
      <Header />
      <Main>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
        <Section className="flex-col py-8">
          <h1 className="text-6xl font-bold text-caption-color">Lobium</h1>
          <hr className="mt-4 mb-8 divider" />
          <p>
            Lobium (Latin for 'lobby') provides tournaments across competitive
            games while improving tournament organization technologies. It
            provides a set of tools for communication, tournament components
            generation, broadcasting, data collection, and aiding tools for
            organizers and/or users. These sets of tools will determine a
            standard for a better user experience to get rid of inconveniences
            caused by inefficient and unpleasant end-user technologies.
            Organizers are able to put the components they want to their own
            website which increases the customizability and branding value. The
            tools made for communication allow efficient and effective
            communication between the tournament organizers and competitors by
            presenting technologies that manage communication platforms that
            utilize protocols such as instant messaging and VoIP. This way
            communication is instant and the competition experience is enhanced.
            Lobium also provides a virtual remote production studio that will
            reduce the entry-level and the costs of broadcasting.
          </p>
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </div>
  );
};

export default LobiumPage;
