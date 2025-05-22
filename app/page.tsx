import Grid from "@/components/Grid";
import Hero from "@/components/hero";
import Projects from "@/components/Projects";
import { FloatingNav } from "@/components/ui/FloatingNav";
import Image from "next/image";
import { FaHome } from "react-icons/fa";
import { navItems } from "@/data";

export default function Home() {
  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10">
      <div className="max-w-7xl w-full">
        <FloatingNav navItems={navItems} />
        <Hero />
        <Grid />
        <Projects />
      </div>
    </main>
  );
}
