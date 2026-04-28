import React from 'react';

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Simple Logo */}
            <div style={{
              width: '34px',
              height: '34px',
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              E
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
                EquiTwin
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                Causal Fairness Gymnasium & Verifiable Auditor
              </p>
            </div>
          </div>
          <span style={{
            fontSize: '11px',
            color: '#64748b',
            backgroundColor: '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: 500
          }}>
            v1.0.0
          </span>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        backgroundColor: 'white',
        padding: '16px 24px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
          EquiTwin — Don&apos;t just detect bias. Build immunity.
        </p>
      </footer>
    </div>
  );
}