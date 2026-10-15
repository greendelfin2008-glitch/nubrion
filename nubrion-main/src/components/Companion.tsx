"use client";

import dynamic from "next/dynamic";

const OrbScene = dynamic(() => import("./three/OrbScene"), { ssr: false });

/** The particle companion that travels with the reader through the page. */
export default function Companion() {
  return <OrbScene />;
}
