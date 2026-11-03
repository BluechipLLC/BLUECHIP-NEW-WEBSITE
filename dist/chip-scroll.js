(() => {
  const logo = document.querySelector('.natty-header > .logo');
  const canvas = logo?.querySelector('.header-chip');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const sprite = new Image();
  let frame = 0, velocity = 0, lastY = scrollY, raf = 0, loaded = false;
  function draw() {
    const index = ((Math.floor(frame) % 75) + 75) % 75;
    ctx.clearRect(0, 0, 180, 180);
    ctx.drawImage(sprite, (index % 10) * 180, Math.floor(index / 10) * 180, 180, 180, 0, 0, 180, 180);
  }
  function animate() {
    frame += velocity;
    velocity *= .88;
    if (Math.abs(velocity) < .005) velocity = 0;
    draw();
    raf = velocity ? requestAnimationFrame(animate) : 0;
  }
  function onScroll() {
    const y = scrollY;
    velocity += (y - lastY) * .008;
    lastY = y;
    logo.classList.toggle('chip-visible', loaded && y > 10);
    if (loaded && velocity && !raf) raf = requestAnimationFrame(animate);
  }
  sprite.onload = () => { loaded = true; draw(); onScroll(); };
  sprite.src = '/assets/chip-frames.webp';
  addEventListener('scroll', onScroll, { passive: true });
})();
