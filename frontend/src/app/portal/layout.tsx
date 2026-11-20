// The login and sign-up page keeps its own look (gradient background, brown
// text) inside this wrapper, so those styles don't spread to the rest of the app.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-page">{children}</div>;
}
