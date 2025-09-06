interface Assignment {
  id: string;
  status: string;
  requirement: {
    title: string;
  };
  clientProfile: {
    legalName: string;
  };
  worker?: {
    firstName: string;
    lastName: string;
  };
  stage: {
    title: string;
  };
  updatedAt: string;
}

interface WorkflowKanbanProps {
  assignments?: Assignment[];
}

export default function WorkflowKanban({ assignments = [] }: WorkflowKanbanProps) {
  // Group assignments by status
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.status]) {
      acc[assignment.status] = [];
    }
    acc[assignment.status].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  // Map status to column configuration
  const statusConfig = {
    'PENDING': { title: "Pending", color: "gray", type: "warning" },
    'IN_PROGRESS': { title: "In Progress", color: "blue", type: "info" },
    'COMPLETED': { title: "Completed", color: "green", type: "success" },
    'REJECTED': { title: "Rejected", color: "red", type: "error" },
    'SKIPPED': { title: "Skipped", color: "yellow", type: "warning" },
    // Legacy statuses for backwards compatibility during migration
    'AWAITING_UPLOAD': { title: "Pending Upload", color: "orange", type: "warning" },
    'SUBMITTED_BY_USER': { title: "Needs Review", color: "blue", type: "info" },
    'RECEIVED_BY_ADMIN': { title: "Under Review", color: "blue", type: "success" },
    'SUBMITTED_TO_INSTITUTION_DIGITAL': { title: "Submitted", color: "purple", type: "info" },
    'SUBMITTED_TO_INSTITUTION_COURIER': { title: "Submitted", color: "purple", type: "info" },
    'ACCEPTED': { title: "Approved", color: "green", type: "success" }
  };

  // Create columns with standardized database statuses
  const columns = [
    {
      title: "Pending",
      color: "gray",
      items: [...(groupedAssignments['PENDING'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.legalName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Awaiting action",
        type: "warning"
      }))
    },
    {
      title: "In Progress",
      color: "blue", 
      items: [...(groupedAssignments['IN_PROGRESS'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.legalName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Currently processing",
        type: "info"
      }))
    },
    {
      title: "Completed",
      color: "green",
      items: [...(groupedAssignments['COMPLETED'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.legalName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Completed",
        type: "success"
      }))
    },
    {
      title: "Rejected",
      color: "red",
      items: [...(groupedAssignments['REJECTED'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.legalName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Rejected",
        type: "error"
      }))
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200"
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getItemClasses = (color: string) => {
    const colorMap = {
      gray: "bg-gray-50 border-gray-200",
      orange: "bg-orange-50 border-orange-200",
      blue: "bg-blue-50 border-blue-200", 
      purple: "bg-purple-50 border-purple-200",
      green: "bg-green-50 border-green-200",
      red: "bg-red-50 border-red-200"
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-50 border-gray-200";
  };

  const getTextClasses = (type: string) => {
    const typeMap = {
      warning: "text-warning",
      error: "text-error",
      info: "text-primary",
      success: "text-success"
    };
    return typeMap[type as keyof typeof typeMap] || "text-secondary";
  };

  const getIcon = (type: string) => {
    const iconMap = {
      warning: "fas fa-clock",
      error: "fas fa-exclamation",
      info: "fas fa-upload",
      success: "fas fa-check"
    };
    return iconMap[type as keyof typeof iconMap] || "fas fa-info";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-3" data-testid={`kanban-column-${columnIndex}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{column.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClasses(column.color)}`}>
              {column.items.length}
            </span>
          </div>
          <div className="space-y-3">
            {column.items.map((item, itemIndex) => (
              <div 
                key={itemIndex}
                className={`border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow ${getItemClasses(column.color)}`}
                data-testid={`kanban-item-${columnIndex}-${itemIndex}`}
              >
                <p className="font-medium text-sm text-gray-900">{item.client}</p>
                <p className="text-xs text-secondary mt-1">{item.worker}</p>
                <p className={`text-xs mt-2 ${getTextClasses(item.type)}`}>
                  <i className={`${getIcon(item.type)} mr-1`}></i>
                  {item.dueInfo}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
