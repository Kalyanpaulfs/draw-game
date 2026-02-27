"use client";

import Link from "next/link";
import { cn } from "@/lib/game-utils";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Users, Search, PenTool, Trophy, ArrowRight } from "lucide-react";
import { PublicLobbies } from "@/components/PublicLobbies";

function GameFlowGallery() {
  const slides = [
    { src: "/image/create.png", title: "Create Room", desc: "Start by creating a custom room with your preferred settings." },
    { src: "/image/lobby.png", title: "Lobby", desc: "Wait for friends to join in the lobby." },
    { src: "/image/level.png", title: "Difficulty", desc: "Choose your challenge: Easy, Medium, or Hard." },
    { src: "/image/word.png", title: "Pick a Word", desc: "Select a word to draw from 3 options." },
    { src: "/image/draw.png", title: "Draw", desc: "Express your creativity on the canvas!" },
    { src: "/image/guess.png", title: "Guess", desc: "Competitors guess in real-time to score points." },
    { src: "/image/end.png", title: "Game Over", desc: "See the winner on the final leaderboard!" }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative rounded-3xl bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden aspect-[9/16] max-w-xs mx-auto group">
      {/* Image Display */}
      <div className="relative w-full h-full bg-slate-950">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              current === index ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* Full Cover Image - No Padding */}
            <div className="relative w-full h-full">
              <Image
                src={slide.src}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority={index === 0}
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Caption Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-6 pb-8 text-center bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
              <h3 className="text-white font-bold text-2xl mb-1">{slide.title}</h3>
              <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-[90%] mx-auto">{slide.desc}</p>

              {/* Indicators */}
              <div className="flex justify-center gap-1.5 mt-4">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === current ? "bg-indigo-500 w-6" : "bg-white/30 w-1.5"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPageContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent_70%)] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150"></div>
      </div>

      {/* Navigation / Header */}
      <header className="relative z-50 w-full px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="relative w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl rotate-3 group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/20">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:from-indigo-400 group-hover:to-purple-400 transition-all duration-300">
            PixxiPop
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
        </nav>
        <div>
          <Link href="/play" className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition-all">
            Play Now
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-0 pb-10 -mt-20 md:mt-0">

          {/* Dynamic Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            {/* Floating Doodles */}
            <PenTool className="absolute top-20 left-[10%] w-12 h-12 text-white/5 rotate-12 animate-float" />
            <Users className="absolute bottom-32 right-[10%] w-16 h-16 text-white/5 -rotate-12 animate-float delay-700" />
            <Trophy className="absolute top-40 right-[20%] w-10 h-10 text-white/5 rotate-6 animate-float delay-1500" />

            {/* Abstract Shapes */}
            <svg className="absolute top-1/3 left-[5%] w-24 h-24 text-white/5 animate-float delay-500" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="40" />
            </svg>
            <svg className="absolute bottom-1/3 right-[5%] w-20 h-20 text-white/5 animate-float delay-2000" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8">
              <rect x="10" y="10" width="80" height="80" rx="20" />
            </svg>
            <svg className="absolute top-[15%] right-[35%] w-8 h-8 text-white/5 animate-float delay-1000" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="10">
              <path d="M10 90 L50 10 L90 90 Z" />
            </svg>
            <svg className="absolute bottom-[20%] left-[30%] w-14 h-14 text-white/5 animate-float delay-3000" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8">
              <path d="M10 50 Q 25 25 50 50 T 90 50" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Live Multiplayer
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
            Draw. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Guess.</span> Laugh.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate online drawing game. No sign-ups, no hassle. Just share a link and start playing with friends instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/play?tab=create"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all group relative overflow-hidden flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span className="relative z-10">Create Room</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
            <Link
              href="/play?tab=join"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5 text-slate-400" />
              Join Room
            </Link>
          </div>

          <PublicLobbies />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 px-6 md:px-12 border-t border-white/5 bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How to Play</h2>
              <p className="text-slate-400">Master the art of doodling in 3 simple steps.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8 text-indigo-400" />,
                  title: "1. Gather Friends",
                  desc: "Create a room and share the link. Up to 8 players can join instantly."
                },
                {
                  icon: <PenTool className="w-8 h-8 text-pink-400" />,
                  title: "2. Sketch & Doodle",
                  desc: "Take turns drawing the secret word while others try to guess it."
                },
                {
                  icon: <Trophy className="w-8 h-8 text-amber-400" />,
                  title: "3. Score Points",
                  desc: "Guess correctly to earn points. The player with the most points wins!"
                }
              ].map((step, i) => (
                <div key={i} className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl hover:bg-slate-800/50 transition-colors group">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 px-6 md:px-12 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Premium Features, <br /> Zero Clutter.</h2>
                <div className="space-y-6">
                  {[
                    "Works instantly on Mobile & Desktop",
                    "No login or signup required",
                    "Real-time stroke sync technology",
                    "Private rooms for your inner circle"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-lg text-slate-300">{feat}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link href="/play?tab=create" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors inline-flex items-center gap-2">
                    Start Drawing Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <GameFlowGallery />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to play?</h2>
          <Link
            href="/play?tab=create"
            className="inline-block px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-bold text-xl hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all"
          >
            Create Your Room
          </Link>

          <div className="mt-16 text-sm flex flex-col items-center gap-2">
            <p className="text-slate-400 flex items-center gap-2">
              Made with <span className="text-red-500 animate-pulse">❤️</span> for friends & family
            </p>
            <p className="text-slate-400">
              Developed by <a href="https://kalyanpaul.vercel.app" target="_blank" rel="noopener noreferrer" className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold hover:opacity-80 transition-opacity">Kalyan Paul</a>
            </p>
            <p className="text-xs text-slate-600 mt-2">&copy; 2026 PixxiPop. All rights reserved.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LandingPageContent />
    </Suspense>
  );
}
