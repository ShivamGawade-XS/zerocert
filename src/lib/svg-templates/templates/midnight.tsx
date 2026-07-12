import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert; eventName: string; orgName: string; logoUrls: string[]; sigImgs: (string | null)[];
}

export function drawMidnightSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
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
        <radialGradient id="midBg" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#160A2E" />
          <stop offset="60%" stopColor="#0D0520" />
          <stop offset="100%" stopColor="#080310" />
        </radialGradient>
        <radialGradient id="violetOrb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0" />
        </radialGradient>
        <filter id="violetGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="960" height="700" fill="url(#midBg)" />

      {/* Ambient violet orb */}
      <ellipse cx="480" cy="300" rx="400" ry="280" fill="url(#violetOrb)" />

      {/* Subtle star dots */}
      {[
        [80,60],[200,90],[720,45],[850,80],[120,150],[900,200],[50,300],[920,350],
        [140,450],[880,500],[200,600],[750,620],[60,650],[900,640]
      ].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="#FFFFFF" opacity={0.3 + (i % 3) * 0.2} />
      ))}

      {/* Ornate border */}
      <rect x="14" y="14" width="932" height="672" fill="none" stroke="#9B5CFF" strokeWidth="1.5" opacity="0.6" filter="url(#softGlow)" />
      <rect x="22" y="22" width="916" height="656" fill="none" stroke="#7B3CDD" strokeWidth="0.5" opacity="0.4" />

      {/* Corner diamonds */}
      {[[40,40],[920,40],[40,660],[920,660]].map(([cx,cy], i) => (
        <polygon key={i} points={`${cx},${cy-8} ${cx+8},${cy} ${cx},${cy+8} ${cx-8},${cy}`} fill="#9B5CFF" opacity="0.7" filter="url(#softGlow)" />
      ))}

      {/* Header */}
      <text x="480" y="72" fill="#9B5CFF" fontSize="11" fontFamily="monospace" textAnchor="middle" letterSpacing="6" fontWeight="bold" filter="url(#violetGlow)">{orgName.toUpperCase()}</text>
      <text x="912" y="72" fill="#6633BB" fontSize="9" fontFamily="monospace" textAnchor="end" letterSpacing="2">◆ MIDNIGHT VERIFIED</text>

      <line x1="40" y1="88" x2="920" y2="88" stroke="#9B5CFF" strokeWidth="0.5" opacity="0.3" />

      {/* Title */}
      <text x="480" y="172" fill="#CC99FF" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="10" opacity="0.8">CERTIFICATE</text>
      <text x="480" y="198" fill="#9B5CFF" fontSize="36" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#violetGlow)">of Excellence</text>

      <line x1="120" y1="218" x2="840" y2="218" stroke="#9B5CFF" strokeWidth="0.8" opacity="0.4" />

      <text x="480" y="256" fill="#AA88DD" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.8">This is to proudly certify that</text>

      {/* Name */}
      <text x="480" y="330" fill="#FFFFFF" fontSize="52" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#violetGlow)">{name}</text>
      <line x1="240" y1="348" x2="720" y2="348" stroke="#9B5CFF" strokeWidth="1.5" filter="url(#softGlow)" />

      <text x="480" y="386" fill="#AA88DD" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle" opacity="0.8">has brilliantly completed</text>
      <text x="480" y="424" fill="#CC99FF" fontSize="24" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(softGlow)">{eventName}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={452 + idx * 16} fill="#886699" fontSize="10" fontFamily="monospace" textAnchor="middle">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${494 + extras.length * 16})`} textAnchor="middle" fill="#664488" fontSize="10" fontFamily="monospace">
        <text y="0">Issued: {issued}</text>
        <text y="14">ID: {certId}</text>
        <text y="28" fontSize="8" fill="#442266">SHA: {hash.slice(0,50)}…</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'cursive';
        return (
          <g key={i} transform="translate(0, 568)">
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-28" width="100" height="28" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="0" fill="#CC99FF" fontSize="22" fontFamily={sigFont} textAnchor="middle" filter="url(#softGlow)">{sig.signatureData}</text>
            ) : null}
            <line x1={bx + 10} y1="10" x2={bx + blockW - 10} y2="10" stroke="#9B5CFF" strokeWidth="0.5" opacity="0.5" />
            <text x={cx} y="26" fill="#AA88DD" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{(sig.name || '').toUpperCase()}</text>
            <text x={cx} y="38" fill="#664488" fontSize="9" fontFamily="Georgia, serif" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      {/* Midnight seal */}
      <g transform="translate(870, 618)" filter="url(#violetGlow)">
        <circle cx="0" cy="0" r="44" fill="#0D0520" stroke="#9B5CFF" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="36" fill="none" stroke="#6633BB" strokeWidth="0.5" strokeDasharray="4 4" />
        <text x="0" y="-8" fill="#9B5CFF" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MIDNIGHT</text>
        <text x="0" y="4" fill="#9B5CFF" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">VERIFIED</text>
        <text x="0" y="16" fill="#552288" fontSize="6" fontFamily="monospace" textAnchor="middle">ZEROCERT</text>
      </g>

      <text x="480" y="688" fill="#331144" fontSize="8" fontFamily="monospace" textAnchor="middle">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={880 - (i + 1) * 65} y="26" width="52" height="50" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
