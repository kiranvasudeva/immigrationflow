import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Worker } from "@shared/schema";

interface WorkerListProps {
  workers: Worker[];
}

export default function WorkerList({ workers }: WorkerListProps) {
  // Mock additional data that would come from assignments
  const getWorkerProgress = (workerId: string) => {
    // Mock progress calculation
    return Math.floor(Math.random() * 100);
  };

  const getWorkerStage = (workerId: string) => {
    const stages = ['AJOFM', 'Work Permit', 'Visa D/AM', 'Residence Permit'];
    return stages[Math.floor(Math.random() * stages.length)];
  };

  const getNextDeadline = (workerId: string) => {
    // Mock deadline
    return {
      date: 'Jan 15, 2024',
      description: 'Work contract due'
    };
  };

  return (
    <Card data-testid="card-workers-list">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>Workers</CardTitle>
          <div className="flex items-center space-x-3">
            <Input 
              placeholder="Search workers..." 
              className="w-64"
              data-testid="input-search-workers"
            />
            <Button data-testid="button-add-worker-list">
              <i className="fas fa-plus mr-2"></i>Add Worker
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Worker</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Nationality</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Current Stage</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Progress</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Next Deadline</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="text-center">
                      <i className="fas fa-users text-gray-400 text-3xl mb-4"></i>
                      <p className="text-secondary">No workers added yet</p>
                      <Button className="mt-4" data-testid="button-add-first-worker">
                        <i className="fas fa-plus mr-2"></i>Add First Worker
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const progress = getWorkerProgress(worker.id);
                  const stage = getWorkerStage(worker.id);
                  const deadline = getNextDeadline(worker.id);
                  const initials = `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
                  
                  return (
                    <tr key={worker.id} className="hover:bg-gray-50" data-testid={`worker-row-${worker.id}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-indigo-600">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{worker.firstName} {worker.lastName}</p>
                            <p className="text-sm text-secondary">{worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline">{worker.nationality}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary">{stage}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-success h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-secondary">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{deadline.date}</p>
                        <p className="text-xs text-warning">{deadline.description}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-worker-${worker.id}`}>
                            <i className="fas fa-eye mr-1"></i>View
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-worker-${worker.id}`}>
                            <i className="fas fa-edit mr-1"></i>Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
