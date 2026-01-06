---

## Mobile Viewport Height

### The Problem

Mobile browsers (Chrome, Safari) have dynamic address bars that change the viewport height as you scroll. Using `100vh` or `min-h-screen` doesn't account for this, causing content to be pushed below the visible viewport.

### The Solution

Use `dvh` (dynamic viewport height) units which automatically adjust for the mobile browser's UI elements.

\`\`\`css
/* WRONG - content may be hidden behind address bar */
.container {
  min-height: 100vh;
}

/* CORRECT - adjusts for mobile browser UI */
.container {
  min-height: 100dvh;
}

/* WITH FALLBACK - for older browser support */
.container {
  min-height: 100vh;  /* Fallback */
  min-height: 100dvh; /* Modern browsers */
}
\`\`\`

### Tailwind Usage

\`\`\`jsx
// WRONG
<div className="min-h-screen">

// CORRECT
<div className="min-h-[100dvh]">

// Or use the utility class from globals.css
<div className="min-h-dvh">
\`\`\`

### Important Notes

1. **Always test on real mobile devices** - The v0 preview may not show mobile viewport issues
2. **Published deployments behave differently** - Test your deployed site on mobile Chrome/Safari
3. **Use dvh for any full-height layouts** - Especially for fixed overlays and editor-style UIs
