"use client";

import NextTopLoader from "nextjs-toploader";

export const TopLoader = () => {
  return (
    <NextTopLoader
      color="#29d"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #29d,0 0 5px #29d"
    />
  );
};
