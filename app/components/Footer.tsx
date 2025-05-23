export const Footer = () => (
  <footer className="bg-black text-white text-center py-6 w-full shadow-inner border-t border-slate-800">
    <div className="flex justify-center items-center gap-2">
      <span className="text-sm font-medium">
        © 2025 Helius Indexer. Powered by
      </span>
      <a
        href="https://solana.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-helius-orange font-semibold hover:underline transition-colors duration-300"
      >
        Solana
      </a>
      <span className="text-sm font-medium">&</span>
      <a
        href="https://helius.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-helius-orange font-semibold hover:underline transition-colors duration-300"
      >
        Helius
      </a>
    </div>
  </footer>
);
