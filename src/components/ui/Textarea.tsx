import React, { useRef, useEffect, useCallback } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "compact";
  persistKey?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  className = "",
  variant = "default",
  persistKey,
  ...props
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!persistKey || !ref.current) return;

    const key = `textarea-height-${persistKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      ref.current.style.height = saved;
    }

    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const height = entries[0]?.target?.clientHeight;
        if (height) {
          localStorage.setItem(key, `${height}px`);
        }
      }, 300);
    });

    observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [persistKey]);

  const baseClasses =
    "px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded-md text-start transition-[background-color,border-color] duration-150 hover:bg-logo-primary/10 hover:border-logo-primary focus:outline-none focus:bg-logo-primary/10 focus:border-logo-primary resize-y";

  const variantClasses = {
    default: "px-3 py-2 min-h-[100px]",
    compact: "px-2 py-1 min-h-[80px]",
  };

  return (
    <textarea
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};
