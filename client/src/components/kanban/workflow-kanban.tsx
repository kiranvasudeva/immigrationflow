interface Assignment {
  id: string;
  status: string;
  requirement: {
    title: string;
  };
  clientProfile: {
    companyName: string;
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
    'AWAITING_UPLOAD': { title: "Awaiting Client", color: "orange", type: "warning" },
    'SUBMITTED_BY_USER': { title: "Awaiting Admin", color: "blue", type: "info" },
    'RECEIVED_BY_ADMIN': { title: "Awaiting Admin", color: "blue", type: "success" },
    'SUBMITTED_TO_INSTITUTION_DIGITAL': { title: "Submitted", color: "purple", type: "info" },
    'SUBMITTED_TO_INSTITUTION_COURIER': { title: "Submitted", color: "purple", type: "info" },
    'ACCEPTED': { title: "Approved", color: "green", type: "success" },
    'REJECTED': { title: "Rejected", color: "red", type: "error" }
  };

  // Create columns with real data
  const columns = [
    {
      title: "Awaiting Client",
      color: "orange",
      items: [...(groupedAssignments['AWAITING_UPLOAD'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.companyName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Awaiting upload",
        type: "warning"
      }))
    },
    {
      title: "Awaiting Admin",
      color: "blue", 
      items: [
        ...(groupedAssignments['SUBMITTED_BY_USER'] || []),
        ...(groupedAssignments['RECEIVED_BY_ADMIN'] || [])
      ].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.companyName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: assignment.status === 'RECEIVED_BY_ADMIN' ? "Ready to submit" : "Document received",
        type: assignment.status === 'RECEIVED_BY_ADMIN' ? "success" : "info"
      }))
    },
    {
      title: "Submitted",
      color: "purple",
      items: [
        ...(groupedAssignments['SUBMITTED_TO_INSTITUTION_DIGITAL'] || []),
        ...(groupedAssignments['SUBMITTED_TO_INSTITUTION_COURIER'] || [])
      ].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.companyName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Submitted to institution",
        type: "info"
      }))
    },
    {
      title: "Approved", 
      color: "green",
      items: [...(groupedAssignments['ACCEPTED'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.companyName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Approved",
        type: "success"
      }))
    },
    {
      title: "Rejected",
      color: "red",
      items: [...(groupedAssignments['REJECTED'] || [])].map(assignment => ({
        id: assignment.id,
        client: assignment.clientProfile.companyName,
        worker: `${assignment.worker?.firstName || 'N/A'} ${assignment.worker?.lastName || ''} - ${assignment.requirement.title}`,
        dueInfo: "Rejected",
        type: "error"
      }))
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
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
