import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert; eventName: string; orgName: string; logoUrls: string[]; sigImgs: (string | null)[];
}

export function drawVintageSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
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
        <linearGradient id="vinBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5EDD8" />
          <stop offset="50%" stopColor="#EEE0C0" />
          <stop offset="100%" stopColor="#E8D4A8" />
        </linearGradient>
        <filter id="vinPaper">
          <feTurbulence type="turbulence" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <rect width="960" height="700" fill="url(#vinBg)" />

      {/* Aged paper texture overlay */}
      <rect width="960" height="700" fill="#8B6333" opacity="0.04" />

      {/* Outer ornate border */}
      <rect x="12" y="12" width="936" height="676" fill="none" stroke="#5C3D1E" strokeWidth="3" />
      <rect x="18" y="18" width="924" height="664" fill="none" stroke="#A0714F" strokeWidth="1" />
      <rect x="26" y="26" width="908" height="648" fill="none" stroke="#5C3D1E" strokeWidth="0.5" opacity="0.6" />

      {/* Ornamental corner flourishes */}
      {[[40,40],[920,40],[40,660],[920,660]].map(([cx,cy], i) => {
        const sx = i % 2 === 0 ? 1 : -1;
        const sy = i < 2 ? 1 : -1;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + sx * 40} y2={cy} stroke="#5C3D1E" strokeWidth="1.5" />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 40} stroke="#5C3D1E" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="4" fill="#5C3D1E" opacity="0.6" />
            <circle cx={cx} cy={cy} r="2" fill="#C4933F" />
          </g>
        );
      })}

      {/* Sepia header panel */}
      <rect x="36" y="36" width="888" height="80" fill="#5C3D1E" opacity="0.85" />
      <rect x="36" y="36" width="4" height="80" fill="#C4933F" />

      <text x="60" y="83" fill="#EED8A0" fontSize="15" fontWeight="bold" fontFamily="Georgia, serif" letterSpacing="2">{orgName}</text>
      <text x="900" y="83" fill="#C4933F" fontSize="9" fontFamily="Georgia, serif" textAnchor="end" letterSpacing="1" fontStyle="italic">Est. Blockchain Verified</text>

      {/* Decorative divider flourish */}
      <text x="480" y="142" fill="#A0714F" fontSize="16" textAnchor="middle" fontFamily="Georgia, serif">❧ ─────── ❧</text>

      {/* Certificate heading */}
      <text x="480" y="196" fill="#3D2010" fontSize="52" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="3">Certificate</text>
      <text x="480" y="228" fill="#7A5228" fontSize="20" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="8" fontStyle="italic">of Completion</text>

      <text x="480" y="248" fill="#A0714F" fontSize="12" textAnchor="middle" fontFamily="Georgia, serif">─ ✦ ─</text>

      <text x="480" y="282" fill="#7A5228" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">This is to certify that</text>

      {/* Recipient name */}
      <text x="480" y="356" fill="#2A1A08" fontSize="50" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{name}</text>
      <line x1="220" y1="372" x2="740" y2="372" stroke="#A0714F" strokeWidth="1" />
      <line x1="260" y1="376" x2="700" y2="376" stroke="#C4933F" strokeWidth="0.5" />

      <text x="480" y="410" fill="#7A5228" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">has successfully completed</text>
      <text x="480" y="448" fill="#3D2010" fontSize="24" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{eventName}</text>

      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={476 + idx * 16} fill="#8B6333" fontSize="10" fontFamily="Georgia, serif" textAnchor="middle" fontStyle="italic">{k}: {String(v)}</text>
      ))}

      <g transform={`translate(480, ${514 + extras.length * 16})`} textAnchor="middle" fill="#8B6333" fontSize="10" fontFamily="Georgia, serif" fontStyle="italic">
        <text y="0">Issued on: {issued}</text>
        <text y="16" fontFamily="monospace" fontStyle="normal" fontSize="9">Certificate No: {certId}</text>
        <text y="30" fontFamily="monospace" fontStyle="normal" fontSize="8" fill="#A0714F" opacity="0.7">SHA-256: {hash.slice(0,52)}…</text>
      </g>

      {/* Wax seal effect */}
      <g transform="translate(864, 614)">
        <circle cx="0" cy="0" r="50" fill="#8B1A1A" opacity="0.85" />
        <circle cx="0" cy="0" r="40" fill="none" stroke="#C4933F" strokeWidth="1" opacity="0.6" />
        <text x="0" y="-8" fill="#EED8A0" fontSize="8" fontFamily="Georgia, serif" fontWeight="bold" textAnchor="middle">OFFICIAL</text>
        <text x="0" y="6" fill="#EED8A0" fontSize="8" fontFamily="Georgia, serif" fontWeight="bold" textAnchor="middle">SEAL</text>
        <text x="0" y="20" fill="#C4933F" fontSize="7" fontFamily="monospace" textAnchor="middle">CERTXCHANGE</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];
        const sigFont = sig.signatureFont || 'cursive';
        return (
          <g key={i} transform="translate(0, 562)">
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-28" width="100" height="28" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="2" fill="#3D2010" fontSize="24" fontFamily={sigFont} textAnchor="middle">{sig.signatureData}</text>
            ) : null}
            <line x1={bx + 10} y1="12" x2={bx + blockW - 10} y2="12" stroke="#A0714F" strokeWidth="1" />
            <text x={cx} y="28" fill="#3D2010" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">{sig.name || ''}</text>
            <text x={cx} y="40" fill="#7A5228" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">{sig.designation || sig.title || ''}</text>
          </g>
        );
      })}

      <text x="480" y="685" fill="#A0714F" fontSize="8" fontFamily="monospace" textAnchor="middle" opacity="0.6">Verify at certxchange.vercel.app/verify — {certId}</text>

      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={876 - (i + 1) * 70} y="46" width="60" height="56" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
