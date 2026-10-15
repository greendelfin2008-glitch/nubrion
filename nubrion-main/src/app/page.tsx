import Companion from "@/components/Companion";
import Hero from "@/components/Hero";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import MotionRoot from "@/components/motion/MotionRoot";
import { Cta, Footer, Intro, Services, Steps } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <Companion />
      <main>
        <Hero />
        <MotionRoot>
          <Intro />
          <Services />
          <Steps />
          <Cta />
        </MotionRoot>
      </main>
      <Footer />
    </>
  );
}
