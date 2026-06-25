import React from "react";

const h = React.createElement;

export function DeckLogo({
  src = "../assets/logo.png",
  alt = "Logo trường",
  position = "default",
} = {}) {
  return h("img", {
    className: `deck-logo${position === "top-left" ? " top-left" : ""}`,
    src,
    alt,
  });
}

export function CoverSlide({
  logoSrc = "../assets/logo.png",
  logoAlt = "Logo trường",
  background = "../assets/vietnam-national-assembly.jpg",
  lesson,
  title,
  school,
  website,
} = {}) {
  const coverStyle = background ? { "--cover-image": `url('${background}')` } : undefined;

  return h(
    React.Fragment,
    null,
    h(DeckLogo, { src: logoSrc, alt: logoAlt, position: "top-left" }),
    h("div", { className: "cover-bg", style: coverStyle }),
    h(
      "div",
      { className: "cover-title" },
      h("span", { className: "lesson-label" }, lesson),
      h("span", { className: "main-title" }, title)
    ),
    h(
      "div",
      { className: "cover-school" },
      h("span", { className: "school-name" }, school),
      h("span", null, website)
    )
  );
}

export function ThanksCard({
  logoSrc = "../assets/logo.png",
  logoAlt = "Logo trường",
  title = "Xin trân trọng cám ơn",
  school,
  address,
  hotline,
  email,
  website,
} = {}) {
  return h(
    React.Fragment,
    null,
    h("img", {
      className: "absolute left-[44px] top-[32px] z-10 h-[84px] w-[84px] object-contain opacity-70",
      src: logoSrc,
      alt: logoAlt,
    }),
    h(
      "div",
      { className: "mx-auto max-w-[1040px] px-10 text-center text-[#fffaf1]" },
      h("h2", { className: "text-[56px] uppercase text-[#fffaf1] drop-shadow-xl" }, title),
      h(
        "div",
        { className: "mt-8 grid gap-2 text-[19px] font-semibold leading-[1.5] text-[#fffaf1]/90" },
        h("div", null, school),
        address ? h("div", null, `Địa chỉ: ${address}`) : null,
        hotline ? h("div", null, `Hotline: ${hotline}`) : null,
        email ? h("div", null, `Email: ${email}`) : null,
        website ? h("div", null, `Website: ${website}`) : null
      )
    )
  );
}

export const slideComponents = {
  CoverSlide,
  DeckLogo,
  ThanksCard,
};
