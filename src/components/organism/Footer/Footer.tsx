import Section from "@/components/atomic/Section/Section";
import LinkedInIcon from "@/lib/icons/linkedin";
import GithubLightIcon from "@/lib/icons/GithubLight";
import React from "react";
import LinkBox from "@/components/atomic/LinkBox/LinkBox";
import {
  PLATFORM_GITHUB_LINK,
  PLATFORM_LINKEDIN_LINK,
} from "@/lib/utils/consts";
import { CodeIcon } from "@heroicons/react/solid";
import Link from "next/link";

type FooterProps = {};

export const Footer: React.FC<FooterProps> = (props) => {
  //const { children } = props;

  return (
    <footer className="mt-8">
      <hr className="border-primary-600 opacity-20" />
      <Section className="justify-between gap-8 py-8">
        <div className="flex flex-col justify-between">
          <h1 className="text-3xl font-semibold text-caption-color">
            Berke Karagöz
          </h1>
          <div>
            <LinkBox
              href="https://github.com/BerkeKaragoz/berkekaragoz.com"
              className="w-10 p-1 card-input"
            >
              <CodeIcon />
            </LinkBox>
          </div>
        </div>
        <div>
          <hr className="h-full border-0 border-r border-dashed border-opacity-60 dark:border-opacity-20 border-primary-600 dark:border-primary-400" />
        </div>
        <nav>
          <p className="mb-2 font-semibold">Page</p>
          <ul>
            <li className="mb-2">
              <Link href="/">Home</Link>
            </li>
            <li className="mb-2">
              <Link href="/#projects">Projects</Link>
            </li>
            <li className="mb-2">
              <Link href="/#about-me">About Me</Link>
            </li>
            <li className="mb-2">
              <Link href="/#experience">Experience</Link>
            </li>
          </ul>
        </nav>
        <div>
          <div>
            <p className="mb-2 font-semibold">Platforms</p>
            <ul className="flex gap-4">
              <li>
                <LinkBox
                  className="w-10 p-1 card"
                  href={PLATFORM_LINKEDIN_LINK}
                >
                  <LinkedInIcon />
                </LinkBox>
              </li>
              <li>
                <LinkBox
                  href={PLATFORM_GITHUB_LINK}
                  className="w-10 p-1 bg-gray-800 dark:bg-gray-900 card"
                >
                  <GithubLightIcon />
                </LinkBox>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <p className="mb-1 font-semibold">Contact</p>
            <a href="mailto:mail@berkekaragoz.com">mail@berkekaragoz.com</a>
          </div>
        </div>
      </Section>
      <div className="text-center opacity-60">
        <p className="m-1 text-sm">E. Berke Karagöz © 2021.</p>
      </div>
    </footer>
  );
};

export default Footer;
