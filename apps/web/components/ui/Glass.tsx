import type { HTMLAttributes } from "react";

export function Glass({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass ${className}`} {...rest} />;
}
