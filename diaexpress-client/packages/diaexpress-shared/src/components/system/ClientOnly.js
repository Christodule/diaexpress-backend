import React from 'react';

const defaultPlaceholderStyle = { width: 120, height: 36 };

export default function ClientOnly({ children, placeholderStyle = defaultPlaceholderStyle }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" style={placeholderStyle} />;
  }

  return <>{children}</>;
}
