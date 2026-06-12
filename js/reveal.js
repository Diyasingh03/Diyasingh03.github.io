/* scroll reveal: hero elements fire immediately with a stagger,
   everything else reveals on intersection */

export function initReveal() {
  document.querySelectorAll('.hero .reveal, .hero-footnote').forEach((el, i) =>
    setTimeout(() => el.classList.add('visible'), 120 + i * 130)
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
}
