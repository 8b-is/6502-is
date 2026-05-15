import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Add the keyframes
if '@keyframes slideInDownCentered' not in css:
    css = css + '''
@keyframes slideInDownCentered {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
'''

# Replace the .top-dashboard block and everything after it
match = re.search(r'/\* Top Dashboard \*/.*', css, flags=re.DOTALL)
if match:
    new_css = css[:match.start()] + '''/* Top Dashboard */
.top-dashboard {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 0.6rem 1.5rem;
  box-shadow: var(--panel-shadow);
  pointer-events: auto;
  align-items: stretch;
  animation: slideInDownCentered 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  z-index: 20;
}

.dashboard-registers {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  padding-right: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-item {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.4rem;
  font-family: monospace;
  font-size: 1.1rem;
  color: #fff;
  background: transparent;
  padding: 0;
  border: none;
  min-width: auto;
}

.dashboard-item span {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #9999aa;
  text-transform: uppercase;
  margin-bottom: 0;
  letter-spacing: 1px;
}

.dashboard-item.flags {
  letter-spacing: 1px;
  min-width: auto;
  margin-left: 0.5rem;
}

.dashboard-instruction {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 0 0 1.5rem;
  background: transparent;
  border: none;
  gap: 1.5rem;
}

.dashboard-instruction .cycle-count {
  font-size: 0.8rem;
  color: #4a9eff;
  font-weight: 600;
  margin-bottom: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.dashboard-instruction .instruction-text {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: monospace;
  color: #fff;
  margin-bottom: 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  white-space: nowrap;
}

.dashboard-instruction .instruction-explanation {
  font-size: 0.9rem;
  color: #bbbbcc;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
'''
    with open('src/index.css', 'w') as f:
        f.write(new_css)
    print("Replaced successfully")
else:
    print("Could not find Top Dashboard section")
