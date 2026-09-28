import { createCn } from 'cn/config'

// Teach the merger our custom theme keys from the @theme block in src/styles/app.css.
// Without this, `text-beamer-label text-host-muted` is read as two text colours and the
// size is dropped. Keep these lists in sync when adding a --text-*, --radius-*, … token.
export const cn = createCn({
  extend: {
    theme: {
      text: [
        'lead', 'h4', 'h3', 'h2', 'h1', 'card-title', 'display',
        'beamer-hero', 'beamer-count', 'beamer-display', 'beamer-title', 'beamer-question',
        'beamer-h2', 'beamer-h3', 'beamer-option', 'beamer-option-long', 'beamer-body', 'beamer-label',
        'phone-title', 'phone-hero', 'phone-question', 'phone-option', 'phone-option-long',
      ],
      radius: ['pill'],
      shadow: ['card', 'pop', 'float', 'card-dark'],
      tracking: ['label', 'display', 'heading', 'hero'],
      leading: ['body', 'heading'],
      ease: ['cut', 'out-expo', 'back-out'],
    },
  },
})
