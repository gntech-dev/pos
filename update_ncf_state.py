#!/usr/bin/env python3
import re

# Read the file
with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the ncfData state initialization
old_state = """  const [ncfData, setNcfData] = useState({
    b01Start: '00000001',
    b01End: '00001000',
    b01Current: '00000001',
    b02Start: '00000001',
    b02End: '00001000',
    b02Current: '00000001',
    b14Start: '00000001',
    b14End: '00001000',
    b14Current: '00000001',
    b15Start: '00000001',
    b15End: '00001000',
    b15Current: '00000001'
  })"""

new_state = """  const [ncfData, setNcfData] = useState({
    b01Start: '00000001',
    b01End: '00001000',
    b01Current: '00000001',
    b01ExpiryDate: '',
    b02Start: '00000001',
    b02End: '00001000',
    b02Current: '00000001',
    b02ExpiryDate: '',
    b14Start: '00000001',
    b14End: '00001000',
    b14Current: '00000001',
    b14ExpiryDate: '',
    b15Start: '00000001',
    b15End: '00001000',
    b15Current: '00000001',
    b15ExpiryDate: ''
  })"""

# Replace the state
content = content.replace(old_state, new_state)

# Write the updated content back
with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated ncfData state with expiry date fields")