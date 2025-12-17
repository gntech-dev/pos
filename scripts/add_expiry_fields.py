#!/usr/bin/env python3
import re

# Read the file
with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# B01 expiry field insertion after the numbers grid
b01_expiry_field = '''
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-green-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b01ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b01ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>'''

# Find the B01 grid and insert after it
b01_pattern = r'(<div className="grid grid-cols-2 gap-3">.*?</div>\s*</div>\s*<div className="bg-white rounded-lg p-3 border border-green-300">)'
b01_replacement = r'\1' + b01_expiry_field
content = re.sub(b01_pattern, b01_replacement, content, flags=re.DOTALL)

# B02 expiry field insertion
b02_expiry_field = '''
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-blue-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b02ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b02ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>'''

b02_pattern = r'(<div className="grid grid-cols-2 gap-3">.*?</div>\s*</div>\s*<div className="bg-white rounded-lg p-3 border border-blue-300">)'
b02_replacement = r'\1' + b02_expiry_field
content = re.sub(b02_pattern, b02_replacement, content, flags=re.DOTALL)

# B14 expiry field insertion
b14_expiry_field = '''
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-yellow-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b14ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b14ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>'''

b14_pattern = r'(<div className="grid grid-cols-2 gap-3">.*?</div>\s*</div>\s*<div className="bg-white rounded-lg p-3 border border-yellow-300">)'
b14_replacement = r'\1' + b14_expiry_field
content = re.sub(b14_pattern, b14_replacement, content, flags=re.DOTALL)

# B15 expiry field insertion
b15_expiry_field = '''
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-xs font-bold text-red-700 mb-1">Fecha de Expiración *</label>
                          <input
                            type="date"
                            value={ncfData.b15ExpiryDate}
                            onChange={(e) => setNcfData({ ...ncfData, b15ExpiryDate: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>'''

b15_pattern = r'(<div className="grid grid-cols-2 gap-3">.*?</div>\s*</div>\s*<div className="bg-white rounded-lg p-3 border border-red-300">)'
b15_replacement = r'\1' + b15_expiry_field
content = re.sub(b15_pattern, b15_replacement, content, flags=re.DOTALL)

# Update the status display to show expiry date (skipping this complex part for now)
# We'll focus on adding the expiry date fields first

print("✅ Added expiry date fields to NCF configuration interface")

# Write the updated content back
with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Added expiry date fields to NCF configuration interface")