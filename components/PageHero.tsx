interface PageHeroProps {
  title: string;
  image: string;
}

export default function PageHero({ title, image }: PageHeroProps) {
  return (
    <section className="relative h-[55vh] min-h-[380px] flex items-center justify-center overflow-hidden">
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.4)" }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(13,15,20,0.4)" }} />
      <h1 className="relative z-10 text-5xl sm:text-7xl font-black text-white tracking-widest uppercase">
        {title}
      </h1>
    </section>
  );
}
