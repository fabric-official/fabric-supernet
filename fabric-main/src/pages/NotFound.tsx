import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
export default function NotFound(){
  const location = useLocation();
  useEffect(() => {
    const target = (window.location.hash || window.location.pathname);
    console.error(`404: ${target}`);
  }, [location.pathname]);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Oops — page not found</h1>
      <p className="mb-4">The route you tried doesn&apos;t exist.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700 underline">Return to Home</Link>
    </div>
  );
}
