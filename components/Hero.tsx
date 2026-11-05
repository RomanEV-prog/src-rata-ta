import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video ozadje */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.4)" }}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={`${BP}/hero-bg.mp4`} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "rgba(13,15,20,0.45)" }} />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1
          className="text-6xl sm:text-8xl font-black tracking-tight text-white mb-4 uppercase"
          style={{ letterSpacing: "-0.02em" }}
        >
          ŠRC RA-TA-TA
        </h1>
        <p className="text-lg sm:text-xl text-white/80 mb-10 font-medium">
          Več kot samo strelišče!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/paketi"
            className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
            style={{ background: "#7a8cc9" }}
          >
            Paketi
          </Link>
          <Link
            href="/teambuilding"
            className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition-all hover:brightness-110"
            style={{ background: "#3dba8a" }}
          >
            Teambuildingi
          </Link>
        </div>
      </div>
    </section>
  );
}
