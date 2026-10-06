import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 max-w-lg mx-auto">
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 stroke-1" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm"
        >
          {actionText}
        </Link>
      )}
      {onAction && actionText && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-slate-800 transition shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
