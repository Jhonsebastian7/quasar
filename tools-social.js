/* TEMP: enlaza los iconos sociales del menu de usuario a sus redes */
const fs = require('fs');
const REPS = [
  ['<a class="social-btn wa" href="#" aria-label="WhatsApp" title="WhatsApp">',
   '<a class="social-btn wa" href="https://www.whatsapp.com/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">'],
  ['<a class="social-btn ig" href="#" aria-label="Instagram" title="Instagram">',
   '<a class="social-btn ig" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">'],
  ['<a class="social-btn tk" href="#" aria-label="TikTok" title="TikTok">',
   '<a class="social-btn tk" href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok">'],
];
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  let changed = 0;
  for (const [a, b] of REPS) {
    if (s.includes(a)) { s = s.split(a).join(b); changed++; }
  }
  if (changed) { fs.writeFileSync(f, s, 'utf8'); console.log(f, '->', changed, 'iconos enlazados'); }
}
console.log('DONE');
