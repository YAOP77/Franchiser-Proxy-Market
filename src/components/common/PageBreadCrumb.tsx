import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
  titleClassName?: string; // Optional custom classes for the title
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items, titleClassName }) => {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...(items ?? []),
    { label: pageTitle },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 className={`text-2xl font-semibold ${titleClassName || "text-gray-800 dark:text-white/90"}`}>{pageTitle}</h2>
      <nav>
        <ol className="flex items-center gap-1.5 flex-wrap">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 text-sm">
                {item.href && !isLast ? (
                  <Link
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    to={item.href}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`text-gray-800 dark:text-white/90 ${isLast ? "font-medium" : ""}`}>
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <svg
                    className="stroke-current text-gray-400"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
