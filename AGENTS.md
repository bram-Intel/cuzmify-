# Cuzmify — Workspace Rules & Directives

## Master Design System (Bram Intel Light Architecture)
- **Theme**: Always default to Bram Intel Light Mode (`className="light"` on `<html>`). Background: `#FFFFFF` / `#f9f9f8`. Primary Teal: `#0D5771`, Accent: `#3498E3`, Charcoal text: `#1A202C`.
- **Icon Directives**: NEVER use generic 4-point sparkle AI glitter icons (`Sparkles`). Use geometric brand marks (`Box`, `Zap`, `Sliders`, `Workflow`, `Globe`).
- **Initial Content Density & Viewport Framing**: On page load, the user MUST immediately see a meaningful, high-impact slice of content (Header + Title/Subtitle + Filter/Action bar + top preview cards) above the fold. Avoid empty white space or single giant headings pushing content off-screen.
- **Static Headings & Card Scroll Containers**: Keep step titles/subtitles statically pinned at the top. Wrap card lists inside `max-h-[320px] overflow-y-auto custom-scrollbar`.
- **Eccentric Custom Scrollbar**: Use `.custom-scrollbar` (3px width, `#0D5771` to `#3498E3` gradient thumb with cyan hover glow).
- **Minimizable Hover Footer**: Centered bottom status capsule that expands on hover into a spacious 4-column glass drawer.
- **Tone & Copy**: Plain English, clear, confident, outcome-first (*"Turn Your Business Into a Live Website—in One Sitting"*). Avoid technical buzzwords in top-level marketing.
