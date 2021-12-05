import { getMonthsBetween } from "@/lib/utils";
import { Tab } from "@headlessui/react";
import clsx from "clsx";
import React from "react";

const ExpTab: React.FC<{}> = (props) => {
  const { children, ...rest } = props;

  return (
    <Tab className={"card-input p-2 flex-grow"} {...rest}>
      {({ selected }) => (
        <h3
          className={clsx([
            "inline-block border-r-4 p-1 mr-2 rounded-sm font-semibold w-full",
            {
              "border-primary-400": selected,
            },
            {
              "border-background-300 dark:border-primary-200 text-primary-800 dark:text-primary-200 text-opacity-60 dark:text-opacity-60":
                !selected,
            },
          ])}
        >
          {children}
        </h3>
      )}
    </Tab>
  );
};

const ExpPanel: React.FC<{
  role: string;
  name: string;
  nameUrl: React.AnchorHTMLAttributes<HTMLAnchorElement>["href"];
  dateStartTime?: React.TimeHTMLAttributes<HTMLElement>["dateTime"];
  startTime: string;
  dateEndTime?: React.TimeHTMLAttributes<HTMLElement>["dateTime"];
  endTime: string;
  jobType: string;
  location: string;
}> = (props) => {
  const {
    children,
    role,
    name,
    nameUrl,
    dateStartTime = "",
    startTime,
    dateEndTime = "",
    endTime,
    jobType,
    location,
    ...rest
  } = props;

  return (
    <Tab.Panel as="p" {...rest}>
      <div className="mb-2">
        <div className="text-xl">
          <strong>{role}</strong>
          {" @ "}
          <a href={nameUrl}>
            <strong>{name}</strong>
          </a>
        </div>
        <div className="text-subtitle-color">
          <time dateTime={dateStartTime}>{startTime}</time>
          {" - "}
          <time dateTime={dateEndTime}>{endTime}</time>
          <br />
          <em>{jobType}</em>
          {" • "}
          <address className="inline-block">{location}</address>
        </div>
      </div>
      <div>{children}</div>
    </Tab.Panel>
  );
};

const Experience: React.FC<{}> = (props) => {
  const { ...rest } = props;
  const currentDate = new Date();

  return (
    <div
      className="flex flex-col justify-center mx-auto my-16 text-center"
      {...rest}
    >
      <h1 className="section-heading">Experience</h1>
      <Tab.Group as="div" className="flex flex-row">
        <Tab.List className="flex flex-col justify-between gap-8 p-2 mr-2 bg-black rounded-lg bg-opacity-5 dark:bg-opacity-20">
          <ExpTab>ESL Gaming</ExpTab>
          <ExpTab>HAVELSAN</ExpTab>
          <ExpTab>DATAMARKET</ExpTab>
        </Tab.List>
        <Tab.Panels className="p-3 text-left card max-w-prose">
          <ExpPanel
            role="Contractor Admin"
            name="ESL Gaming"
            nameUrl="https://www.eslgaming.com/"
            dateStartTime="2021-07-03"
            startTime={"Jul 2021"}
            dateEndTime=""
            endTime={`Present (~${getMonthsBetween(
              new Date("2021-07-03"),
              currentDate,
            )} mos)`}
            jobType="Freelance"
            location="Katowice, PL (Hybrid)"
          >
            {"Tournament referee on projects such as:"}
            <ul className="list-disc ms-8">
              <li>ESL PUBG Masters / Open</li>
              <li>Sony Open Series Apex Legends</li>
              <li>
                Sony Call of Duty: Cold War Battle for Beta / CHOWH1 Challenge
              </li>
            </ul>
            {"And more..."}
          </ExpPanel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Experience;
