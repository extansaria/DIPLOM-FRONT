import type { SVGProps } from "react";

export type IconOpts = Partial<Pick<SVGProps<SVGSVGElement>, "className">> & {
  size?: number;
  strokeWidth?: number;
  viewBox?: string;
};

function icon(path: string, opts: IconOpts = {}) {
  const { className = "ui-icon", size = 25, strokeWidth = 2, viewBox = "0 0 24 24" } = opts;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

export const SearchIcon = (opts?: IconOpts) => icon("m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14", opts);
export const UserIcon = (opts?: IconOpts) => icon("M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", opts);
export const HomeIcon = (opts?: IconOpts) => icon("m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", opts);
export const LibraryIcon = (opts?: IconOpts) => icon("M4 5h16M4 12h16M4 19h10", opts);
export const BlogIcon = (opts?: IconOpts) => icon("M5 4h10l4 4v12H5zM15 4v4h4", opts);
export const ReviewsIcon = (opts?: IconOpts) => icon("m21 15-5 5-5-5M3 8h18M3 13h9", opts);
export const WorkoutIcon = (opts?: IconOpts) => icon("M6 9v6M18 9v6M3 11h3M18 11h3M9 8h6M9 16h6", opts);
export const SparkIcon = (opts?: IconOpts) => icon("M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z", opts);
export const SendIcon = (opts?: IconOpts) => icon("M22 2 11 13M22 2 15 22l-4-9-9-4z", opts);
export const ResetIcon = (opts?: IconOpts) => icon("M3 12a9 9 0 1 0 3-6.7M3 3v5h5", opts);
export const OpenCardIcon = (opts?: IconOpts) => icon("M14 3h7v7M10 14 21 3M19 13v8H3V5h8", opts);
