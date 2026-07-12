import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert; eventName: string; orgName: string; logoUrls: string[]; sigImgs: (string | null)[];
}

export function drawRetroSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const extras = Object.entries(cert.fields || {}).filter(([k]) => !['Name','Email','Signatories','template','Template'].includes(k));
  let parsedSigs: any[] = [];
  try { parsedSigs = cert.fields?.Signatories ? (Array.isArray(cert.fields.Signatories) ? cert.fields.Signatories : JSON.parse(cert.fields.Signatories)) : []; } catch {}

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="select-none">
      <defs>
        <linearGradient id="retroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A0033" />
          <stop offset="40%" stopColor="#2D0058" />
          <stop offset="80%" stopColor="#1A1A5E" />
          <stop offset="100%" stopColor="#000A1A" />
        </linearGradient>
        <linearGradient id="retroPink" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF88FF" />
          <stop offset="50%" stopColor="#FF44BB" />
          <stop offset="100%" stopColor="#FF88FF" />
        </linearGradient>
        <linearGradient id="retroCyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#44FFEE" />
          <stop offset="50%" stopColor="#88FFCC" />
          <stop offset="100%" stopColor="#44FFEE" />
        </linearGradient>
        <filter id="retroGlow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="960" height="700" fill="url(#retroBg)" />

      {/* Scanlines */}
      {Array.from({length: 70}).map((_, i) => (
        <line key={i} x1="0" y1={i * 10} x2="960" y2={i * 10} stroke="#FFFFFF04" strokeWidth="1" />
      ))}

      {/* Horizon line (retrowave sun effect) */}
      <line x1="0" y1="460" x2="960" y2="460" stroke="#FF88FF" strokeWidth="1" opacity="0.3" />
      {[480,500,520,540,560,580].map((y, i) => (
        <line key={i} x1="0" y1={y} x2="960" y2={y} stroke="#FF88FF" strokeWidth="0.5" opacity={0.2 - i * 0.03} />
      ))}

      {/* Perspective grid lines */}
      {Array.from({length: 11}).map((_, i) => {
        const x = i * 96;
        return <line key={i} x1={x} y1="700" x2="480" y2="460" stroke="#FF88FF" strokeWidth="0.5" opacity="0.15" />;
      })}

      {/* Border */}
      <rect x="14" y="14" width="932" height="672" fill="none" stroke="url(#retroPink)" strokeWidth="2" opacity="0.7" filter="url(#retroGlow)" />
      <rect x="20" y="20" width="920" height="660" fill="none" stroke="url(#retroCyan)" strokeWidth="0.5" opacity="0.4" />

      {/* Header */}
      <text x="480" y="75" fill="url(#retroPink)" fontSize="13" fontFamily="monospace" textAnchor="middle" letterSpacing="8" fontWeight="bold" filter="url(#retroGlow)">
        ✦ {orgName.toUpperCase()} ✦
      </text>

      {/* RETROWAVE badge */}
      <rect x="390" y="90" width="180" height="22" fill="#FF88FF22" stroke="#FF88FF" strokeWidth="0.5" />
      <text x="480" y="106" fill="#FF88FF" fontSize="9" fontFamily="monospace" textAnchor="middle" letterSpacing="4">RETROWAVE CERTIFIED</text>

      {/* Certificate title in retro style */}
      <text x="480" y="190" fill="url(#retroCyan)" fontSize="16" fontFamily="monospace" textAnchor="middle" letterSpacing="10" filter="url(#retroGlow)">CERTIFICATE</text>
      <text x="480" y="215" fill="#FFFFFF" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="6" opacity="0.7">OF COMPLETION</text>

      <line x1="100" y1="230" x2="860" y2="230" stroke="url(#retroPink)" strokeWidth="1" opacity="0.5" />

      <text x="480" y="264" fill="#CCAAFF" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.8">This is to certify that</text>

      {/* Name */}
      <text x="480" y="336" fill="#FFFFFF" fontSize="54" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#retroGlow)">{name}</text>
      <line x1="240" y1="352" x2="720" y2="352" stroke="url(#retroCyan)" strokeWidth="1.5" filter="url(#retroGlow)" />

      <text x="480" y="390" fill="#CCAAFF" fontSize="13" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.8">has successfully completed</text>
      <text x="480" y="426" fill="url(#retroPink)" fontSize="24" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#retroGlow)">{eventName}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={456 + idx * 16} fill="#AAAACC" fontSize="10" fontFamily="monospace" textAnchor="middle">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${500 + extras.length * 16})`} textAnchor="middle" fill="#8877AA" fontSize="10" fontFamily="monospace">
        <text y="0">Issued: {issued}</text>
        <text y="14">ID: {certId}</text>
        <text y="28" fontSize="8" fill="#554466">SHA: {hash.slice(0,50)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'cursive';
        return (
          <g key={i} transform="translate(0, 570)">
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-28" width="100" height="28" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="0" fill="#FF88FF" fontSize="22" fontFamily={sigFont} textAnchor="middle" filter="url(#retroGlow)">{sig.signatureData}</text>
            ) : null}
            <line x1={bx + 10} y1="10" x2={bx + blockW - 10} y2="10" stroke="url(#retroPink)" strokeWidth="0.5" opacity="0.6" />
            <text x={cx} y="26" fill="#CCAAFF" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{(sig.name || '').toUpperCase()}</text>
            <text x={cx} y="38" fill="#887799" fontSize="9" fontFamily="Georgia, serif" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      <text x="480" y="688" fill="#443355" fontSize="8" fontFamily="monospace" textAnchor="middle">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={880 - (i + 1) * 65} y="28" width="52" height="42" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
