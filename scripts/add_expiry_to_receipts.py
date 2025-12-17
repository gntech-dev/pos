#!/usr/bin/env python3
import re

# Update ThermalReceipt.tsx to include NCF expiry date
print("Updating ThermalReceipt.tsx to include NCF expiry date...")

# Read ThermalReceipt.tsx
with open('components/ThermalReceipt.tsx', 'r', encoding='utf-8') as f:
    thermal_content = f.read()

# Add expiry date after NCF display
thermal_ncf_section = r'(\s+{sale\.ncf && \(\s+<p className="text-xs font-mono mt-1 bg-gray-100 px-2 py-1 inline-block">\s+NCF: \{sale\.ncf\}\s+</p>\s+\)}\s*)'

thermal_expiry_addition = r'\1\n          <p className="text-xs text-gray-600 mt-1">\n            Expira: {new Date(sale.ncfExpiryDate || new Date(Date.now() + 365*24*60*60*1000)).toLocaleDateString(\'es-DO\')}\n          </p>'

thermal_content = re.sub(thermal_ncf_section, thermal_expiry_addition, thermal_content, flags=re.DOTALL)

# Write updated ThermalReceipt.tsx
with open('components/ThermalReceipt.tsx', 'w', encoding='utf-8') as f:
    f.write(thermal_content)

print("✅ Updated ThermalReceipt.tsx")

# Update A4Invoice.tsx to include NCF expiry date
print("Updating A4Invoice.tsx to include NCF expiry date...")

# Read A4Invoice.tsx
with open('components/A4Invoice.tsx', 'r', encoding='utf-8') as f:
    a4_content = f.read()

# Add expiry date after NCF display
a4_ncf_section = r'(\s+{sale\.ncf && \(\s+<div className="mt-3 bg-gray-100 px-4 py-2 rounded">\s+<p className="text-xs font-bold">NCF</p>\s+<p className="text-sm font-mono">\{sale\.ncf\}</p>\s+</div>\s+\)}\s*)'

a4_expiry_addition = r'\1\n            <p className="text-xs text-gray-600 mt-2">\n              Expira: {new Date(sale.ncfExpiryDate || new Date(Date.now() + 365*24*60*60*1000)).toLocaleDateString(\'es-DO\')}\n            </p>'

a4_content = re.sub(a4_ncf_section, a4_expiry_addition, a4_content, flags=re.DOTALL)

# Write updated A4Invoice.tsx
with open('components/A4Invoice.tsx', 'w', encoding='utf-8') as f:
    f.write(a4_content)

print("✅ Updated A4Invoice.tsx")

print("✅ Added NCF expiry dates to all receipt and invoice components")