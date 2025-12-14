import { ReactNode } from "react";

interface ComponentCardProps {
  title?: string | ReactNode; // Rendre title optionnel
  children: ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  action?: ReactNode; // Optional action element in the header
  titleClassName?: string; // Optional custom classes for the title
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action,
  titleClassName = "",
}) => {
  // Ne pas afficher le header si title, desc et action sont tous absents
  const hasHeader = title || desc || action;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header - affiché seulement si nécessaire */}
      {hasHeader && (
      <div className="px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {title && (
          <h3 
            className={
              titleClassName 
                ? titleClassName 
                : "text-base font-medium text-gray-800 dark:text-white/90"
            }
          >
            {title}
          </h3>
            )}
          {action && <div className="flex items-center justify-start sm:justify-end">{action}</div>}
        </div>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>
      )}

      {/* Card Body */}
      <div className={hasHeader ? "p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6" : "p-4 sm:p-6"}>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
