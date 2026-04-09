import Link from 'next/link';
import { Logo } from './logo';

export function DocsFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs/category/core" className="hover:text-foreground transition-colors">Core & Governance</Link></li>
              <li><Link href="/docs/category/defi" className="hover:text-foreground transition-colors">DeFi for Impact</Link></li>
              <li><Link href="/docs/category/ai" className="hover:text-foreground transition-colors">AI & ML</Link></li>
              <li><Link href="/docs/category/wildlife" className="hover:text-foreground transition-colors">Wildlife & ESG</Link></li>
              <li><Link href="/docs/category/research" className="hover:text-foreground transition-colors">DeSci</Link></li>
            </ul>
          </div>
          {/* Documentation */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Documentation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground transition-colors">All Proposals</Link></li>
              <li><a href="https://github.com/zoo-labs/zips/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Contributing Guide</a></li>
              <li><a href="https://github.com/zoo-labs/zips" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub Repository</a></li>
            </ul>
          </div>
          {/* Ecosystem */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Ecosystem</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://zoo.ngo" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Zoo Labs Foundation</a></li>
              <li><a href="https://docs.zoo.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Zoo Docs</a></li>
              <li><a href="https://lux.network" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Lux Network</a></li>
              <li><a href="https://hanzo.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Hanzo AI</a></li>
            </ul>
          </div>
          {/* Community */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Community</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com/zoo-labs/zips/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discussions</a></li>
              <li><a href="https://github.com/zoo-labs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://x.com/zaboratory" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">X (Twitter)</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Logo size={20} />
            <span>Zoo Labs Foundation</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Building open AI infrastructure for wildlife conservation and decentralized science.
          </p>
        </div>
      </div>
    </footer>
  );
}
