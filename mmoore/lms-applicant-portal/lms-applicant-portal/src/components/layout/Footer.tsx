export function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm font-medium">© 2026 State Employees' Credit Union</p>
            <p className="text-xs text-white/70">Federally insured by NCUA</p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium hover:text-white/80 transition-colors duration-200 underline-offset-2 hover:underline"
            >
              Equal Housing Opportunity
            </a>
            <span className="text-white/30">|</span>
            <a
              href="#"
              className="text-sm font-medium hover:text-white/80 transition-colors duration-200 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
            <span className="text-white/30">|</span>
            <a
              href="#"
              className="text-sm font-medium hover:text-white/80 transition-colors duration-200 underline-offset-2 hover:underline"
            >
              Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
