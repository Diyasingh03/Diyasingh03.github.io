import React from 'react';
import { projects } from '@/data';
import Image from 'next/image';
import Link from 'next/link';

const Projects = () => {
  return (
    <section id="projects" className="py-20">
      <h2 className="heading mb-10">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 px-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-black-200 backdrop-blur-sm rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-white/[0.1]"
          >
            <div className="relative h-48 mb-6 overflow-hidden rounded-lg">
              <Image
                src={project.img}
                alt={project.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-bold mb-3">{project.title}</h3>
            <p className="text-white-100 mb-4">{project.des}</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {project.iconLists.map((icon, index) => (
                <div key={index} className="relative w-8 h-8">
                  <Image
                    src={icon}
                    alt="technology"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              ))}
            </div>
            <Link
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-purple to-blue-100 hover:opacity-90 px-4 py-2 rounded-full transition-all duration-300"
            >
              View on GitHub
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects; 