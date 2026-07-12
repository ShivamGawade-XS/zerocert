import { Cert } from '@/types';

interface SVGTemplateProps {
  cert: Cert;
  eventName: string;
  orgName: string;
  logoUrls: string[];
  sigImgs: (string | null)[];
}

export function drawDarkSVG({ cert, eventName, orgName, logoUrls, sigImgs }: SVGTemplateProps) {
  const name = cert.fields?.Name || 'Participant';
  const certId = cert.cert_id || 'ZC-XXXXXX';
  const hash = cert.sha256_hash || '0'.repeat(64);
  const issued = new Date(cert.issued_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const extras = Object.entries(cert.fields || {}).filter(
    ([k]) => k !== 'Name' && k !== 'Email' && k !== 'Signatories' && k !== 'template' && k !== 'Template'
  );

  let parsedSigs: any[] = [];
  if (cert.fields?.Signatories) {
    try {
      parsedSigs = Array.isArray(cert.fields.Signatories)
        ? cert.fields.Signatories
        : JSON.parse(cert.fields.Signatories);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 960 700" xmlns="http://www.w3.org/2000/svg" className="font-mono select-none">
      <defs>
        <radialGradient id="darkBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#14143A" />
          <stop offset="100%" stopColor="#060612" />
        </radialGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Gradient Background */}
      <rect width="960" height="700" fill="url(#darkBg)" />

      {/* Neon Top Bar */}
      <rect x="0" y="0" width="960" height="4" fill="#E8FF00" />

      {/* Framing Accents */}
      <rect x="0" y="0" width="40" height="40" fill="none" stroke="#E8FF0022" strokeWidth="1" />
      <rect x="920" y="0" width="40" height="40" fill="none" stroke="#E8FF0022" strokeWidth="1" />
      <rect x="0" y="660" width="40" height="40" fill="none" stroke="#E8FF0022" strokeWidth="1" />
      <rect x="920" y="660" width="40" height="40" fill="none" stroke="#E8FF0022" strokeWidth="1" />

      {/* Header Organization info */}
      <text x="480" y="86" fill="#55557A" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">
        {orgName.toUpperCase()}  ·  {eventName.toUpperCase()}
      </text>
      <line x1="60" y1="104" x2="900" y2="104" stroke="#FFFFFF" strokeWidth="1" opacity="0.1" />

      {/* Certificate Title */}
      <text x="480" y="168" fill="#E8FF00" fontSize="62" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle" letterSpacing="3">
        CERTIFICATE
      </text>
      <text x="480" y="194" fill="#55557A" fontSize="12" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
        OF COMPLETION
      </text>
      <line x1="60" y1="210" x2="900" y2="210" stroke="#FFFFFF" strokeWidth="1" opacity="0.1" />

      {/* Context info */}
      <text x="480" y="244" fill="#55557A" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        presented to
      </text>

      {/* Recipient Name (with SVG filter glow!) */}
      <text x="480" y="302" fill="#FFFFFF" fontSize="50" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle" filter="url(#neonGlow)">
        {name}
      </text>

      <text x="480" y="338" fill="#55557A" fontSize="14" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
        for completing
      </text>

      {/* Event Name */}
      <text x="480" y="370" fill="#E8FF00" fontSize="24" fontWeight="bold" fontFamily="Georgia, serif" textAnchor="middle">
        {eventName}
      </text>

      {/* Extra Fields */}
      {extras.map(([k, v], idx) => (
        <text key={k} x="480" y={392 + idx * 16} fill="#333355" fontSize="10" fontFamily="monospace" textAnchor="middle">
          {k}: {String(v)}
        </text>
      ))}

      {/* Expiry Badge if applicable */}
      {cert.fields?.ExpiryDate && (
        <g transform="translate(800, 32)">
          <rect x="0" y="0" width="124" height="28" fill="none" stroke="#E8FF00" strokeWidth="1" opacity="0.4" />
          <text x="62" y="18" fill="#E8FF00" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            VALID TO: {cert.fields.ExpiryDate}
          </text>
        </g>
      )}

      {/* Meta details footer */}
      <g transform={`translate(480, ${426 + extras.length * 16})`} textAnchor="middle" fill="#333355" fontSize="10" fontFamily="monospace">
        <text y="0">{issued}  ·  ID: {certId}</text>
        <text y="14" fill="#222244" fontSize="8">SHA-256: {hash}</text>
      </g>

      {/* Signatures */}
      {parsedSigs.map((sig, i) => {
        const blockW = 840 / parsedSigs.length;
        const bx = 60 + i * blockW;
        const cx = bx + blockW / 2;
        const sigImg = sigImgs[i];

        return (
          <g key={i} transform="translate(0, 560)">
            {/* Signature image or typed */}
            {sigImg ? (
              <image href={sigImg} x={cx - 50} y="-30" width="100" height="36" preserveAspectRatio="xMidYMid meet" />
            ) : sig.signatureType === 'typed' && sig.signatureData ? (
              <text x={cx} y="2" fill="#FFFFFF" fontSize="22" fontStyle="italic" fontFamily="cursive" textAnchor="middle">
                {sig.signatureData}
              </text>
            ) : null}

            {/* Signature Line */}
            <line x1={bx + 15} y1="10" x2={bx + blockW - 15} y2="10" stroke="#E8FF00" strokeWidth="1" opacity="0.4" />

            {/* Signatory Name */}
            <text x={cx} y="24" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {(sig.name || '').toUpperCase()}
            </text>

            {/* Designation */}
            <text x={cx} y="36" fill="#7070A0" fontSize="9" fontStyle="italic" fontFamily="Georgia, serif" textAnchor="middle">
              {sig.designation || ''}
            </text>
          </g>
        );
      })}

      {/* Verify bottom bar */}
      <rect x="0" y="668" width="960" height="32" fill="#E8FF00" fillOpacity="0.1" />
      <text x="480" y="688" fill="#E8FF00" fillOpacity="0.4" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
        VERIFY: CERTXCHANGE.IN/VERIFY — {certId}
      </text>

      {/* Organization logos */}
      {logoUrls.map((url, i) => (
        <image key={url} href={url} x={480 - (logoUrls.length * 30) + i * 60} y="20" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
}
