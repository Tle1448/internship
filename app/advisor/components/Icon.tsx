const paths = {
    dashboard: "M3 3h18v18H3z M9 3v18 M9 9h12", users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", checklist: "M3 3h18v18H3z M7 8h3 M7 15h3 M13 14l2 2 4-5", search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", calendar: "M8 2v4 M16 2v4 M3 10h18 M3 5h18v17H3z M8 14h2 M14 14h2 M8 18h2", bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4", home: "M3 10l9-7 9 7v11h-7v-7h-4v7H3z", cap: "M2 8l10-5 10 5-10 5z M6 10v7l6 3 6-3v-7 M22 8v8", plus: "M12 8v8 M8 12h8 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", file: "M7 2h14v17H7z M3 6v16h14 M10 7h8 M10 11h8 M10 15h5", warning: "M12 3L1 21h22z M12 9v5 M12 17v.1", check: "M8 12l3 3 5-6 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", clock: "M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0", reset: "M3 10a9 9 0 1 1 1 8 M3 3v7h7", pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0", close: "M6 6l12 12 M6 18L18 6", chevron: "M9 5l7 7-7 7", menu: "M3 6h18 M3 12h18"
};
export default function Icon({ name, size = 20 }: {
    name: keyof typeof paths;
    size?: number;
}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>; }
