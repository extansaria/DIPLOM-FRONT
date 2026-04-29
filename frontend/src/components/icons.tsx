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
export const MachineIcon = (opts?: IconOpts) => icon("M4 19V9m0 10h16M10 9V5h4v4m-9 0h14m-8 10v-4m2 0h2", opts);
export const DumbbellIcon = (opts?: IconOpts) => icon("M3 10v4m2-6v8m14-8v8m2-6v4M5 12h14", opts);
export const CardioIcon = (opts?: IconOpts) => icon("M3 12h4l2-4 3 8 2-4h7", opts);
export const BodyweightIcon = (opts?: IconOpts) => icon("M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 21v-3a6 6 0 0 1 12 0v3", opts);
export const FunctionalIcon = (opts?: IconOpts) => icon("M5 9h14M5 15h14M9 5v14M15 5v14", opts);
export const KettlebellIcon = (opts?: IconOpts) => icon("M9 8a3 3 0 1 1 6 0M7 10h10l1 8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z", opts);
export const BarbellIcon = (opts?: IconOpts) => icon("M2 9v6m3-8v10m14-10v10m3-8v6M5 12h14", opts);
export const StretchIcon = (opts?: IconOpts) => icon("M5 19c2-3 4-4 7-4s5 1 7 4M8 11l4-6 4 6M12 5v10", opts);

export function TelegramIcon(opts: IconOpts = {}) {
  const { className = "ui-icon", size = 20, viewBox = "0 0 24 24" } = opts;
  return (
    <svg className={className} width={size} height={size} viewBox={viewBox} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21.94 4.62a1 1 0 0 0-1.1-.2L2.66 11.6a1 1 0 0 0 .07 1.88l4.39 1.44 1.5 4.78a1 1 0 0 0 1.78.31l2.54-3.46 4.24 3.1a1 1 0 0 0 1.57-.57l3.24-13.24a1 1 0 0 0-.05-1.22Zm-4.93 12.31-3.77-2.75a1 1 0 0 0-1.41.22l-1.65 2.25-.91-2.9 8.77-6.72-10.28 5.84-2.83-.93 13.8-5.53-1.72 8.52Z" />
    </svg>
  );
}

export function GithubIcon(opts: IconOpts = {}) {
  const { className = "ui-icon", size = 20, viewBox = "0 0 24 24" } = opts;
  return (
    <svg className={className} width={size} height={size} viewBox={viewBox} fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.14-1.11-1.44-1.11-1.44-.9-.62.07-.61.07-.61 1 .07 1.52 1.03 1.52 1.03.88 1.52 2.31 1.08 2.88.83.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.42.1 2.68.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.67.92.67 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
