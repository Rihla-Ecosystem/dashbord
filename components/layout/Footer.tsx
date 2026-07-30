export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Rihla Admin. All rights reserved.</p>
        <p>Built with Next.js &amp; Flowbite</p>
      </div>
    </footer>
  );
}
