import React from "react";
import Image from "next/image";

const AboutMe: React.FC<{}> = (props) => {
  const { ...rest } = props;

  return (
    <div className="inline-block mx-auto bg-yellow-500 bg-opacity-40" {...rest}>
      <div className="inline-block">
        <p className="py-32 max-w-prose">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit.
          Exercitationem repellat accusantium sint quam corrupti eum atque et,
          beatae dicta sit, iste, tenetur tempora. Voluptatem quos ut possimus
          vel optio maiores.
        </p>
      </div>
      <div className="p-2 border-2 rounded-full image-wrapper card">
        <Image
          src="/assets/berke_1.jpg"
          width={168}
          height={168}
          alt="E. Berke Karagöz"
          className="object-cover rounded-full"
        />
      </div>
    </div>
  );
};

export default AboutMe;
