import { GithubIcon, GlobeIcon, MailIcon } from '../ui/icons';

const Footer: React.FC = () => (
  <footer className="mt-12 border-t border-line">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div>
        <p className="font-semibold text-ink">RepetitionSpotter</p>
        <p className="mt-1">
          Open source, built by Hesbon Osoro. Your text never leaves the
          browser.
        </p>
      </div>
      <nav aria-label="Contact" className="flex flex-wrap gap-x-5 gap-y-2">
        <a
          href="https://hesbon.dev"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-accent"
        >
          <GlobeIcon /> hesbon.dev
        </a>
        <a
          href="mailto:osoro@hesbon.dev"
          className="inline-flex items-center gap-1.5 hover:text-accent"
        >
          <MailIcon /> osoro@hesbon.dev
        </a>
        <a
          href="https://github.com/hesbon-osoro/repetition-spotter"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-accent"
        >
          <GithubIcon /> Source
        </a>
      </nav>
    </div>
  </footer>
);

export default Footer;
