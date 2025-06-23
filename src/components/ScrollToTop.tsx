
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that scrolls to the top of the page when the route path changes
 * This ensures users always start at the top when navigating to a new page
 */
export default function ScrollToTop() {
  const location = useLocation();
  const { pathname, hash } = location;

  useEffect(() => {
    // If there's a hash (anchor), don't scroll to top - let the browser handle the anchor
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    
    // Scroll to top whenever the pathname changes (no hash)
    window.scrollTo({
      top: 0,
      behavior: "smooth" // Use smooth scrolling for better UX
    });
  }, [pathname, hash]); // Track both pathname and hash changes

  return null;
}
