import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

export function drawNeonSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
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
        <radialGradient id="neonBg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#0A0A2E" />
          <stop offset="100%" stopColor="#000010" />
        </radialGradient>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cyanGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="960" height="700" fill="url(#neonBg)" />

      {/* Grid lines */}
      {Array.from({length: 20}).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 35} x2="960" y2={i * 35} stroke="#00FFFF08" strokeWidth="0.5" />
      ))}
      {Array.from({length: 28}).map((_, i) => (
        <line key={`v${i}`} x1={i * 35} y1="0" x2={i * 35} y2="700" stroke="#00FFFF08" strokeWidth="0.5" />
      ))}

      {/* Neon border */}
      <rect x="16" y="16" width="928" height="668" fill="none" stroke="#00FFFF" strokeWidth="1.5" opacity="0.8" filter="url(#neonGlow)" />
      <rect x="22" y="22" width="916" height="656" fill="none" stroke="#FF00FF" strokeWidth="0.5" opacity="0.5" />

      {/* Corner marks */}
      {[[32,32],[912,32],[32,652],[912,652]].map(([x,y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x + (i%2===0?20:-20)} y2={y} stroke="#00FFFF" strokeWidth="2" />
          <line x1={x} y1={y} x2={x} y2={y + (i<2?20:-20)} stroke="#00FFFF" strokeWidth="2" />
        </g>
      ))}

      {/* Org name */}
      <text x="48" y="68" fill="#00FFFF" fontSize="11" fontWeight="bold" fontFamily="monospace" letterSpacing="3" filter="url(#neonGlow)">{orgName.toUpperCase()}</text>
      <text x="912" y="68" fill="#FF00FF" fontSize="9" fontFamily="monospace" textAnchor="end" letterSpacing="2">BLOCKCHAIN VERIFIED ◆</text>

      <line x1="48" y1="80" x2="912" y2="80" stroke="#00FFFF" strokeWidth="0.5" opacity="0.4" />

      {/* Certificate label */}
      <text x="480" y="160" fill="#FF00FF" fontSize="11" fontFamily="monospace" textAnchor="middle" letterSpacing="8" opacity="0.9">◆ CERTIFICATE OF COMPLETION ◆</text>

      {/* Recipient */}
      <text x="480" y="230" fill="#CCCCEE" fontSize="15" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.7">This certifies that</text>
      <text x="480" y="310" fill="#FFFFFF" fontSize="52" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#cyanGlow)">{name}</text>
      <line x1="260" y1="326" x2="700" y2="326" stroke="#00FFFF" strokeWidth="1" filter="url(#neonGlow)" />

      <text x="480" y="362" fill="#CCCCEE" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.7">has successfully completed</text>
      <text x="480" y="398" fill="#00FFFF" fontSize="26" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1" filter="url(#neonGlow)">{eventName}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={428 + idx * 16} fill="#8888AA" fontSize="10" fontFamily="monospace" textAnchor="middle">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${480 + extras.length * 16})`} textAnchor="middle" fill="#666688" fontSize="10" fontFamily="monospace">
        <text y="0">Issued: {issued}</text>
        <text y="14">ID: {certId}</text>
        <text y="28" fontSize="8" fill="#444466">SHA: {hash.slice(0,48)}…</text>
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
              <image href={sigImg} x={cx - 50} y="-30" width="100" height="30" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="0" fill="#00FFFF" fontSize="20" fontFamily={sigFont} textAnchor="middle" filter="url(#neonGlow)">{sig.signatureData}</text>
            ) : null}
            <line x1={bx + 10} y1="10" x2={bx + blockW - 10} y2="10" stroke="#00FFFF" strokeWidth="0.5" opacity="0.5" />
            <text x={cx} y="24" fill="#AAAACC" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{(sig.name || '').toUpperCase()}</text>
            <text x={cx} y="36" fill="#666688" fontSize="9" fontFamily="Georgia, serif" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      {/* Hex seal */}
      <g transform="translate(880, 620)">
        <polygon points="0,-36 31,-18 31,18 0,36 -31,18 -31,-18" fill="#000020" stroke="#00FFFF" strokeWidth="1.5" filter="url(#neonGlow)" />
        <text x="0" y="-6" fill="#00FFFF" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CYBER</text>
        <text x="0" y="6" fill="#00FFFF" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CERT</text>
      </g>

      <text x="480" y="690" fill="#334455" fontSize="8" fontFamily="monospace" textAnchor="middle">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={880 - (i + 1) * 60} y="30" width="50" height="40" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
