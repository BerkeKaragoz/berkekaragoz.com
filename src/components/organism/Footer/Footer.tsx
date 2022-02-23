import Section from "@/components/atomic/Section/Section";
import LinkedInIcon from "@/lib/icons/LinkedIn";
import GithubLightIcon from "@/lib/icons/GithubLight";
import React from "react";
import LinkBox from "@/components/atomic/LinkBox/LinkBox";
import {
  PLATFORM_GITHUB_LINK,
  PLATFORM_LINKEDIN_LINK,
} from "@/lib/utils/consts";
import { CodeIcon } from "@heroicons/react/solid";
import { Trans, useTranslation, withTranslation } from "react-i18next";
import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import { ComponentPropsWithTranslation } from "@/lib/types/i18n";
import LinkText from "@/components/atomic/LinkText/LinkText";
import Tooltip from "@/components/atomic/Tooltip/Tooltip";

type FooterProps = ComponentPropsWithTranslation<{}>;

export const Footer: React.FC<FooterProps> = (props) => {
  const { t } = props;
  const { t: ct } = useTranslation([COMMON_TNS]);

  return (
    <footer className="mt-8">
      <hr className="border-primary-600 opacity-20" />
      <Section className="flex-col justify-between gap-8 py-8 text-center sm:text-left sm:flex-row">
        <div className="flex flex-col justify-between">
          <h1 className="mb-4 text-3xl font-semibold text-caption-color">
            Berke Karagöz
          </h1>
          <div>
            <LinkBox
              href="https://github.com/BerkeKaragoz/berkekaragoz.com"
              className="w-10 p-1 bg-red-500 card-input"
              aria-label="source"
            >
              <Tooltip
                capitalize
                text={ct("source code")}
                className="top-0 -translate-y-full -mt-2.5"
              >
                <CodeIcon />
              </Tooltip>
            </LinkBox>
          </div>
        </div>
        <nav>
          <p className="mb-2 font-semibold uppercase-first">
            <LinkText href="/" className="unstyled-a">
              <Trans t={t} i18nKey="index.title">
                Home
              </Trans>
            </LinkText>
          </p>
          <ul>
            <li className="mb-2">
              <LinkText href="/#projects">
                <Trans t={t} i18nKey="index.projects.title">
                  Projects
                </Trans>
              </LinkText>
            </li>
            <li className="mb-2">
              <LinkText href="/#about-me">
                <Trans t={t} i18nKey="index.aboutMe.title">
                  About Me
                </Trans>
              </LinkText>
            </li>
            <li className="mb-2">
              <LinkText href="/#experience">
                <Trans t={t} i18nKey="index.experience.title">
                  Experience
                </Trans>
              </LinkText>
            </li>
          </ul>
        </nav>
        <div className="block">
          <p className="mb-2 font-semibold uppercase-first">
            <Trans t={ct} i18nKey="other">
              Other
            </Trans>
          </p>
          <ul>
            <li className="mb-2">
              <LinkText href="/posts">Blog</LinkText>
            </li>
            <li className="mb-2">
              <LinkText href="https://kognitif.berkekaragoz.com">
                Kognitif
              </LinkText>
            </li>
            <li className="mb-2">
              <LinkText href="https://box.berkekaragoz.com">
                Box.berkekaragoz.com
              </LinkText>
            </li>
          </ul>
        </div>
        <div>
          <div>
            <p className="mb-2 font-semibold uppercase-first">
              <Trans t={ct} i18nKey="platforms">
                Platforms
              </Trans>
            </p>
            <ul className="flex justify-center gap-4 sm:justify-start">
              <li>
                <LinkBox
                  className="w-10 p-1 card"
                  href={PLATFORM_LINKEDIN_LINK}
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </LinkBox>
              </li>
              <li>
                <LinkBox
                  href={PLATFORM_GITHUB_LINK}
                  className="w-10 p-1 bg-gray-800 dark:bg-gray-900 card"
                  aria-label="GitHub"
                >
                  <GithubLightIcon />
                </LinkBox>
              </li>
            </ul>
          </div>
          <div className="mt-8">
            <p className="mb-1 font-semibold uppercase-first">
              <Trans t={ct} i18nKey="contact">
                Contact
              </Trans>
            </p>
            <a href="mailto:mail@berkekaragoz.com">mail@berkekaragoz.com</a>
          </div>
        </div>
      </Section>
      <div className="text-center opacity-60">
        <p className="m-1 text-sm">E. Berke Karagöz © 2022.</p>
      </div>
    </footer>
  );
};

export default withTranslation(PAGES_TNS)(Footer);
