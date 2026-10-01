// Static content for the simple informational pages linked from the footer.
// Centralising it here keeps InfoPage.jsx a plain, reusable template.
export const STATIC_PAGES = {
  about: {
    title: 'About PaletteAI',
    subtitle: 'Why we built a color tool for developers and designers',
    icon: 'fa-circle-info',
    sections: [
      {
        heading: 'Our mission',
        body: "PaletteAI exists to make picking, checking, and sharing color palettes fast — whether you're prototyping a UI, matching brand colors, or making sure your text passes accessibility checks.",
      },
      {
        heading: "What's under the hood",
        body: 'Every palette you see is either generated locally with harmonic-color math, pulled live from The Color API, or produced by the Colormind AI model — with graceful fallbacks everywhere so the app never breaks, even offline.',
      },
      {
        heading: 'Built as a learning project',
        body: 'This app was built as a Week 6 frontend capstone: React, real API integration, an admin dashboard, search & filtering, responsive design, routing, and global state management, all in one project.',
      },
    ],
  },
  blog: {
    title: 'The PaletteAI Blog',
    subtitle: 'Notes on color, accessibility, and building this app',
    icon: 'fa-newspaper',
    sections: [
      {
        heading: 'Coming soon',
        body: "We're just getting started — check back soon for posts on color theory, WCAG accessibility, and behind-the-scenes notes on how PaletteAI's live API integrations work.",
      },
      {
        heading: 'Have a topic in mind?',
        body: 'Reach out through the contact form on the homepage — we would love to hear what color or accessibility topics you would like us to cover.',
      },
    ],
  },
  careers: {
    title: 'Careers at PaletteAI',
    subtitle: "We're not hiring yet — but we're always happy to hear from people who love color and code",
    icon: 'fa-briefcase',
    sections: [
      {
        heading: 'No open roles right now',
        body: "PaletteAI is a small demo project today, so there aren't any open positions just yet. That said, if you're passionate about design tooling, accessibility, or frontend engineering, we'd still love to hear from you.",
      },
      {
        heading: 'Stay in touch',
        body: 'Send us a note through the contact form on the homepage and we will keep you posted if that changes.',
      },
    ],
  },
  help: {
    title: 'Help Center',
    subtitle: 'Quick answers to common questions',
    icon: 'fa-circle-question',
    sections: [
      {
        heading: 'How do I save a palette?',
        body: 'Generate or find a palette you like on the Explore or Studio Pro pages, then click "Save" — you\'ll be asked to name it before it lands in your Dashboard.',
      },
      {
        heading: 'How do I find a specific color?',
        body: 'Head to Explore and use the "Find Any Color" search — paste any hex code and it will look up its real-world name, RGB, and HSL values live.',
      },
      {
        heading: 'Can I extract colors from a photo?',
        body: 'Yes — on the Explore page, drag and drop (or upload) any image and PaletteAI will pull its dominant colors into a saveable palette, entirely in your browser.',
      },
      {
        heading: 'How do I share a palette?',
        body: 'From your Dashboard, click "Share" on any saved palette to copy a link. Opening that link loads the palette straight into Studio Pro for whoever you send it to.',
      },
      {
        heading: 'Still stuck?',
        body: 'Use the contact form on the homepage and we will get back to you.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'What we do (and don\'t do) with your data',
    icon: 'fa-shield-halved',
    sections: [
      {
        heading: 'Local-first by design',
        body: 'Your saved palettes, theme preference, and history are stored entirely in your browser\'s local storage. Nothing you save is sent to or stored on a PaletteAI server.',
      },
      {
        heading: 'Third-party API calls',
        body: 'When you generate or look up colors, PaletteAI may send a hex code or seed color to The Color API or the Colormind API to fetch results. No personal information is included in these requests.',
      },
      {
        heading: 'Contact form',
        body: 'This is a demo project — messages submitted through the contact form are not actually transmitted or stored anywhere.',
      },
      {
        heading: 'Questions',
        body: 'If you have any questions about this policy, please reach out through the contact form.',
      },
    ],
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'The live services PaletteAI connects to',
    icon: 'fa-plug',
    sections: [
      {
        heading: 'Colormind AI',
        body: 'Powers one-click AI palette generation in Studio Pro, producing genuinely novel color combinations rather than fixed presets. Requests go through a small local proxy to avoid browser CORS restrictions.',
      },
      {
        heading: 'The Color API',
        body: 'Used in three places: naming any color you inspect, powering the universal hex-code search on Explore, and generating live "trending" color schemes for the Explore feed.',
      },
      {
        heading: 'Always has a fallback',
        body: 'Every integration above falls back to locally generated or bundled data if the live call fails, so the app keeps working even without an internet connection.',
      },
    ],
  },
}
