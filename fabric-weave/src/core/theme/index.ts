export interface ThemeAPI {
  isDark: boolean;
  toggle: () => void;
}

export function useTheme(): ThemeAPI {
  const [isDark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("dark")
  );
  
  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };
  
  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  
  return { isDark, toggle };
}

import * as React from "react";