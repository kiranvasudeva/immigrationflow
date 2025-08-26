export default function WorkflowKanban() {
  // Mock data for the kanban columns
  const columns = [
    {
      title: "Awaiting Client",
      count: 8,
      color: "orange",
      items: [
        {
          client: "TechCorp SRL",
          worker: "John Smith - Work Contract",
          dueInfo: "Due in 3 days",
          type: "warning"
        },
        {
          client: "Innovation Ltd",
          worker: "Maria Popescu - Bank Statement", 
          dueInfo: "Due in 5 days",
          type: "warning"
        },
        {
          client: "Digital Solutions",
          worker: "Ahmed Hassan - Power of Attorney",
          dueInfo: "Overdue 2 days",
          type: "error"
        }
      ]
    },
    {
      title: "Awaiting Admin",
      count: 12,
      color: "blue",
      items: [
        {
          client: "StartupHub SRL",
          worker: "Ana Ionescu - AJOFM Application",
          dueInfo: "Document received",
          type: "info"
        },
        {
          client: "GlobalTech SA",
          worker: "Carlos Rodriguez - Medical Certificate",
          dueInfo: "Ready to submit",
          type: "success"
        }
      ]
    },
    {
      title: "Submitted",
      count: 15,
      color: "purple",
      items: [
        {
          client: "DevCorp SRL",
          worker: "Liu Wei - IGI Work Permit",
          dueInfo: "Ref: IGI2024001",
          type: "info"
        },
        {
          client: "CloudSystems",
          worker: "Priya Sharma - Visa D Application",
          dueInfo: "Courier: DHL123456",
          type: "info"
        }
      ]
    },
    {
      title: "Approved",
      count: 23,
      color: "green",
      items: [
        {
          client: "InnovateLab",
          worker: "Sebastian Klein - Work Permit",
          dueInfo: "Approved today",
          type: "success"
        },
        {
          client: "TechStart SRL",
          worker: "Elena Vasilev - Residence Permit",
          dueInfo: "Valid until Dec 2025",
          type: "success"
        }
      ]
    },
    {
      title: "Rejected",
      count: 3,
      color: "red",
      items: [
        {
          client: "SmallBiz SRL",
          worker: "Mohammed Al-Rashid - AJOFM Test",
          dueInfo: "Missing documents",
          type: "error"
        }
      ]
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
              {column.count}
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
