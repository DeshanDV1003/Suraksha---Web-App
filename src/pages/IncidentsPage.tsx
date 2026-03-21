const incidents = [
  { id: '1', type: 'Flash Flood', location: 'Colombo 7', severity: 'High', status: 'In Progress', reportedAt: '10:45 AM' },
  { id: '2', type: 'Landslide', location: 'Kandy Road', severity: 'Critical', status: 'Pending', reportedAt: '11:12 AM' },
  { id: '3', type: 'Building Collapse', location: 'Galle Face', severity: 'Critical', status: 'In Progress', reportedAt: '11:30 AM' },
  { id: '4', type: 'Fire', location: 'Pettah', severity: 'Medium', status: 'Resolved', reportedAt: '09:15 AM' },
  { id: '5', type: 'Medical Emergency', location: 'Mount Lavinia', severity: 'Low', status: 'Pending', reportedAt: '11:55 AM' },
]

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground">Manage and assign responders to active disaster reports.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Create Incident
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-accent/30">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reported</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-6 py-4 font-medium">{incident.type}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{incident.location}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      incident.severity === 'Critical' ? 'bg-destructive/10 text-destructive' :
                      incident.severity === 'High' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-green-500/10 text-green-600'
                    }`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{incident.status}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{incident.reportedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-sm font-medium">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
