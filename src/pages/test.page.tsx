import Main from "@/components/atomic/Main/Main";
import Section from "@/components/atomic/Section/Section";
import DrawableCanvas from "@/components/organism/DrawableCanvas/DrawableCanvas";
import Header from "@/components/organism/Header/Header";
import { NextPage } from "next";
import React from "react";

const TestPage: NextPage = () => {
  return (
    <div>
      <Header />
      <Main>
        <Section>
          <DrawableCanvas
            className="bg-white rounded-lg"
            style={{ cursor: "crosshair" }}
          />
        </Section>
      </Main>
    </div>
  );
};

export default TestPage;
