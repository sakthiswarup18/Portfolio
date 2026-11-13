// A template re-mounts on every navigation, so each page eases in
// instead of snapping into place.
export default function Template({ children }) {
  return <div className="page-in">{children}</div>;
}
