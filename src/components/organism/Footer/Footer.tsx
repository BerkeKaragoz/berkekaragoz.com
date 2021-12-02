import IconButton from "@/components/atomic/IconButton/IconButton";
import Section from "@/components/atomic/Section/Section";
import LinkedInIcon from "@/lib/icons/linkedin";
import GithubLightIcon from "@/lib/icons/GithubLight";
import React from "react";
import LinkBox from "@/components/atomic/LinkBox/LinkBox";
import {
  PLATFORM_GITHUB_LINK,
  PLATFORM_LINKEDIN_LINK,
} from "@/lib/utils/consts";

type FooterProps = {};

export const Footer: React.FC<FooterProps> = (props) => {
  //const { children } = props;

  return (
    <footer className="mt-8">
      <hr className="border-primary-600 opacity-20" />
      <Section className="flex-col py-8">
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold text-caption-color">
            Berke Karagöz
          </h1>
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
                    className="w-10 p-1 card"
                  >
                    <GithubLightIcon />
                  </LinkBox>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <p className="mb-1 font-semibold">Reach</p>
              <a href="mailto:mail@berkekaragoz.com">mail@berkekaragoz.com</a>
            </div>
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
