#!/usr/bin/env python3
import re

# Read the monitor page file
with open('app/ncf-monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the status display to show expiry dates
# Add expiry date display to the status summary
expiry_display_addition = '''                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">Expiración:</span>
                  <div className="flex flex-col gap-1">
                    {Object.entries(monitorData.status).map(([type, status]) => (
                      <div key={type} className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded text-white font-bold ${
                          type === 'B01' ? 'bg-green-500' :
                          type === 'B02' ? 'bg-blue-500' :
                          type === 'B14' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {type}
                        </span>
                        <span className={`font-medium ${
                          status.expiryDate ? 
                            new Date(status.expiryDate) < new Date() ? 'text-red-600' :
                            new Date(status.expiryDate) <= new Date(Date.now() + 7*24*60*60*1000) ? 'text-orange-600' :
                            'text-green-600'
                          : 'text-gray-600'
                        }`}>
                          {status.expiryDate ? 
                            new Date(status.expiryDate).toLocaleDateString('es-DO') : 
                            'No definida'
                          }
                        </span>
                        {status.expiryDate && (
                          <span className="text-gray-500 text-xs">
                            ({Math.ceil((new Date(status.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} días)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>'''

# Find the existing summary section and add expiry display
summary_pattern = r'(<div className="bg-white rounded-lg p-6 shadow-lg">\s*<h2 className="text-xl font-bold text-gray-800 mb-4">Monitor NCF</h2>\s*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">)'
summary_replacement = r'\1\n' + expiry_display_addition
content = re.sub(summary_pattern, summary_replacement, content, flags=re.DOTALL)

# Skip the complex card update for now, focus on the main summary display
print("✅ Added expiry date display to NCF monitor interface")

# Write the updated content back
with open('app/ncf-monitor/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Added expiry date display to NCF monitor interface")