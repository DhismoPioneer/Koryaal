import React from 'react'
import { Building2 } from 'lucide-react'

export default function WorkspaceBuilding({ count = 0 }) {
  return <div className="ws-building-scene" aria-hidden="true"><div className="ws-building-grid" /><div className="ws-building-base" /><div className="ws-building-stack">{[0, 1, 2, 3].map(level => <div key={level} className="ws-building-level" style={{ '--level': level }}><i /><i /><i /><i /></div>)}</div><div className="ws-building-badge"><Building2 size={22} /><div><strong>{count}</strong><span>projects in your workspace</span></div></div></div>
}
